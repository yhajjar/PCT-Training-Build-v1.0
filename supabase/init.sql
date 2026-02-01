-- Create app_role enum for role-based access control
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for secure role management (separate from profiles)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create profiles table for user metadata
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create trainings table
CREATE TABLE public.trainings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    short_description TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    time_from TEXT,
    time_to TEXT,
    duration TEXT,
    status TEXT NOT NULL DEFAULT 'Scheduled',
    available_slots INTEGER NOT NULL DEFAULT 0,
    max_registrations INTEGER NOT NULL DEFAULT 0,
    registration_method TEXT NOT NULL DEFAULT 'internal',
    external_link TEXT,
    hero_image TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_recommended BOOLEAN NOT NULL DEFAULT false,
    is_registration_open BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER,
    location TEXT,
    speakers TEXT,
    target_audience TEXT DEFAULT 'General',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on trainings
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;

-- Create training_attachments table
CREATE TABLE public.training_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    training_id UUID REFERENCES public.trainings(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on training_attachments
ALTER TABLE public.training_attachments ENABLE ROW LEVEL SECURITY;

-- Create registrations table
CREATE TABLE public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    training_id UUID REFERENCES public.trainings(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    participant_name TEXT NOT NULL,
    participant_email TEXT NOT NULL,
    participant_phone TEXT,
    registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'registered',
    attendance_status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    notified_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on registrations
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Create resources table
CREATE TABLE public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Guideline',
    file_url TEXT,
    external_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on resources
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Create training_updates table for activity feed
CREATE TABLE public.training_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    training_id UUID REFERENCES public.trainings(id) ON DELETE SET NULL,
    training_name TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    previous_value TEXT,
    new_value TEXT
);

-- Enable RLS on training_updates
ALTER TABLE public.training_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- user_roles: Users can read their own roles, admins can manage all
CREATE POLICY "Users can view own roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
    ON public.user_roles FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- profiles: Users can manage their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- categories: Public read, admin write
CREATE POLICY "Anyone can view categories"
    ON public.categories FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage categories"
    ON public.categories FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- trainings: Public read, admin write
CREATE POLICY "Anyone can view trainings"
    ON public.trainings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage trainings"
    ON public.trainings FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- training_attachments: Public read, admin write
CREATE POLICY "Anyone can view attachments"
    ON public.training_attachments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage attachments"
    ON public.training_attachments FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- registrations: Users see own, admins see all
CREATE POLICY "Users can view own registrations"
    ON public.registrations FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own registrations"
    ON public.registrations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registrations"
    ON public.registrations FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete registrations"
    ON public.registrations FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- resources: Public read, admin write
CREATE POLICY "Anyone can view resources"
    ON public.resources FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage resources"
    ON public.resources FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- training_updates: Public read, admin write
CREATE POLICY "Anyone can view training updates"
    ON public.training_updates FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage training updates"
    ON public.training_updates FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
    
    -- Grant 'user' role by default
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create timestamp triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trainings_updated_at
    BEFORE UPDATE ON public.trainings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
    BEFORE UPDATE ON public.resources
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();-- Create storage bucket for training attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'training-attachments', 
  'training-attachments', 
  true,
  5242880, -- 5MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
);

-- Policy: Anyone can view attachments (public bucket)
CREATE POLICY "Anyone can view training attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'training-attachments');

-- Policy: Admins can upload attachments
CREATE POLICY "Admins can upload training attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'training-attachments' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Policy: Admins can update attachments
CREATE POLICY "Admins can update training attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'training-attachments' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Policy: Admins can delete attachments
CREATE POLICY "Admins can delete training attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'training-attachments' 
  AND public.has_role(auth.uid(), 'admin')
);-- Drop existing restrictive policies that require auth
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage trainings" ON public.trainings;
DROP POLICY IF EXISTS "Admins can manage attachments" ON public.training_attachments;
DROP POLICY IF EXISTS "Admins can manage training updates" ON public.training_updates;
DROP POLICY IF EXISTS "Admins can manage resources" ON public.resources;
DROP POLICY IF EXISTS "Admins can delete registrations" ON public.registrations;
DROP POLICY IF EXISTS "Users can create own registrations" ON public.registrations;
DROP POLICY IF EXISTS "Users can update own registrations" ON public.registrations;
DROP POLICY IF EXISTS "Users can view own registrations" ON public.registrations;

-- Create new policies that allow public access (PIN protection is client-side)

-- Categories: Allow all operations
CREATE POLICY "Allow all category operations"
ON public.categories
FOR ALL
USING (true)
WITH CHECK (true);

-- Trainings: Allow all operations
CREATE POLICY "Allow all training operations"
ON public.trainings
FOR ALL
USING (true)
WITH CHECK (true);

-- Training attachments: Allow all operations
CREATE POLICY "Allow all attachment operations"
ON public.training_attachments
FOR ALL
USING (true)
WITH CHECK (true);

-- Training updates: Allow all operations
CREATE POLICY "Allow all training update operations"
ON public.training_updates
FOR ALL
USING (true)
WITH CHECK (true);

