import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Category, Training, Registration, Resource, TrainingUpdate } from '@/types/training';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchCategories,
  fetchTrainings,
  fetchRegistrations,
  fetchResources,
  fetchTrainingUpdates,
  createCategory,
  updateCategoryDb,
  deleteCategoryDb,
  createTraining,
  updateTrainingDb,
  deleteTrainingDb,
  createRegistration,
  updateRegistrationDb,
  deleteRegistrationDb,
  createResource,
  updateResourceDb,
  deleteResourceDb,
  createTrainingUpdate,
} from '@/lib/database';

interface TrainingContextType {
  categories: Category[];
  trainings: Training[];
  registrations: Registration[];
  resources: Resource[];
  trainingUpdates: TrainingUpdate[];
  isLoading: boolean;
  addCategory: (category: Omit<Category, 'id'>) => Promise<Category | null>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addTraining: (training: Omit<Training, 'id'>) => Promise<Training | null>;
  updateTraining: (training: Training) => Promise<void>;
  deleteTraining: (id: string) => Promise<void>;
  addRegistration: (registration: Omit<Registration, 'id'>) => Promise<Registration | null>;
  updateRegistration: (registration: Registration) => Promise<void>;
  deleteRegistration: (id: string) => Promise<void>;
  addResource: (resource: Omit<Resource, 'id'>) => Promise<Resource | null>;
  updateResource: (resource: Resource) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
  getTrainingById: (id: string) => Training | undefined;
  getRegistrationsByTrainingId: (trainingId: string) => Registration[];
  getFeaturedTrainings: () => Training[];
  getRecommendedTrainings: () => Training[];
  addTrainingUpdate: (update: Omit<TrainingUpdate, 'id' | 'timestamp'>) => Promise<void>;
  refreshData: () => Promise<void>;
}

const TrainingContext = createContext<TrainingContextType | undefined>(undefined);

export function TrainingProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [trainingUpdates, setTrainingUpdates] = useState<TrainingUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all data from database
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cats, trains, regs, res, updates] = await Promise.all([
        fetchCategories(),
        fetchTrainings(),
        fetchRegistrations(),
        fetchResources(),
        fetchTrainingUpdates(),
      ]);

      setCategories(cats);
      setTrainings(trains);
      setRegistrations(regs);
      setResources(res);
      setTrainingUpdates(updates);
    } catch (error) {
      console.error('Failed to load data:', error);
      // Set empty arrays on error - don't use mock data
      setCategories([]);
      setTrainings([]);
      setRegistrations([]);
      setResources([]);
      setTrainingUpdates([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data when user signs in (auth state changes)
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }
    
    // Only load data if user is authenticated
    if (user) {
      loadData();
    } else {
      // Clear data when user signs out
      setCategories([]);
      setTrainings([]);
      setRegistrations([]);
      setResources([]);
      setTrainingUpdates([]);
      setIsLoading(false);
    }
  }, [user, authLoading, loadData]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Category operations
  const addCategoryHandler = async (category: Omit<Category, 'id'>): Promise<Category | null> => {
    const created = await createCategory({ name: category.name, color: category.color });
    if (created) {
      setCategories(prev => [...prev, created]);
    }
    return created;
  };

  const updateCategoryHandler = async (category: Category) => {
    const success = await updateCategoryDb(category);
    if (success) {
      setCategories(prev => prev.map(c => c.id === category.id ? category : c));
    }
  };

  const deleteCategoryHandler = async (id: string) => {
    const success = await deleteCategoryDb(id);
    if (success) {
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  // Training operations
  const addTrainingHandler = async (training: Omit<Training, 'id'>): Promise<Training | null> => {
    const created = await createTraining(training);
    if (created) {
      setTrainings(prev => [...prev, created]);
    }
    return created;
  };

  const updateTrainingHandler = async (training: Training) => {
    const success = await updateTrainingDb(training);
    if (success) {
      setTrainings(prev => prev.map(t => t.id === training.id ? training : t));
    }
  };

  const deleteTrainingHandler = async (id: string) => {
    const success = await deleteTrainingDb(id);
    if (success) {
      setTrainings(prev => prev.filter(t => t.id !== id));
    }
  };

  // Registration operations
  const addRegistrationHandler = async (registration: Omit<Registration, 'id'>): Promise<Registration | null> => {
    const created = await createRegistration(registration);
    if (created) {
      setRegistrations(prev => [...prev, created]);
    }
    return created;
  };

  const updateRegistrationHandler = async (registration: Registration) => {
    const success = await updateRegistrationDb(registration);
    if (success) {
      setRegistrations(prev => prev.map(r => r.id === registration.id ? registration : r));
    }
  };

  const deleteRegistrationHandler = async (id: string) => {
    const success = await deleteRegistrationDb(id);
    if (success) {
      setRegistrations(prev => prev.filter(r => r.id !== id));
    }
  };

  // Resource operations
  const addResourceHandler = async (resource: Omit<Resource, 'id'>): Promise<Resource | null> => {
    const created = await createResource(resource);
    if (created) {
      setResources(prev => [...prev, created]);
    }
    return created;
  };

  const updateResourceHandler = async (resource: Resource) => {
    const success = await updateResourceDb(resource);
    if (success) {
      setResources(prev => prev.map(r => r.id === resource.id ? resource : r));
    }
  };

  const deleteResourceHandler = async (id: string) => {
    const success = await deleteResourceDb(id);
    if (success) {
      setResources(prev => prev.filter(r => r.id !== id));
    }
  };

  // Getter functions
  const getCategoryById = (id: string) => categories.find(c => c.id === id);
  const getTrainingById = (id: string) => trainings.find(t => t.id === id);
  const getRegistrationsByTrainingId = (trainingId: string) => 
    registrations.filter(r => r.trainingId === trainingId);
  const getFeaturedTrainings = () =>
    trainings.filter(t => t.isFeatured).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  const getRecommendedTrainings = () =>
    trainings.filter(t => t.isRecommended).slice(0, 4);

  // Training updates
  const addTrainingUpdateHandler = async (update: Omit<TrainingUpdate, 'id' | 'timestamp'>) => {
    const created = await createTrainingUpdate(update);
    if (created) {
      setTrainingUpdates(prev => [created, ...prev].slice(0, 50));
    }
  };

  return (
    <TrainingContext.Provider
      value={{
        categories,
        trainings,
        registrations,
        resources,
        trainingUpdates,
        isLoading,
        addCategory: addCategoryHandler,
        updateCategory: updateCategoryHandler,
        deleteCategory: deleteCategoryHandler,
        addTraining: addTrainingHandler,
        updateTraining: updateTrainingHandler,
        deleteTraining: deleteTrainingHandler,
        addRegistration: addRegistrationHandler,
        updateRegistration: updateRegistrationHandler,
        deleteRegistration: deleteRegistrationHandler,
        addResource: addResourceHandler,
        updateResource: updateResourceHandler,
        deleteResource: deleteResourceHandler,
        getCategoryById,
        getTrainingById,
        getRegistrationsByTrainingId,
        getFeaturedTrainings,
        getRecommendedTrainings,
        addTrainingUpdate: addTrainingUpdateHandler,
        refreshData,
      }}
    >
      {children}
    </TrainingContext.Provider>
  );
}

export function useTraining() {
  const context = useContext(TrainingContext);
  if (context === undefined) {
    throw new Error('useTraining must be used within a TrainingProvider');
  }
  return context;
}
