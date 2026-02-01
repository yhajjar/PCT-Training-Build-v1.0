-- Create function to recalculate available slots based on active enrollments
CREATE OR REPLACE FUNCTION public.recalculate_available_slots()
RETURNS TRIGGER AS $$
DECLARE
    training_record RECORD;
    active_count INTEGER;
BEGIN
    -- Get the training_id depending on operation type
    IF TG_OP = 'DELETE' THEN
        -- For delete, use the OLD record
        SELECT * INTO training_record FROM public.trainings WHERE id = OLD.training_id;
    ELSE
        -- For insert/update, use the NEW record
        SELECT * INTO training_record FROM public.trainings WHERE id = NEW.training_id;
    END IF;
    
    -- If training doesn't exist, just return
    IF training_record IS NULL THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END IF;
    
    -- Count active registrations (exclude cancelled status)
    SELECT COUNT(*) INTO active_count
    FROM public.registrations
    WHERE training_id = training_record.id
      AND status NOT IN ('cancelled');
    
    -- Update the training's available_slots
    UPDATE public.trainings
    SET 
        available_slots = GREATEST(0, max_registrations - active_count),
        is_registration_open = CASE 
            WHEN max_registrations - active_count <= 0 THEN false
            ELSE is_registration_open
        END,
        updated_at = now()
    WHERE id = training_record.id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to recalculate slots on registration changes
DROP TRIGGER IF EXISTS trigger_recalculate_slots ON public.registrations;
CREATE TRIGGER trigger_recalculate_slots
    AFTER INSERT OR UPDATE OR DELETE ON public.registrations
    FOR EACH ROW
    EXECUTE FUNCTION public.recalculate_available_slots();

-- Also handle when max_registrations is updated on a training
CREATE OR REPLACE FUNCTION public.recalculate_slots_on_training_update()
RETURNS TRIGGER AS $$
DECLARE
    active_count INTEGER;
BEGIN
    -- Only recalculate if max_registrations changed
    IF OLD.max_registrations IS DISTINCT FROM NEW.max_registrations THEN
        -- Count active registrations
        SELECT COUNT(*) INTO active_count
        FROM public.registrations
        WHERE training_id = NEW.id
          AND status NOT IN ('cancelled');
        
        -- Update available_slots
        NEW.available_slots := GREATEST(0, NEW.max_registrations - active_count);
        
        -- Auto-close registration if full
        IF NEW.available_slots <= 0 THEN
            NEW.is_registration_open := false;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_training_slots_update ON public.trainings;
CREATE TRIGGER trigger_training_slots_update
    BEFORE UPDATE ON public.trainings
    FOR EACH ROW
    EXECUTE FUNCTION public.recalculate_slots_on_training_update();

-- Recalculate all existing trainings to sync with current registrations
DO $$
DECLARE
    t RECORD;
    active_count INTEGER;
BEGIN
    FOR t IN SELECT id, max_registrations FROM public.trainings LOOP
        SELECT COUNT(*) INTO active_count
        FROM public.registrations
        WHERE training_id = t.id
          AND status NOT IN ('cancelled');
        
        UPDATE public.trainings
        SET available_slots = GREATEST(0, t.max_registrations - active_count)
        WHERE id = t.id;
    END LOOP;
END $$;