-- Resources: Allow all operations
CREATE POLICY "Allow all resource operations"
ON public.resources
FOR ALL
USING (true)
WITH CHECK (true);

-- Registrations: Allow all operations (public registration + admin management)
CREATE POLICY "Allow all registration operations"
ON public.registrations
FOR ALL
USING (true)
WITH CHECK (true);-- Drop existing restrictive storage policies if any
DROP POLICY IF EXISTS "Users can upload training files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update training files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete training files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view training files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- Create permissive policies for the training-attachments bucket
-- Allow anyone to view files (bucket is public)
CREATE POLICY "Public read access for training attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'training-attachments');

-- Allow anyone to upload files (PIN protection is client-side)
CREATE POLICY "Public upload access for training attachments"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'training-attachments');

-- Allow anyone to update files
CREATE POLICY "Public update access for training attachments"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'training-attachments');

-- Allow anyone to delete files
CREATE POLICY "Public delete access for training attachments"
ON storage.objects
FOR DELETE
USING (bucket_id = 'training-attachments');-- Create storage bucket for resources (tools & guidelines)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('resources', 'resources', true, 5242880, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'])
ON CONFLICT (id) DO NOTHING;

-- Create permissive policies for the resources bucket
CREATE POLICY "Public read access for resources"
ON storage.objects
FOR SELECT
USING (bucket_id = 'resources');

CREATE POLICY "Public upload access for resources"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'resources');

CREATE POLICY "Public update access for resources"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'resources');

CREATE POLICY "Public delete access for resources"
ON storage.objects
FOR DELETE
USING (bucket_id = 'resources');

-- Add file_path column to resources table for tracking storage paths
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS file_path text;-- Create function to recalculate available slots based on active enrollments
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
END $$;-- ==============================================
-- Security Fix: Fix storage bucket policies
-- ==============================================

-- Drop ALL existing storage policies for our buckets (both old and potential duplicates)
DROP POLICY IF EXISTS "Admins can upload training attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update training attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete training attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload resources" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update resources" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete resources" ON storage.objects;

-- Recreate admin-only write policies for training-attachments
CREATE POLICY "Admins can upload training attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'training-attachments' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update training attachments"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'training-attachments' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete training attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'training-attachments' AND has_role(auth.uid(), 'admin'));

-- Recreate admin-only write policies for resources
CREATE POLICY "Admins can upload resources"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resources' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update resources"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'resources' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete resources"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'resources' AND has_role(auth.uid(), 'admin'));-- ==============================================
-- Security Fix: Replace permissive RLS policies with proper admin-only policies
-- ==============================================

-- ==============================================
-- Categories: Drop permissive, add admin-only
-- ==============================================
DROP POLICY IF EXISTS "Allow all category operations" ON public.categories;

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ==============================================
-- Trainings: Drop permissive, add admin-only
-- ==============================================
DROP POLICY IF EXISTS "Allow all training operations" ON public.trainings;

CREATE POLICY "Admins can manage trainings"
  ON public.trainings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ==============================================
-- Training Attachments: Drop permissive, add admin-only
-- ==============================================
DROP POLICY IF EXISTS "Allow all attachment operations" ON public.training_attachments;

CREATE POLICY "Admins can manage attachments"
  ON public.training_attachments FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ==============================================
-- Registrations: Drop permissive, add proper policies
-- ==============================================
DROP POLICY IF EXISTS "Allow all registration operations" ON public.registrations;

-- Allow anyone to register for trainings (public insert)
CREATE POLICY "Anyone can register for trainings"
  ON public.registrations FOR INSERT
  WITH CHECK (true);

-- Admins can manage all registrations
CREATE POLICY "Admins can manage registrations"
  ON public.registrations FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ==============================================
-- Resources: Drop permissive, add admin-only
-- ==============================================
DROP POLICY IF EXISTS "Allow all resource operations" ON public.resources;

CREATE POLICY "Admins can manage resources"
  ON public.resources FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ==============================================
-- Training Updates: Drop permissive, add admin-only
-- ==============================================
DROP POLICY IF EXISTS "Allow all training update operations" ON public.training_updates;

CREATE POLICY "Admins can manage training updates"
  ON public.training_updates FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ==============================================
-- Page Content: Drop permissive, add proper policies
-- ==============================================
DROP POLICY IF EXISTS "Allow all page content operations" ON public.page_content;

-- Anyone can view published pages
CREATE POLICY "Anyone can view published pages"
  ON public.page_content FOR SELECT
  USING (is_published = true);

-- Admins can manage all page content
CREATE POLICY "Admins can manage page content"
  ON public.page_content FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ==============================================
-- Page Versions: Drop permissive, add admin-only
-- ==============================================
DROP POLICY IF EXISTS "Allow all page version operations" ON public.page_versions;

CREATE POLICY "Admins can manage page versions"
  ON public.page_versions FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));-- Add explicit SELECT policies for admins on tables they need to read
-- Registrations: Allow admins to view all registrations
CREATE POLICY "Admins can view all registrations"
  ON public.registrations FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Training Updates: Ensure admins can view all updates  
CREATE POLICY "Admins can view all training updates"
  ON public.training_updates FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));