import React, { useState, useEffect, useRef } from 'react';
import { Home, PlusCircle, Activity, History as HistoryIcon, Dumbbell, Play, CheckCircle2, Clock, Calendar, ChevronRight, X, Save, Trash2, Pencil, User, TrendingUp, RotateCcw, BarChart2, Settings, GripVertical, Check } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { WorkoutPlan, WorkoutSession, Exercise, PlannedExercise, CompletedSet, CompletedExercise, UserProfile, Equipment, MuscleGroup } from './types';
import { EXERCISES, MOCK_PLANS } from './data';
import { supabase } from './lib/supabase';
import { supabaseService } from './services/supabaseService';

const DEFAULT_MUSCLE_GROUPS = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core', 'Cardio'];
const DEFAULT_EQUIPMENT = ['Halteres', 'Barra', 'Máquina', 'Peso Corporal', 'Cabos', 'Kettlebell'];

type View = 'dashboard' | 'builder' | 'active' | 'history' | 'profile' | 'exercises' | 'weekly-schedule' | 'settings';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [plans, setPlans] = useState<WorkoutPlan[]>(MOCK_PLANS);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>(EXERCISES);
  const [muscleGroups, setMuscleGroups] = useState<string[]>(DEFAULT_MUSCLE_GROUPS);
  const [equipmentList, setEquipmentList] = useState<string[]>(DEFAULT_EQUIPMENT);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    weight: 0,
    height: 0,
    age: 0,
    gender: 'other'
  });
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const [planToEdit, setPlanToEdit] = useState<WorkoutPlan | null>(null);
  const [dayToEdit, setDayToEdit] = useState<number | null>(null);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSupabaseLoaded, setIsSupabaseLoaded] = useState(false);
  const [showAuth, setShowAuth] = useState(true); // Controls if AuthView is shown
  const [supabaseSession, setSupabaseSession] = useState<any>(null);

  // Load from local storage and Supabase
  useEffect(() => {
    // Suppress specific Supabase errors that are noisy but handled
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      if (
        (typeof args[0] === 'string' && (args[0].includes('Refresh Token Not Found') || args[0].includes('Invalid Refresh Token'))) ||
        (args[0] && typeof args[0] === 'object' && args[0].message && (args[0].message.includes('Refresh Token Not Found') || args[0].message.includes('Invalid Refresh Token')))
      ) {
        return;
      }
      originalConsoleError(...args);
    };

    // Check Supabase session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        if (error.message.includes('Refresh Token Not Found') || error.message.includes('Invalid Refresh Token')) {
          // Expected error when session expires, handle gracefully
          console.log('Session expired, signing out.');
          supabase.auth.signOut();
          setSupabaseSession(null);
          setIsAuthenticated(false);
          setShowAuth(true);
        } else {
          console.error('Error getting session:', error);
        }
        return;
      }
      
      setSupabaseSession(session);
      if (session) {
        setIsAuthenticated(true);
        setShowAuth(false);
        
        // Update profile from metadata if available
        if (session.user.user_metadata?.full_name || session.user.email) {
           setUserProfile(prev => ({ 
             ...prev, 
             name: session.user.user_metadata?.full_name || prev.name, 
             email: session.user.email || prev.email 
           }));
        }

        // Fetch data from Supabase
        loadSupabaseData(session.user.id);
      }
    }).catch(err => {
      if (err?.message?.includes('Refresh Token Not Found') || err?.message?.includes('Invalid Refresh Token')) {
        console.log('Session expired (invalid refresh token), signing out.');
      } else {
        console.error('Unexpected error getting session:', err);
      }
      // Fallback to sign out if critical auth error
      supabase.auth.signOut();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseSession(session);
      if (session) {
        setIsAuthenticated(true);
        setShowAuth(false);
        
        // Update profile from metadata if available
        if (session.user.user_metadata?.full_name || session.user.email) {
           setUserProfile(prev => ({ 
             ...prev, 
             name: session.user.user_metadata?.full_name || prev.name, 
             email: session.user.email || prev.email 
           }));
        }

        loadSupabaseData(session.user.id);
      } else {
        // If logged out, maybe clear data or fall back to local?
        // We handle logout explicitly in handleLogout, but if session expires or user logs out elsewhere:
        // Ideally we should clear state here too if session becomes null.
        // But handleLogout calls signOut which triggers this.
      }
    });

    const savedPlans = localStorage.getItem('iron_plans');
    const savedSessions = localStorage.getItem('iron_sessions');
    const savedProfile = localStorage.getItem('iron_profile');
    const savedExercisesV2 = localStorage.getItem('iron_exercises_v2');
    const savedExercises = localStorage.getItem('iron_exercises');
    const savedMuscleGroups = localStorage.getItem('iron_muscle_groups');
    const savedEquipment = localStorage.getItem('iron_equipment');

    if (savedPlans) setPlans(JSON.parse(savedPlans));
    if (savedSessions) setSessions(JSON.parse(savedSessions));
    
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setUserProfile(profile);
      // If profile exists and has email/password, require login
      if (profile.email && profile.password) {
        // Only enforce local auth if not using Supabase
        if (!supabaseSession) {
          setIsAuthenticated(false);
          setShowAuth(true);
        }
      } else {
        if (profile.name) {
           setIsAuthenticated(true);
           setShowAuth(false);
        } else {
           setIsAuthenticated(false);
           setShowAuth(true);
        }
      }
    } else {
      if (!supabaseSession) {
        setIsAuthenticated(false);
        setShowAuth(true);
      }
    }
    
    if (savedExercisesV2) {
      setExercises(JSON.parse(savedExercisesV2));
    } else if (savedExercises) {
      const customExercises = JSON.parse(savedExercises);
      const defaultIds = new Set(EXERCISES.map(e => e.id));
      const newCustom = customExercises.filter((e: Exercise) => !defaultIds.has(e.id));
      setExercises([...EXERCISES, ...newCustom]);
    }
    
    if (savedMuscleGroups) setMuscleGroups(JSON.parse(savedMuscleGroups));
    if (savedEquipment) setEquipmentList(JSON.parse(savedEquipment));

    return () => {
      subscription.unsubscribe();
      console.error = originalConsoleError;
    };
  }, []);

  const handleAuthError = (error: any) => {
    if (error?.message?.includes('Refresh Token Not Found') || error?.message?.includes('Invalid Refresh Token')) {
      console.log('Session expired (invalid refresh token), signing out.');
      supabase.auth.signOut();
      setSupabaseSession(null);
      setIsAuthenticated(false);
      setShowAuth(true);
    } else {
      console.error('Supabase error:', error);
    }
  };

  const loadSupabaseData = async (userId: string) => {
    try {
      const plans = await supabaseService.getWorkoutPlans(userId);
      setPlans(plans);
      const exercises = await supabaseService.getExercises();
      if (exercises.length > 0) {
        setExercises(exercises);
      }
      const settings = await supabaseService.getUserSettings(userId);
      if (settings) {
        if (settings.muscleGroups.length > 0) setMuscleGroups(settings.muscleGroups);
        if (settings.equipment.length > 0) setEquipmentList(settings.equipment);
        setUserProfile(prev => ({
          ...prev,
          name: settings.name || prev.name,
          weight: settings.weight || prev.weight,
          height: settings.height || prev.height,
          age: settings.age || prev.age,
          gender: (settings.gender as any) || prev.gender,
          activityLevel: (settings.activityLevel as any) || prev.activityLevel,
          goal: (settings.goal as any) || prev.goal,
          trainingStartDay: settings.trainingStartDay,
          weeklyTrainingGoal: settings.weeklyTrainingGoal
        }));
      }
      setIsSupabaseLoaded(true);
    } catch (error) {
      handleAuthError(error);
      setIsSupabaseLoaded(true);
    }
  };

  // Save to local storage
useEffect(() => {
    if (!isSupabaseLoaded) return;
    try {
      localStorage.setItem('iron_plans', JSON.stringify(plans));
      localStorage.setItem('iron_sessions', JSON.stringify(sessions));
      localStorage.setItem('iron_profile', JSON.stringify(userProfile));
      localStorage.setItem('iron_muscle_groups', JSON.stringify(muscleGroups));
      localStorage.setItem('iron_equipment', JSON.stringify(equipmentList));
      
      // Save all exercises to v2
      localStorage.setItem('iron_exercises_v2', JSON.stringify(exercises));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      // If quota exceeded, we might want to alert the user or handle it gracefully
      // For now, just logging to prevent crash
    }
    // Save settings to Supabase
    if (supabaseSession) {
      supabaseService.saveUserSettings(supabaseSession.user.id, {
        muscleGroups,
        equipment: equipmentList,
        trainingStartDay: userProfile.trainingStartDay,
        weeklyTrainingGoal: userProfile.weeklyTrainingGoal,
        name: userProfile.name,
        weight: userProfile.weight,
        height: userProfile.height,
        age: userProfile.age,
        gender: userProfile.gender,
        activityLevel: userProfile.activityLevel,
        goal: userProfile.goal
      }).catch(handleAuthError);
    }
  }, [plans, sessions, userProfile, exercises, muscleGroups, equipmentList, isSupabaseLoaded]);
      
  const addExercise = async (exercise: Exercise) => {
    // Optimistic update with temp ID
    setExercises(prev => [...prev, exercise]);

    if (supabaseSession) {
      try {
        const realId = await supabaseService.ensureExercise(exercise);
        // Update with real ID
        setExercises(prev => prev.map(e => e.id === exercise.id ? { ...e, id: realId } : e));
      } catch (e) {
        handleAuthError(e);
        // Revert optimistic update on error? Or just let it fail silently but keep local?
        // For now, let's keep local but maybe show error
        console.error('Failed to save exercise to Supabase', e);
      }
    }
  };

  const editExercise = async (exercise: Exercise) => {
    setExercises(prev => prev.map(e => e.id === exercise.id ? exercise : e));

    if (supabaseSession) {
      try {
        await supabaseService.updateExercise(exercise);
      } catch (e) {
        handleAuthError(e);
      }
    }
  };

  const deleteExercise = async (id: string) => {
    // Optimistic update
    const exerciseToDelete = exercises.find(e => e.id === id);
    if (!exerciseToDelete) return; // Should not happen

    setExercises(prev => prev.filter(e => e.id !== id));

    if (supabaseSession) {
      // If it's a temporary ID, we don't need to delete from Supabase
      if (id.startsWith('custom_')) return;

      try {
        const deleted = await supabaseService.deleteExercise(id);
        
        if (!deleted) {
          // If not deleted from DB (e.g. system exercise or RLS), revert
          console.warn('Exercise not deleted from DB (likely system default or permission denied)');
          setExercises(prev => [...prev, exerciseToDelete]);
          alert('Não é possível excluir este exercício (pode ser um exercício padrão do sistema).');
        }
      } catch (e: any) {
        console.error('Failed to delete exercise:', e);
        // Revert optimistic update
        setExercises(prev => [...prev, exerciseToDelete]);
        
        if (e?.code === '23503') {
          alert('Não é possível excluir este exercício pois ele está sendo usado em um ou mais treinos.');
        } else {
          alert('Erro ao excluir exercício. Tente novamente.');
        }
      }
    }
  };

  const savePlan = async (plan: WorkoutPlan) => {
    // Preserve existing daysOfWeek if plan already exists
    const existingPlan = plans.find(p => p.id === plan.id);
    const planWithDays = {
      ...plan,
      daysOfWeek: plan.daysOfWeek.length > 0 ? plan.daysOfWeek : (existingPlan?.daysOfWeek || [])
    };

    // Optimistic update
    setPlans(prev => {
      const exists = prev.find(p => p.id === plan.id);
      if (exists) {
        return prev.map(p => p.id === plan.id ? planWithDays : p);
      }
      return [...prev, planWithDays];
    });
    setPlanToEdit(null);
    setCurrentView('dashboard');

    if (supabaseSession) {
      try {
        // Ensure all exercises in the plan have valid UUIDs
        const updatedExercises = await Promise.all(plan.exercises.map(async (pe) => {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pe.exerciseId);
          if (isUuid) return pe;

          // Find the full exercise details
          const exerciseDetails = exercises.find(e => e.id === pe.exerciseId);
          if (!exerciseDetails) {
            console.warn(`Exercise details not found for ID: ${pe.exerciseId}`);
            return pe; // Can't fix it if we don't have details
          }

          // Get or create real UUID from Supabase
          const realId = await supabaseService.ensureExercise(exerciseDetails);
          
          // Update local exercises list with the new ID to prevent future lookups
          setExercises(prev => prev.map(e => e.id === pe.exerciseId ? { ...e, id: realId } : e));
          
          return { ...pe, exerciseId: realId };
        }));

        const planToSave = { ...planWithDays, exercises: updatedExercises };

        // Check if ID is a valid UUID (simple regex check)
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(planToSave.id);
        
        if (isUuid) {
           await supabaseService.updateWorkoutPlan(planToSave);
           setPlans(prev => prev.map(p => p.id === plan.id ? planToSave : p));
        } else {
           // If not a UUID (e.g. 'p1', 'p2'), create as new in Supabase
           // and update local state with the real ID
           const newPlan = await supabaseService.createWorkoutPlan(planToSave, supabaseSession.user.id);
           setPlans(prev => prev.map(p => p.id === plan.id ? { ...newPlan, id: newPlan.id } : p));
        }
      } catch (e) {
        handleAuthError(e);
      }
    }
  };

  const deletePlan = (id: string) => {
    setPlanToDelete(id);
  };

  const confirmDelete = async () => {
    if (planToDelete) {
      const id = planToDelete;
      setPlans(prev => prev.filter(p => p.id !== id));
      setPlanToDelete(null);

      if (supabaseSession) {
        try {
          await supabaseService.deleteWorkoutPlan(id);
        } catch (e) {
          handleAuthError(e);
        }
      }
    }
  };

  const editPlan = (plan: WorkoutPlan) => {
    setPlanToEdit(plan);
    setCurrentView('builder');
  };

  const togglePlanDay = (planId: string, day: number) => {
    const updatedPlans = plans.map(p => {
      if (p.id === planId) {
        const newDays = p.daysOfWeek.includes(day)
          ? p.daysOfWeek.filter(d => d !== day)
          : [...p.daysOfWeek, day].sort();
        return { ...p, daysOfWeek: newDays };
      }
      return p;
    });
    setPlans(updatedPlans);
    
    // Sync update to Supabase if logged in
    if (supabaseSession) {
      const plan = updatedPlans.find(p => p.id === planId);
      if (plan) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(plan.id);
        if (isUuid) {
          supabaseService.updateWorkoutPlan(plan).catch(handleAuthError);
        } else {
           // If it's a mock plan (e.g. 'p1'), create it in Supabase
           supabaseService.createWorkoutPlan(plan, supabaseSession.user.id)
            .then(newPlan => {
               // Replace the mock plan with the real one from DB
               setPlans(prev => prev.map(p => p.id === plan.id ? newPlan : p));
            })
            .catch(handleAuthError);
        }
      }
    }
  };
const resumeWorkout = () => {
    const savedState = localStorage.getItem('iron_active_workout_state');
    if (savedState) {
      const state = JSON.parse(savedState);
      const plan = plans.find(p => p.id === state.planId);
      if (plan) {
        setActivePlan(plan);
        setCurrentView('active');
      }
    }
  };

  useEffect(() => {
    const savedState = localStorage.getItem('iron_active_workout_state');
    if (savedState && isSupabaseLoaded && !showAuth) {
      const state = JSON.parse(savedState);
      const plan = plans.find(p => p.id === state.planId);
      if (plan) {
        setActivePlan(plan);
        setCurrentView('active');
      }
    }
  }, [isSupabaseLoaded, showAuth]);
  const startWorkout = (plan: WorkoutPlan) => {
    setActivePlan(plan);
    setCurrentView('active');
    localStorage.setItem('iron_active_workout', JSON.stringify({ planId: plan.id, startedAt: new Date().toISOString() }));
  };

  const finishWorkout = async (session: WorkoutSession) => {
    setSessions(prev => [session, ...prev]);
    setActivePlan(null);
    setCurrentView('dashboard');
    localStorage.removeItem('iron_active_workout');

    if (supabaseSession) {
      try {
        await supabaseService.saveWorkoutSession(session, supabaseSession.user.id);
      } catch (e) {
        handleAuthError(e);
      }
    }
  };

  const clearHistory = () => {
    setSessions([]);
  };

  const handleLogin = async (email: string, pass: string) => {
    // Try Supabase login first
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (!error) {
        return true;
      }
      // If Supabase fails, fall back to local auth (legacy)
      console.log('Supabase login failed, trying local:', error.message);
    } catch (e) {
      handleAuthError(e);
    }

    if (userProfile.email === email && userProfile.password === pass) {
      setIsAuthenticated(true);
      setShowAuth(false);
      return true;
    }
    return false;
  };

  const handleCreateAccount = async (profile: UserProfile): Promise<boolean> => {
    // Try Supabase signup
    if (profile.email && profile.password) {
      try {
        const { error } = await supabase.auth.signUp({
          email: profile.email,
          password: profile.password,
          options: {
            data: {
              full_name: profile.name,
            }
          }
        });
        if (error) {
          console.error('Supabase signup error:', error.message);
          alert('Erro ao criar conta no Supabase: ' + error.message);
          return false; // Don't proceed to local if Supabase fails (to avoid confusion)
        }
        alert('Conta criada! Verifique seu email para confirmar.');
        return true;
      } catch (e) {
        handleAuthError(e);
        return false;
      }
    }

    // Local fallback (legacy)
    setUserProfile(profile);
    setIsAuthenticated(true);
    setShowAuth(false);
    return true;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSupabaseSession(null);
    setIsAuthenticated(false);
    setShowAuth(true);
    
    // Clear local state
    setPlans([]);
    setSessions([]);
    setExercises(EXERCISES); // Reset to defaults
    setUserProfile({ name: '', email: '', password: '' });
    
    // Clear local storage
    localStorage.removeItem('iron_plans');
    localStorage.removeItem('iron_sessions');
    localStorage.removeItem('iron_profile');
    localStorage.removeItem('iron_exercises');
    localStorage.removeItem('iron_exercises_v2');
    localStorage.removeItem('iron_muscle_groups');
    localStorage.removeItem('iron_equipment');
    localStorage.removeItem('iron_active_workout');
  };



  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-brand-500/30">
      <main className="pb-24 max-w-md mx-auto min-h-screen relative overflow-hidden">
        <AnimatePresence mode="wait">
          {showAuth ? (
            <AuthView 
              key="auth"
              onLogin={handleLogin}
              onCreateAccount={handleCreateAccount}
              existingProfile={userProfile}
            />
          ) : (
            <>
              {currentView === 'dashboard' && (
                <DashboardView 
                  key="dashboard" 
                  plans={plans} 
                  sessions={sessions}
                  availableExercises={exercises}
                  userProfile={userProfile}
                  onStartWorkout={startWorkout} 
                  onNewPlan={() => {
                    setPlanToEdit(null);
                    setCurrentView('builder');
                  }}
                  onEditPlan={editPlan}
                  onDeletePlan={deletePlan}
                  onEditDay={(day) => {
                    setDayToEdit(day);
                    setCurrentView('weekly-schedule');
                  }}
                  onOpenSettings={() => setCurrentView('settings')}
                />
              )}

              {currentView === 'settings' && (
                <SettingsView 
                  key="settings"
                  onBack={() => setCurrentView('dashboard')}
                  profile={userProfile}
                  onUpdateProfile={setUserProfile}
                />
              )}
              {currentView === 'weekly-schedule' && dayToEdit !== null && (
                <WeeklyScheduleView
                  key="weekly-schedule"
              day={dayToEdit}
              allPlans={plans}
              availableExercises={exercises}
              onTogglePlanDay={togglePlanDay}
              onBack={() => {
                setDayToEdit(null);
                setCurrentView('dashboard');
              }}
            />
          )}
          {currentView === 'builder' && (
            <BuilderView 
              key="builder" 
              initialPlan={planToEdit}
              availableExercises={exercises}
              onAddExercise={addExercise}
              onSave={savePlan}
              onCancel={() => {
                setPlanToEdit(null);
                setCurrentView('dashboard');
              }}
            />
          )}
          {currentView === 'active' && activePlan && (
            <ActiveWorkoutView 
              key="active" 
              plan={activePlan} 
              availableExercises={exercises}
              weightIncrement={userProfile.weightIncrement || 1}
              onFinish={finishWorkout}
              onCancel={() => {
                setActivePlan(null);
                setCurrentView('dashboard');
              }}
            />
          )}
          {currentView === 'history' && (
            <HistoryView 
              key="history" 
              sessions={sessions} 
              plans={plans}
              availableExercises={exercises}
              onClearHistory={clearHistory}
            />
          )}
          {currentView === 'exercises' && (
            <ExercisesView 
              key="exercises"
              exercises={exercises}
              muscleGroups={muscleGroups}
              equipmentList={equipmentList}
              onAddExercise={addExercise}
              onEditExercise={editExercise}
              onDeleteExercise={deleteExercise}
              onUpdateMuscleGroups={setMuscleGroups}
              onUpdateEquipment={setEquipmentList}
            />
          )}
          {currentView === 'profile' && (
            <ProfileView 
              key="profile" 
              profile={userProfile} 
              onSave={setUserProfile}
              onLogout={handleLogout}
            />
          )}
          </>
        )}
        </AnimatePresence>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {planToDelete && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setPlanToDelete(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-xl"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold mb-2">Excluir Treino?</h3>
                <p className="text-zinc-400 mb-6">Esta ação não pode ser desfeita. O histórico de treinos realizados será mantido.</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setPlanToDelete(null)}
                    className="flex-1 py-3 rounded-xl font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="flex-1 py-3 rounded-xl font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      {currentView !== 'active' && !showAuth && (
        <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800/50 pb-[env(safe-area-inset-bottom)]">
          <div className="max-w-md mx-auto grid grid-cols-5 items-center p-4">
            <NavItem 
              icon={<Home size={24} />} 
              label="Início" 
              isActive={currentView === 'dashboard'} 
              onClick={() => setCurrentView('dashboard')} 
            />
            <NavItem 
              icon={<PlusCircle size={24} />} 
              label="Criar" 
              isActive={currentView === 'builder'} 
              onClick={() => setCurrentView('builder')} 
            />
            <NavItem 
              icon={<Dumbbell size={24} />} 
              label="Exercícios" 
              isActive={currentView === 'exercises'} 
              onClick={() => setCurrentView('exercises')} 
            />
            <NavItem 
              icon={<BarChart2 size={24} />} 
              label="Progresso" 
              isActive={currentView === 'history'} 
              onClick={() => setCurrentView('history')} 
            />
            <NavItem 
              icon={<User size={24} />} 
              label="Perfil" 
              isActive={currentView === 'profile'} 
              onClick={() => setCurrentView('profile')} 
            />
          </div>
        </nav>
      )}
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      aria-label={label}
      className={`flex flex-col items-center justify-center gap-1 transition-colors w-full ${isActive ? 'text-brand-400' : 'text-zinc-500 hover:text-zinc-300'}`}
    >
      {icon}
    </button>
  );
}

// --- Dashboard View ---
function DashboardView({ 
  plans, 
  sessions, 
  availableExercises, 
  userProfile,
  onStartWorkout, 
  onNewPlan, 
  onEditPlan, 
  onDeletePlan,
  onEditDay,
  onOpenSettings
}: { 
  plans: WorkoutPlan[], 
  sessions: WorkoutSession[], 
  availableExercises: Exercise[], 
  userProfile: UserProfile,
  onStartWorkout: (p: WorkoutPlan) => void, 
  onNewPlan: () => void, 
  onEditPlan: (p: WorkoutPlan) => void, 
  onDeletePlan: (id: string) => void, 
  onEditDay: (day: number) => void,
  onOpenSettings: () => void,
  key?: React.Key 
}) {
  const today = new Date().getDay();
  
  const [time, setTime] = useState(new Date());
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [isWeek1Expanded, setIsWeek1Expanded] = useState(true);
  const [isWeek2Expanded, setIsWeek2Expanded] = useState(true);
  const [isAllWorkoutsExpanded, setIsAllWorkoutsExpanded] = useState(true);
  const [reactivatedPlans, setReactivatedPlans] = useState<string[]>([]);
  const daysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const fullDaysMap = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  const week1DateInputRef = useRef<HTMLInputElement>(null);

  const [week1StartDate, setWeek1StartDate] = useState(() => {
    const savedDate = localStorage.getItem('iron_week1_start_date');
    if (savedDate) {
      return new Date(savedDate);
    }
    const now = new Date();
    const currentDay = now.getDay(); // 0-6, 0 is Sun
    const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysSinceMonday);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const getDayDate = (dayIndex: number) => {
    const target = new Date(week1StartDate);
    let offset = 0;
    
    if (dayIndex === 0) offset = 6; // Sunday Week 1
    else if (dayIndex === 7) offset = 13; // Sunday Week 2
    else if (dayIndex >= 1 && dayIndex <= 6) offset = dayIndex - 1; // Mon-Sat Week 1
    else if (dayIndex >= 8 && dayIndex <= 13) offset = dayIndex - 1; // Mon-Sat Week 2
    
    target.setDate(week1StartDate.getDate() + offset);
    return target;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.valueAsDate) {
      // Adjust to local timezone to avoid off-by-one errors due to UTC conversion
      const date = new Date(e.target.valueAsDate);
      const userTimezoneOffset = date.getTimezoneOffset() * 60000;
      const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
      setWeek1StartDate(adjustedDate);
      localStorage.setItem('iron_week1_start_date', adjustedDate.toISOString());
    }
  };
  const week2StartDate = new Date(week1StartDate);
  week2StartDate.setDate(week1StartDate.getDate() + 7);

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const weekStart = new Date(week1StartDate);
  weekStart.setHours(0, 0, 0, 0);
  const isWeek1 = now >= weekStart && now < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const dayOfWeek = today;
  const week2Day = today + 7;

  const todaysPlans = plans.filter(p => {
    if (isWeek1) return p.daysOfWeek.includes(dayOfWeek);
    else return p.daysOfWeek.includes(week2Day);
  });
  const getDayStatus = (dayIndex: number, dayPlans: WorkoutPlan[]) => {
    if (dayPlans.length === 0) return { isCompleted: false, isMissed: false };
    
    const date = getDayDate(dayIndex);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const isCompleted = dayPlans.some(plan => {
      return sessions.some(s => {
        const sDate = new Date(s.startTime);
        return s.planId === plan.id && 
               sDate.getDate() === date.getDate() &&
               sDate.getMonth() === date.getMonth() &&
               sDate.getFullYear() === date.getFullYear();
      });
    });
  
    const isMissed = !isCompleted && date < now;
  
    return { isCompleted, isMissed };
  };

  const isPlanCompletedToday = (planId: string) => {
    if (reactivatedPlans.includes(planId)) return false;
    const now = new Date();
    return sessions.some(s => {
      const sDate = new Date(s.startTime);
      return s.planId === planId && 
             sDate.getDate() === now.getDate() &&
             sDate.getMonth() === now.getMonth() &&
             sDate.getFullYear() === now.getFullYear();
    });
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 space-y-8"
    >
      <header className="pt-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter">Iron<span className="text-brand-500">Track</span></h1>
          <p className="text-zinc-400 mt-2 font-mono text-sm">SUA ROTINA DE FORÇA</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <div className="text-sm font-bold text-zinc-100 tracking-tight uppercase flex items-center gap-2">
              {time.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
              <span className="text-brand-500">{time.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
            </div>
            <div className="text-xs font-mono text-zinc-500 bg-zinc-900/80 px-2 py-1 rounded-md border border-zinc-800 flex items-center gap-1.5">
              <Clock size={10} />
              {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          
          <button 
            onClick={onOpenSettings}
            className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:border-brand-500 hover:text-brand-500 transition-colors text-zinc-400"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="text-brand-500" size={20} />
            Treino de Hoje
          </h2>
        </div>
        
        {todaysPlans.length > 0 ? (
          <div className="space-y-4">
            {todaysPlans.map(plan => (
              <PlanCard 
                key={plan.id} 
                plan={plan} 
                availableExercises={availableExercises}
                isCompleted={isPlanCompletedToday(plan.id)}
                onActivate={() => setReactivatedPlans(prev => [...prev, plan.id])}
                onStart={() => onStartWorkout(plan)} 
                onEdit={() => onEditPlan(plan)}
                onDelete={() => onDeletePlan(plan.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-center">
            <Dumbbell className="mx-auto text-zinc-600 mb-3" size={32} />
            <p className="text-zinc-400 mb-4">Nenhum treino programado para hoje.</p>
            <button 
              onClick={() => setShowPlanSelector(true)}
              className="bg-zinc-800 text-zinc-200 px-4 py-2 rounded-full text-sm font-medium hover:bg-zinc-700 transition-colors"
            >
              Selecionar Treino
            </button>
          </div>
        )}
      </section>

      <section>
        <div className="w-full flex items-center justify-between mb-4 group">
          <button 
            onClick={() => setIsWeek1Expanded(!isWeek1Expanded)}
            className="flex items-center gap-2"
          >
            <h2 className="text-xl font-semibold">Semana 01</h2>
            <ChevronRight 
              className={`text-zinc-500 group-hover:text-zinc-300 transition-transform duration-200 ${isWeek1Expanded ? 'rotate-90' : ''}`} 
              size={20} 
            />
          </button>
          <div 
            className="relative group/date cursor-pointer"
            onClick={() => {
              try {
                week1DateInputRef.current?.showPicker();
              } catch (error) {
                console.log('showPicker not supported', error);
                week1DateInputRef.current?.focus();
              }
            }}
          >
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-brand-500/50 rounded-lg px-3 py-1.5 transition-colors pointer-events-none">
              <Calendar size={14} className="text-brand-500" />
              <span className="text-zinc-300 font-mono text-sm font-medium">
                {week1StartDate.getDate().toString().padStart(2, '0')}
              </span>
            </div>
            <input
              ref={week1DateInputRef}
              type="date"
              className="absolute inset-0 opacity-0 w-full h-full pointer-events-none"
              onChange={handleDateChange}
              value={week1StartDate.toISOString().split('T')[0]}
            />
          </div>
        </div>
        <AnimatePresence>
          {isWeek1Expanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 gap-2">
                {[1, 2, 3, 4, 5, 6, 0].map(day => { // Start from Monday (1) to Sunday (0)
                  const dayPlans = plans.filter(p => p.daysOfWeek.includes(day));
                  const { isCompleted, isMissed } = getDayStatus(day, dayPlans);
                  
                  return (
                    <div key={day} className={`bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center justify-between transition-all ${isCompleted || isMissed || dayPlans.length === 0 ? 'opacity-60' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-brand-500 shrink-0 w-24">{fullDaysMap[day]}</h3>
                          <div className="flex-1 min-w-0 flex flex-wrap gap-x-3 gap-y-1 items-center">
                            {dayPlans.length > 0 ? (
                              <>
                                {dayPlans.map(plan => (
                                  <span key={plan.id} className="text-zinc-400 text-xs truncate flex items-center gap-1">
                                    <div className="w-1 h-1 rounded-full bg-brand-500/50" />
                                    {plan.name}
                                  </span>
                                ))}
                                {isMissed && (
                                  <span className="text-red-500 text-[10px] font-bold uppercase tracking-wider ml-2">
                                    Treino não realizado
                                  </span>
                                )}
                                {isCompleted && (
                                  <span className="text-green-500 text-[10px] font-bold uppercase tracking-wider ml-2">
                                    Treino Finalizado
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-brand-500 text-xs italic">Descanso</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => onEditDay(day)}
                        className="text-zinc-600 hover:text-zinc-300 p-1.5 ml-2 rounded-full hover:bg-zinc-800 transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section>
        <div className="w-full flex items-center justify-between mb-4 group">
          <button 
            onClick={() => setIsWeek2Expanded(!isWeek2Expanded)}
            className="flex items-center gap-2"
          >
            <h2 className="text-xl font-semibold">Semana 02</h2>
            <ChevronRight 
              className={`text-zinc-500 group-hover:text-zinc-300 transition-transform duration-200 ${isWeek2Expanded ? 'rotate-90' : ''}`} 
              size={20} 
            />
          </button>
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 opacity-60">
            <Calendar size={14} className="text-zinc-500" />
            <span className="text-zinc-500 font-mono text-sm font-medium">
              {week2StartDate.getDate().toString().padStart(2, '0')}
            </span>
          </div>
        </div>
        <AnimatePresence>
          {isWeek2Expanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 gap-2">
                {[8, 9, 10, 11, 12, 13, 7].map(day => { // Start from Monday (8) to Sunday (7)
                  const dayPlans = plans.filter(p => p.daysOfWeek.includes(day));
                  const { isCompleted, isMissed } = getDayStatus(day, dayPlans);

                  return (
                    <div key={day} className={`bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center justify-between transition-all ${isCompleted || isMissed || dayPlans.length === 0 ? 'opacity-60' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-brand-500 shrink-0 w-24">{fullDaysMap[day % 7]}</h3>
                          <div className="flex-1 min-w-0 flex flex-wrap gap-x-3 gap-y-1 items-center">
                            {dayPlans.length > 0 ? (
                              <>
                                {dayPlans.map(plan => (
                                  <span key={plan.id} className="text-zinc-400 text-xs truncate flex items-center gap-1">
                                    <div className="w-1 h-1 rounded-full bg-brand-500/50" />
                                    {plan.name}
                                  </span>
                                ))}
                                {isMissed && (
                                  <span className="text-red-500 text-[10px] font-bold uppercase tracking-wider ml-2">
                                    Treino não realizado
                                  </span>
                                )}
                                {isCompleted && (
                                  <span className="text-green-500 text-[10px] font-bold uppercase tracking-wider ml-2">
                                    Treino Finalizado
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-brand-500 text-xs italic">Descanso</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => onEditDay(day)}
                        className="text-zinc-600 hover:text-zinc-300 p-1.5 ml-2 rounded-full hover:bg-zinc-800 transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section>
        <button 
          onClick={() => setIsAllWorkoutsExpanded(!isAllWorkoutsExpanded)}
          className="w-full flex items-center justify-between mb-4 group"
        >
          <h2 className="text-xl font-semibold">Todos os Treinos</h2>
          <ChevronRight 
            className={`text-zinc-500 group-hover:text-zinc-300 transition-transform duration-200 ${isAllWorkoutsExpanded ? 'rotate-90' : ''}`} 
            size={20} 
          />
        </button>
        <AnimatePresence>
          {isAllWorkoutsExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-2">
                {plans.map(plan => (
                  <PlanCard 
                    key={plan.id} 
                    plan={plan} 
                    availableExercises={availableExercises}
                    onStart={() => onStartWorkout(plan)} 
                    onEdit={() => onEditPlan(plan)}
                    onDelete={() => onDeletePlan(plan.id)}
                    compact={true}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>



      {/* Plan Selector Modal */}
      <AnimatePresence>
        {showPlanSelector && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowPlanSelector(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-xl max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Selecionar Treino</h3>
                <button onClick={() => setShowPlanSelector(false)} className="p-2 bg-zinc-800 rounded-full">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-3">
                {todaysPlans.length > 0 ? (
                  todaysPlans.map(plan => (
                    <button 
                      key={plan.id}
                      onClick={() => {
                        onStartWorkout(plan);
                        setShowPlanSelector(false);
                      }}
                      className="w-full flex items-center justify-between bg-zinc-950 border border-zinc-800 p-4 rounded-xl hover:border-brand-500/50 transition-colors text-left group"
                    >
                      <div>
                        <div className="font-semibold group-hover:text-brand-400 transition-colors">{plan.name}</div>
                        <div className="text-xs text-zinc-500 font-mono mt-1">{plan.exercises.length} exercícios</div>
                      </div>
                      <Play className="text-zinc-500 group-hover:text-brand-500" size={20} />
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    Nenhum treino agendado para hoje.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Weekly Schedule View ---
function WeeklyScheduleView({ 
  day, 
  allPlans, 
  availableExercises,
  onTogglePlanDay, 
  onBack 
}: { 
  day: number, 
  allPlans: WorkoutPlan[], 
  availableExercises: Exercise[],
  onTogglePlanDay: (planId: string, day: number) => void, 
  onBack: () => void,
  key?: React.Key
}) {
  const fullDaysMap = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const dayPlans = allPlans.filter(p => p.daysOfWeek.includes(day));

  const renderExercisesList = (plan: WorkoutPlan) => (
    <div className="mt-2 space-y-1 pl-1">
      {plan.exercises.map((ex, idx) => {
        const exerciseName = availableExercises.find(e => e.id === ex.exerciseId)?.name || 'Exercício desconhecido';
        return (
          <div key={ex.id} className="text-xs text-zinc-500 flex items-center gap-2">
            <span className="text-zinc-600 font-mono w-3 text-right">{idx + 1}.</span>
            <span>{exerciseName}</span>
          </div>
        );
      })}
      {plan.exercises.length === 0 && (
        <div className="text-xs text-zinc-600 italic pl-5">Nenhum exercício</div>
      )}
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 min-h-screen bg-zinc-950"
    >
      <header className="flex items-center gap-4 mb-8 pt-4">
        <button 
          onClick={onBack}
          className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronRight className="rotate-180" size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Editar Agenda</h1>
          <p className="text-brand-500 font-medium">
            {day > 6 ? `Semana 02 - ${fullDaysMap[day % 7]}` : `Semana 01 - ${fullDaysMap[day]}`}
          </p>
        </div>
      </header>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="text-brand-500" size={20} />
            Treinos do Dia
          </h2>
          {dayPlans.length > 0 ? (
            <div className="space-y-3">
              {dayPlans.map(plan => (
                <div key={plan.id} className="bg-zinc-900 border border-brand-500/30 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{plan.name}</span>
                    <button 
                      onClick={() => onTogglePlanDay(plan.id, day)}
                      className="text-red-400 hover:text-red-300 p-2"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  {renderExercisesList(plan)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-zinc-500 italic p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50 text-center">
              Nenhum treino selecionado para este dia.
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Dumbbell className="text-zinc-500" size={20} />
            Todos os Treinos
          </h2>
          <div className="space-y-3">
            {allPlans.map(plan => {
              const isSelected = plan.daysOfWeek.includes(day);
              return (
                <button
                  key={plan.id}
                  onClick={() => onTogglePlanDay(plan.id, day)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected 
                      ? 'bg-brand-500/10 border-brand-500/50 text-brand-400' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{plan.name}</span>
                    {isSelected ? (
                      <CheckCircle2 size={20} className="text-brand-500" />
                    ) : (
                      <PlusCircle size={20} className="text-zinc-600" />
                    )}
                  </div>
                  {renderExercisesList(plan)}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </motion.div>
  );
}

function PlanCard({ plan, availableExercises, onStart, onEdit, onDelete, isCompleted, onActivate, compact = false }: { plan: WorkoutPlan, availableExercises: Exercise[], onStart: () => void, onEdit: () => void, onDelete: () => void, isCompleted?: boolean, onActivate?: () => void, compact?: boolean, key?: React.Key }) {
  const daysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl ${compact ? 'p-4' : 'p-5'} transition-colors group relative ${isCompleted ? 'opacity-50' : 'hover:border-brand-500/30'}`}>
      <div className={`flex justify-between items-start ${compact ? 'mb-2' : 'mb-4'}`}>
        <div className={compact ? "flex-1 min-w-0 mr-2" : ""}>
          <h3 className={`font-bold ${compact ? 'text-base' : 'text-lg'} ${isCompleted ? 'line-through decoration-zinc-500' : ''}`}>{plan.name}</h3>
          
        </div>
        <div className="flex items-center gap-2">
          
          <div className="flex gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className={`text-zinc-500 hover:text-zinc-300 ${compact ? 'p-1.5' : 'p-2'} rounded-full hover:bg-zinc-800 transition-colors`}
            >
              <Pencil size={compact ? 16 : 18} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className={`text-zinc-500 hover:text-red-400 ${compact ? 'p-1.5' : 'p-2'} rounded-full hover:bg-zinc-800 transition-colors`}
            >
              <Trash2 size={compact ? 16 : 18} />
            </button>
            {isCompleted && onActivate ? (
              <button 
                onClick={onActivate}
                className={`bg-zinc-800 text-brand-500 ${compact ? 'p-2' : 'p-3'} rounded-full hover:bg-zinc-700 hover:text-brand-400 transition-colors ml-1`}
                title="Repetir Treino"
              >
                <RotateCcw size={compact ? 16 : 20} />
              </button>
            ) : (
              <button 
                onClick={onStart}
                className={`bg-brand-500 text-zinc-950 ${compact ? 'p-2' : 'p-3'} rounded-full hover:bg-brand-400 transition-transform active:scale-95 ml-1`}
              >
                <Play size={compact ? 16 : 20} className="fill-current" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {compact ? (
        <div className="text-xs text-zinc-400 leading-relaxed">
          {plan.exercises.length > 0 ? (
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {plan.exercises.map((ex, index) => {
                const exerciseName = availableExercises.find(e => e.id === ex.exerciseId)?.name || 'Exercício desconhecido';
                return (
                  <span key={ex.id} className="flex items-center gap-1">
                     <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                     {exerciseName}
                  </span>
                );
              })}
            </div>
          ) : (
            <span className="italic text-zinc-600">Nenhum exercício</span>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {plan.exercises.map((ex, index) => {
            const exerciseName = availableExercises.find(e => e.id === ex.exerciseId)?.name || 'Exercício desconhecido';
            return (
              <div key={ex.id} className="text-sm text-zinc-400 flex items-center gap-2">
                <span className="text-zinc-600 font-mono text-xs w-4 text-right">{index + 1}.</span>
                <span>{exerciseName}</span>
              </div>
            );
          })}
          {plan.exercises.length === 0 && (
            <div className="text-sm text-zinc-500 italic">Nenhum exercício</div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Builder View ---
function BuilderView({ 
  initialPlan, 
  availableExercises, 
  onAddExercise, 
  onSave, 
  onCancel 
}: { 
  initialPlan?: WorkoutPlan | null, 
  availableExercises: Exercise[], 
  onAddExercise: (e: Exercise) => void, 
  onSave: (p: WorkoutPlan) => void, 
  onCancel: () => void, 
  key?: React.Key 
}) {
  const [name, setName] = useState(initialPlan?.name || '');
  const [exercises, setExercises] = useState<PlannedExercise[]>(initialPlan?.exercises || []);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  
  // Filter State
  const [filterMuscle, setFilterMuscle] = useState<string>('Todos');
  const [filterEquipment, setFilterEquipment] = useState<string>('Todos');

  // Get unique muscle groups and equipment from available exercises for filtering
  const availableMuscleGroups = Array.from(new Set(availableExercises.map(e => e.muscleGroup))).sort();
  const availableEquipment = Array.from(new Set(availableExercises.map(e => e.equipment))).sort();


  

  const addExerciseToPlan = (exerciseId: string) => {
    const exerciseDef = availableExercises.find(e => e.id === exerciseId);
    const type = exerciseDef?.type || 'weighted';
    
    let defaultSet: PlannedSet;
    if (type === 'timed') defaultSet = { duration: 30 };
    else if (type === 'reps_only') defaultSet = { reps: 10 };
    else if (type === 'cardio') defaultSet = { duration: 20, distance: 1 };
    else defaultSet = { reps: 10, weight: 0 };

    setExercises(prev => [
      ...prev, 
      {
        id: Math.random().toString(36).substring(7),
        exerciseId,
        sets: [{ ...defaultSet }, { ...defaultSet }, { ...defaultSet }]
      }
    ]);
    setShowExercisePicker(false);
  };

  const updateSet = (exId: string, setIndex: number, field: 'reps' | 'weight', value: number) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id !== exId) return ex;
      const newSets = [...ex.sets];
      newSets[setIndex] = { ...newSets[setIndex], [field]: value };
      return { ...ex, sets: newSets };
    }));
  };

  const addSet = (exId: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id !== exId) return ex;
      const lastSet = ex.sets[ex.sets.length - 1] || { reps: 10, weight: 0 };
      return { ...ex, sets: [...ex.sets, { ...lastSet }] };
    }));
  };

  const removeSet = (exId: string, setIndex: number) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id !== exId) return ex;
      return { ...ex, sets: ex.sets.filter((_, i) => i !== setIndex) };
    }));
  };

  const removeExercise = (exId: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== exId));
  };

  const handleSave = () => {
    if (!name.trim() || exercises.length === 0) return;
    onSave({
      id: initialPlan?.id || Math.random().toString(36).substring(7),
      name,
      daysOfWeek: [],
      exercises
    });
  };

  if (showExercisePicker) {
    return (
      <div className="p-6 pt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Adicionar Exercício</h2>
          <button onClick={() => setShowExercisePicker(false)} className="p-2 bg-zinc-800 rounded-full">
            <X size={20} />
          </button>
        </div>
        
        {/* Filters */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-mono text-zinc-500 mb-1 uppercase tracking-wider">Músculo</label>
            <select 
              value={filterMuscle}
              onChange={e => setFilterMuscle(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-brand-500 transition-colors appearance-none"
            >
              <option value="Todos">Todos</option>
              {availableMuscleGroups.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-zinc-500 mb-1 uppercase tracking-wider">Equipamento</label>
            <select 
              value={filterEquipment}
              onChange={e => setFilterEquipment(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-brand-500 transition-colors appearance-none"
            >
              <option value="Todos">Todos</option>
              {availableEquipment.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {availableExercises
            .filter(ex => (filterMuscle === 'Todos' || ex.muscleGroup === filterMuscle) && 
                          (filterEquipment === 'Todos' || ex.equipment === filterEquipment))
            .map(ex => (
            <button 
              key={ex.id}
              onClick={() => {
                addExerciseToPlan(ex.id);
                // Reset filters when adding
                setFilterMuscle('Todos');
                setFilterEquipment('Todos');
              }}
              className="w-full flex items-center justify-between bg-zinc-900 border border-zinc-800 p-4 rounded-xl hover:border-brand-500/50 transition-colors text-left"
            >
              <div>
                <div className="font-semibold">{ex.name}</div>
                <div className="text-xs text-zinc-500 font-mono mt-1">{ex.muscleGroup} • {ex.equipment}</div>
              </div>
              <PlusCircle className="text-brand-500" size={20} />
            </button>
          ))}
          {availableExercises.filter(ex => (filterMuscle === 'Todos' || ex.muscleGroup === filterMuscle) && 
                          (filterEquipment === 'Todos' || ex.equipment === filterEquipment)).length === 0 && (
            <div className="text-center py-8 text-zinc-500">
              Nenhum exercício encontrado com esses filtros.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-6 pt-12 space-y-8"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{initialPlan ? 'Editar Treino' : 'Novo Treino'}</h1>
        <button onClick={onCancel} className="text-zinc-400 hover:text-white">Cancelar</button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Nome do Treino</label>
          <input 
            type="text" 
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Treino A - Peito"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-lg focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

    
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider">Exercícios</label>
            <button 
              onClick={() => setShowExercisePicker(true)}
              className="text-brand-400 text-sm font-medium flex items-center gap-1"
            >
              <PlusCircle size={16} /> Adicionar
            </button>
          </div>

          <Reorder.Group axis="y" values={exercises} onReorder={setExercises} className="space-y-4 list-none p-0">
            {exercises.map((ex, index) => {
              const exerciseDef = availableExercises.find(e => e.id === ex.exerciseId);
              return (
                <Reorder.Item key={ex.id} value={ex} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 relative">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 -ml-1" onPointerDown={(e) => e.preventDefault()}>
                        <GripVertical size={20} />
                      </div>
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-mono text-xs text-zinc-400 select-none">
                        {index + 1}
                      </div>
                      <span className="font-semibold select-none">{exerciseDef?.name || 'Exercício não encontrado'}</span>
                    </div>
                    <button onClick={() => removeExercise(ex.id)} className="text-red-400 p-2">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(() => {
                      const exType = exerciseDef?.type || 'weighted';
                      if (exType === 'timed') return (
                        <>
                          <div className="grid grid-cols-[3rem_1fr_3rem] gap-2 text-xs font-mono text-zinc-500 px-2 mb-1 select-none">
                            <div className="text-center">Série</div>
                            <div className="text-center">Duração (seg)</div>
                            <div className="text-center"></div>
                          </div>
                          {ex.sets.map((set, sIdx) => (
                            <div key={sIdx} className="grid grid-cols-[3rem_1fr_3rem] gap-2 items-center">
                              <div className="bg-zinc-950 rounded-lg p-2 text-center font-mono text-sm border border-zinc-800 select-none">{sIdx + 1}</div>
                              <input type="number" value={set.duration || ''} onChange={e => updateSet(ex.id, sIdx, 'duration', parseInt(e.target.value) || 0)} className="w-full min-w-0 bg-zinc-950 rounded-lg p-2 text-center font-mono text-sm border border-zinc-800 focus:outline-none focus:border-brand-500" />
                              <button onClick={() => removeSet(ex.id, sIdx)} className="text-zinc-600 hover:text-red-400 p-1 flex justify-center items-center h-full w-full"><X size={16} /></button>
                            </div>
                          ))}
                        </>
                      );
                      if (exType === 'reps_only') return (
                        <>
                          <div className="grid grid-cols-[3rem_1fr_3rem] gap-2 text-xs font-mono text-zinc-500 px-2 mb-1 select-none">
                            <div className="text-center">Série</div>
                            <div className="text-center">Reps</div>
                            <div className="text-center"></div>
                          </div>
                          {ex.sets.map((set, sIdx) => (
                            <div key={sIdx} className="grid grid-cols-[3rem_1fr_3rem] gap-2 items-center">
                              <div className="bg-zinc-950 rounded-lg p-2 text-center font-mono text-sm border border-zinc-800 select-none">{sIdx + 1}</div>
                              <input type="number" value={set.reps || ''} onChange={e => updateSet(ex.id, sIdx, 'reps', parseInt(e.target.value) || 0)} className="w-full min-w-0 bg-zinc-950 rounded-lg p-2 text-center font-mono text-sm border border-zinc-800 focus:outline-none focus:border-brand-500" />
                              <button onClick={() => removeSet(ex.id, sIdx)} className="text-zinc-600 hover:text-red-400 p-1 flex justify-center items-center h-full w-full"><X size={16} /></button>
                            </div>
                          ))}
                        </>
                      );
                      if (exType === 'cardio') return (
                        <>
                          <div className="grid grid-cols-[3rem_1fr_1fr_3rem] gap-2 text-xs font-mono text-zinc-500 px-2 mb-1 select-none">
                            <div className="text-center">Série</div>
                            <div className="text-center">Tempo (min)</div>
                            <div className="text-center">Dist (km)</div>
                            <div className="text-center"></div>
                          </div>
                          {ex.sets.map((set, sIdx) => (
                            <div key={sIdx} className="grid grid-cols-[3rem_1fr_1fr_3rem] gap-2 items-center">
                              <div className="bg-zinc-950 rounded-lg p-2 text-center font-mono text-sm border border-zinc-800 select-none">{sIdx + 1}</div>
                              <input type="number" value={set.duration || ''} onChange={e => updateSet(ex.id, sIdx, 'duration', parseInt(e.target.value) || 0)} className="w-full min-w-0 bg-zinc-950 rounded-lg p-2 text-center font-mono text-sm border border-zinc-800 focus:outline-none focus:border-brand-500" />
                              <input type="number" value={set.distance || ''} onChange={e => updateSet(ex.id, sIdx, 'distance', parseFloat(e.target.value) || 0)} className="w-full min-w-0 bg-zinc-950 rounded-lg p-2 text-center font-mono text-sm border border-zinc-800 focus:outline-none focus:border-brand-500" />
                              <button onClick={() => removeSet(ex.id, sIdx)} className="text-zinc-600 hover:text-red-400 p-1 flex justify-center items-center h-full w-full"><X size={16} /></button>
                            </div>
                          ))}
                        </>
                      );
                      return (
                        <>
                          <div className="grid grid-cols-[3rem_1fr_1fr_3rem] gap-2 text-xs font-mono text-zinc-500 px-2 mb-1 select-none">
                            <div className="text-center">Série</div>
                            <div className="text-center">Reps</div>
                            <div className="text-center">Carga (kg)</div>
                            <div className="text-center"></div>
                          </div>
                          {ex.sets.map((set, sIdx) => (
                            <div key={sIdx} className="grid grid-cols-[3rem_1fr_1fr_3rem] gap-2 items-center">
                              <div className="bg-zinc-950 rounded-lg p-2 text-center font-mono text-sm border border-zinc-800 select-none">{sIdx + 1}</div>
                              <input type="number" value={set.reps || ''} onChange={e => updateSet(ex.id, sIdx, 'reps', parseInt(e.target.value) || 0)} className="w-full min-w-0 bg-zinc-950 rounded-lg p-2 text-center font-mono text-sm border border-zinc-800 focus:outline-none focus:border-brand-500" />
                              <input type="number" value={set.weight || ''} onChange={e => updateSet(ex.id, sIdx, 'weight', parseInt(e.target.value) || 0)} className="w-full min-w-0 bg-zinc-950 rounded-lg p-2 text-center font-mono text-sm border border-zinc-800 focus:outline-none focus:border-brand-500" />
<button onClick={() => removeSet(ex.id, sIdx)} className="text-zinc-600 hover:text-red-400 p-1 flex justify-center items-center h-full w-full"><X size={16} /></button>
                            </div>
                          ))}
                        </>
                      );
                    })()}
                    <button 
                      onClick={() => addSet(ex.id)}
                      className="w-full mt-2 py-2 border border-dashed border-zinc-700 rounded-lg text-xs font-medium text-zinc-400 hover:text-brand-400 hover:border-brand-500/50 transition-colors"
                    >
                      + Adicionar Série
                    </button>
                  </div>
                </Reorder.Item>
              );
            })}
            {exercises.length === 0 && (
              <div className="text-center p-8 border border-dashed border-zinc-800 rounded-2xl text-zinc-500">
                Nenhum exercício adicionado.
              </div>
            )}
          </Reorder.Group>
        </div>
      </div>

      <div className="text-center mb-3 px-4">
        <p className="text-xs text-brand-500 font-medium">
          Lembre-se de salvar antes de sair ou mudar de tela, para não perder as alterações realizadas.
        </p>
      </div>

      <button 
        onClick={handleSave}
        disabled={!name.trim() || exercises.length === 0}
        className="w-full bg-brand-500 text-zinc-950 py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Save size={20} />
        Salvar Treino
      </button>
    </motion.div>
  );
}



function ListManager({ title, items, onUpdate, onClose }: { title: string, items: string[], onUpdate: (items: string[]) => void, onClose: () => void }) {
  const [newItem, setNewItem] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  // Sort items if title is 'Equipamentos' or 'Grupos Musculares'
  const shouldSort = title === 'Equipamentos' || title === 'Grupos Musculares';
  const displayItems = shouldSort ? [...items].sort((a, b) => a.localeCompare(b)) : items;

  const handleAdd = () => {
    if (newItem.trim()) {
      onUpdate([...displayItems, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleUpdate = (index: number) => {
    if (editValue.trim()) {
      const newItems = [...displayItems];
      newItems[index] = editValue.trim();
      onUpdate(newItems);
      setEditingIndex(null);
    }
  };

  const handleDelete = (index: number) => {
    const newItems = displayItems.filter((_, i) => i !== index);
    onUpdate(newItems);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Gerenciar {title}</h3>
          <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            placeholder={`Novo ${title}`}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-3 focus:outline-none focus:border-brand-500"
          />
          <button onClick={handleAdd} className="bg-brand-500 text-zinc-950 p-3 rounded-xl">
            <PlusCircle size={20} />
          </button>
        </div>

        <div className="space-y-2 overflow-y-auto flex-1">
          {displayItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
              {editingIndex === index ? (
                <>
                  <input
                    type="text"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    className="flex-1 bg-zinc-900 rounded-lg p-2 text-sm focus:outline-none focus:border-brand-500"
                    autoFocus
                  />
                  <button onClick={() => handleUpdate(index)} className="text-brand-500 p-2"><CheckCircle2 size={18} /></button>
                  <button onClick={() => setEditingIndex(null)} className="text-zinc-500 p-2"><X size={18} /></button>
                </>
              ) : (
                <>
                  <span className="flex-1">{item}</span>
                  <button onClick={() => { setEditingIndex(index); setEditValue(item); }} className="text-zinc-500 hover:text-zinc-300 p-2"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(index)} className="text-zinc-500 hover:text-red-400 p-2"><Trash2 size={16} /></button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Active Workout View ---
function ActiveWorkoutView({ plan, availableExercises, weightIncrement, onFinish, onCancel }: { plan: WorkoutPlan, availableExercises: Exercise[], weightIncrement: number, onFinish: (s: WorkoutSession) => void, onCancel: () => void, key?: React.Key }) {
  const [startTime] = useState(new Date().toISOString());
  const [currentExIndex, setCurrentExIndex] = useState(() => {
    try {
      const s = localStorage.getItem('iron_active_workout_state');
      const saved = s ? JSON.parse(s) : null;
      return saved?.planId === plan.id ? (saved.currentExIndex || 0) : 0;
    } catch { return 0; }
  });
  const [completedExercises, setCompletedExercises] = useState<CompletedExercise[]>(() => {
    try {
      const s = localStorage.getItem('iron_active_workout_state');
      const saved = s ? JSON.parse(s) : null;
      return saved?.planId === plan.id ? (saved.completedExercises || []) : [];
    } catch { return []; }
  });
  
  // State for current exercise being performed
  const currentPlannedEx = plan.exercises[currentExIndex];
  const exerciseDef = availableExercises.find(e => e.id === currentPlannedEx?.exerciseId);
  
  const [currentSets, setCurrentSets] = useState<CompletedSet[]>(() => {
    try {
      const s = localStorage.getItem('iron_active_workout_state');
      const saved = s ? JSON.parse(s) : null;
      return saved?.planId === plan.id ? (saved.currentSets || []) : [];
    } catch { return []; }
  });
  const [currentReps, setCurrentReps] = useState(() => {
    try {
      const s = localStorage.getItem('iron_active_workout_state');
      const saved = s ? JSON.parse(s) : null;
      return saved?.planId === plan.id ? (saved.currentReps || currentPlannedEx?.sets[0]?.reps || 10) : (currentPlannedEx?.sets[0]?.reps || 10);
    } catch { return currentPlannedEx?.sets[0]?.reps || 10; }
  });
  const [currentWeight, setCurrentWeight] = useState(() => {
    try {
      const s = localStorage.getItem('iron_active_workout_state');
      const saved = s ? JSON.parse(s) : null;
      return saved?.planId === plan.id ? (saved.currentWeight || currentPlannedEx?.sets[0]?.weight || 0) : (currentPlannedEx?.sets[0]?.weight || 0);
    } catch { return currentPlannedEx?.sets[0]?.weight || 0; }
  });
  const [exStartTime, setExStartTime] = useState(() => {
    try {
      const s = localStorage.getItem('iron_active_workout_state');
      const saved = s ? JSON.parse(s) : null;
      return saved?.planId === plan.id ? (saved.exStartTime || Date.now()) : Date.now();
    } catch { return Date.now(); }
  });

  // Timer state
  const [elapsed, setElapsed] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [currentDuration, setCurrentDuration] = useState(() => {
    try {
      const s = localStorage.getItem('iron_active_workout_state');
      const saved = s ? JSON.parse(s) : null;
      return saved?.planId === plan.id ? (saved.currentDuration || currentPlannedEx?.sets[0]?.duration || 30) : (currentPlannedEx?.sets[0]?.duration || 30);
    } catch { return 30; }
  });
  const [currentDistance, setCurrentDistance] = useState(() => {
    try {
      const s = localStorage.getItem('iron_active_workout_state');
      const saved = s ? JSON.parse(s) : null;
      return saved?.planId === plan.id ? (saved.currentDistance || currentPlannedEx?.sets[0]?.distance || 0) : (currentPlannedEx?.sets[0]?.distance || 0);
    } catch { return 0; }
  });
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    const state = {
      planId: plan.id,
      currentExIndex,
      completedExercises,
      currentSets,
      currentReps,
      currentWeight,
      currentDuration,
      currentDistance,
      startTime,
      exStartTime
    };
    localStorage.setItem('iron_active_workout_state', JSON.stringify(state));
  }, [currentExIndex, completedExercises, currentSets, currentReps, currentWeight, currentDuration, currentDistance]);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(startTime).getTime()) / 1000));
      if (isResting) {
        setRestTime(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, isResting]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const completeSet = () => {
    const exType = exerciseDef?.type || 'weighted';
    const newSet: CompletedSet = {
      reps: exType === 'weighted' || exType === 'reps_only' ? currentReps : undefined,
      weight: exType === 'weighted' ? currentWeight : undefined,
      duration: exType === 'timed' || exType === 'cardio' ? currentDuration : undefined,
      distance: exType === 'cardio' ? currentDistance : undefined,
      completedAt: new Date().toISOString()
    };
    const newSets = [...currentSets, newSet];
    setCurrentSets(newSets);
    
    setIsResting(true);
    setRestTime(0);

    // Pre-fill next set if available
    const nextSetIndex = newSets.length;
    if (nextSetIndex < currentPlannedEx.sets.length) {
      setCurrentReps(currentPlannedEx.sets[nextSetIndex].reps);
      setCurrentWeight(currentPlannedEx.sets[nextSetIndex].weight);
    }
  };

  const finishExercise = () => {
    const duration = Math.floor((Date.now() - exStartTime) / 1000);
    const completedEx: CompletedExercise = {
      exerciseId: currentPlannedEx.exerciseId,
      sets: currentSets,
      durationSeconds: duration
    };
    
    setCompletedExercises(prev => [...prev, completedEx]);
    
    if (currentExIndex < plan.exercises.length - 1) {
      const nextEx = plan.exercises[currentExIndex + 1];
      setCurrentExIndex(prev => prev + 1);
      setCurrentSets([]);
      setCurrentReps(nextEx.sets[0]?.reps || 10);
      setCurrentWeight(nextEx.sets[0]?.weight || 0);
      setExStartTime(Date.now());
      setIsResting(false);
    } else {
      // Finish workout
      onFinish({
        id: Math.random().toString(36).substring(7),
        planId: plan.id,
        startTime,
        endTime: new Date().toISOString(),
        exercises: [...completedExercises, completedEx]
      });
    }
  };

  if (!currentPlannedEx) return null;

  const progress = ((currentExIndex) / plan.exercises.length) * 100;
  const isLastExercise = currentExIndex === plan.exercises.length - 1;
  const isLastSet = currentSets.length >= currentPlannedEx.sets.length;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="min-h-screen bg-zinc-950 flex flex-col"
    >
      {/* Header */}
      <div className="p-6 pb-4 bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setShowCancelConfirm(true)} className="text-zinc-400 hover:text-white">
            <X size={24} />
          </button>
          <div className="font-mono text-xl font-bold text-brand-400 tracking-wider">
            {formatTime(elapsed)}
          </div>
          <button onClick={finishExercise} className="text-brand-500 text-sm font-bold">
            PULAR
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-center mt-2 text-xs font-mono text-zinc-500">
          EXERCÍCIO {currentExIndex + 1} DE {plan.exercises.length}
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col">
        {/* Current Exercise Info */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">{exerciseDef?.name}</h2>
          <div className="inline-flex items-center gap-2 bg-zinc-900 px-3 py-1 rounded-full text-xs font-mono text-zinc-400 border border-zinc-800">
            <span>{exerciseDef?.muscleGroup}</span>
            <span className="w-1 h-1 rounded-full bg-zinc-600" />
            <span>{exerciseDef?.equipment}</span>
          </div>
        </div>

        {/* Rest Timer Overlay */}
        <AnimatePresence>
          {isResting && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-brand-950/30 border border-brand-500/30 rounded-2xl p-6 mb-8 text-center"
            >
              <div className="text-brand-500 font-mono text-sm mb-2 uppercase tracking-widest">Descanso</div>
              <div className="text-5xl font-bold font-mono text-brand-400 mb-4">{formatTime(restTime)}</div>
              <button 
                onClick={() => setIsResting(false)}
                className="bg-brand-500/20 text-brand-400 px-6 py-2 rounded-full text-sm font-bold hover:bg-brand-500/30 transition-colors"
              >
                PRÓXIMA SÉRIE
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sets History */}
        <div className="space-y-2 mb-8 flex-1 overflow-y-auto">
          <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 text-xs font-mono text-zinc-500 px-4 mb-2">
            <div className="w-8">Série</div>
            <div className="text-center">{exerciseDef?.type === 'timed' ? 'Duração' : exerciseDef?.type === 'cardio' ? 'Tempo' : 'Reps'}</div>
            <div className="text-center">{exerciseDef?.type === 'timed' ? '' : exerciseDef?.type === 'cardio' ? 'Dist' : 'Carga'}</div>
            <div className="w-6"></div>
          </div>
          
          {currentPlannedEx.sets.map((plannedSet, idx) => {
            const isCompleted = idx < currentSets.length;
            const isCurrent = idx === currentSets.length;
            const completedData = currentSets[idx];

            return (
              <div 
                key={idx} 
                className={`grid grid-cols-[auto_1fr_1fr_auto] gap-4 items-center p-3 rounded-xl border transition-colors ${
                  isCompleted ? 'bg-zinc-900/50 border-zinc-800/50 text-zinc-500' : 
                  isCurrent ? 'bg-zinc-900 border-brand-500/50 shadow-[0_0_15px_rgba(255,178,0,0.1)]' : 
                  'bg-zinc-900/30 border-zinc-800/30 text-zinc-600'
                }`}
              >
                <div className="w-8 text-center font-mono font-bold">{idx + 1}</div>
                <div className="text-center font-mono text-lg">
                  {isCompleted
                    ? (exerciseDef?.type === 'timed' || exerciseDef?.type === 'cardio' ? completedData.duration : completedData.reps)
                    : (exerciseDef?.type === 'timed' || exerciseDef?.type === 'cardio' ? plannedSet.duration : plannedSet.reps)}
                  {exerciseDef?.type === 'timed' && <span className="text-xs ml-1 opacity-50">seg</span>}
                  {exerciseDef?.type === 'cardio' && <span className="text-xs ml-1 opacity-50">min</span>}
                </div>
                <div className="text-center font-mono text-lg">
                  {exerciseDef?.type === 'timed' || exerciseDef?.type === 'reps_only' ? null : isCompleted
                    ? (exerciseDef?.type === 'cardio' ? completedData.distance : completedData.weight)
                    : (exerciseDef?.type === 'cardio' ? plannedSet.distance : plannedSet.weight)}
                  {exerciseDef?.type !== 'timed' && exerciseDef?.type !== 'reps_only' && (
                    <span className="text-xs ml-1 opacity-50">{exerciseDef?.type === 'cardio' ? 'km' : 'kg'}</span>
                  )}
                </div>
                <div className="w-6 flex justify-center">
                  {isCompleted && <CheckCircle2 size={18} className="text-brand-500" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        {!isResting && !isLastSet && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-[env(safe-area-inset-bottom)]">
            {(() => {
              const exType = exerciseDef?.type || 'weighted';

              if (exType === 'timed') return (
                <div className="mb-6">
                  <label className="block text-center text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Duração (seg)</label>
                  <div className="flex items-center justify-between bg-zinc-950 rounded-2xl p-2 border border-zinc-800">
                    <button onClick={() => setCurrentDuration(Math.max(1, currentDuration - 5))} className="w-10 h-10 flex items-center justify-center bg-zinc-900 rounded-xl text-xl active:scale-95">-</button>
                    <input type="number" value={currentDuration} onChange={e => setCurrentDuration(Math.max(1, parseInt(e.target.value) || 1))} className="w-16 text-3xl font-bold font-mono text-center bg-transparent focus:outline-none" />
                    <button onClick={() => setCurrentDuration(currentDuration + 5)} className="w-10 h-10 flex items-center justify-center bg-zinc-900 rounded-xl text-xl active:scale-95">+</button>
                  </div>
                </div>
              );

              if (exType === 'reps_only') return (
                <div className="mb-6">
                  <label className="block text-center text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Reps</label>
                  <div className="flex items-center justify-between bg-zinc-950 rounded-2xl p-2 border border-zinc-800">
                    <button onClick={() => setCurrentReps(Math.max(1, currentReps - 1))} className="w-10 h-10 flex items-center justify-center bg-zinc-900 rounded-xl text-xl active:scale-95">-</button>
                    <input type="number" value={currentReps} onChange={e => setCurrentReps(Math.max(1, parseInt(e.target.value) || 1))} className="w-16 text-3xl font-bold font-mono text-center bg-transparent focus:outline-none" />
                    <button onClick={() => setCurrentReps(currentReps + 1)} className="w-10 h-10 flex items-center justify-center bg-zinc-900 rounded-xl text-xl active:scale-95">+</button>
                  </div>
                </div>
              );

              if (exType === 'cardio') return (
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <label className="block text-center text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Tempo (min)</label>
                    <div className="flex items-center justify-between bg-zinc-950 rounded-2xl p-2 border border-zinc-800">
                      <button onClick={() => setCurrentDuration(Math.max(1, currentDuration - 1))} className="w-10 h-10 flex items-center justify-center bg-zinc-900 rounded-xl text-xl active:scale-95">-</button>
                      <input type="number" value={currentDuration} onChange={e => setCurrentDuration(Math.max(1, parseInt(e.target.value) || 1))} className="w-16 text-3xl font-bold font-mono text-center bg-transparent focus:outline-none" />
                      <button onClick={() => setCurrentDuration(currentDuration + 1)} className="w-10 h-10 flex items-center justify-center bg-zinc-900 rounded-xl text-xl active:scale-95">+</button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-center text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Distância (km)</label>
                    <div className="flex items-center justify-between bg-zinc-950 rounded-2xl p-2 border border-zinc-800">
                      <button onClick={() => setCurrentDistance(Math.max(0, parseFloat((currentDistance - 0.5).toFixed(1))))} className="w-10 h-10 flex items-center justify-center bg-zinc-900 rounded-xl text-xl active:scale-95">-</button>
                      <input type="number" value={currentDistance} onChange={e => setCurrentDistance(Math.max(0, parseFloat(e.target.value) || 0))} className="w-16 text-3xl font-bold font-mono text-center bg-transparent focus:outline-none" step="0.5" />
                      <button onClick={() => setCurrentDistance(parseFloat((currentDistance + 0.5).toFixed(1)))} className="w-10 h-10 flex items-center justify-center bg-zinc-900 rounded-xl text-xl active:scale-95">+</button>
                    </div>
                  </div>
                </div>
              );

              return (
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <label className="block text-center text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Reps</label>
                    <div className="flex items-center justify-between bg-zinc-950 rounded-2xl p-2 border border-zinc-800">
                      <button onClick={() => setCurrentReps(Math.max(1, currentReps - 1))} className="w-10 h-10 flex items-center justify-center bg-zinc-900 rounded-xl text-xl active:scale-95">-</button>
                      <input type="number" value={currentReps} onChange={e => setCurrentReps(Math.max(1, parseInt(e.target.value) || 1))} className="w-16 text-3xl font-bold font-mono text-center bg-transparent focus:outline-none" />
                      <button onClick={() => setCurrentReps(currentReps + 1)} className="w-10 h-10 flex items-center justify-center bg-zinc-900 rounded-xl text-xl active:scale-95">+</button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-center text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Carga (kg)</label>
                    <div className="flex items-center justify-between bg-zinc-950 rounded-2xl p-2 border border-zinc-800">
                      <button onClick={() => setCurrentWeight(Math.max(0, currentWeight - weightIncrement))} className="w-10 h-10 flex items-center justify-center bg-zinc-900 rounded-xl text-xl active:scale-95">-</button>
                      <input type="number" value={currentWeight} onChange={e => setCurrentWeight(Math.max(0, parseFloat(e.target.value) || 0))} className="w-16 text-3xl font-bold font-mono text-center bg-transparent focus:outline-none" step="0.5" />
                      <button onClick={() => setCurrentWeight(currentWeight + weightIncrement)} className="w-10 h-10 flex items-center justify-center bg-zinc-900 rounded-xl text-xl active:scale-95">+</button>
                    </div>
                  </div>
                </div>
              );
            })()}

            <button 
              onClick={completeSet}
              className="w-full bg-brand-500 text-zinc-950 py-4 rounded-2xl font-bold text-xl active:scale-[0.98] transition-transform shadow-[0_0_20px_rgba(255,178,0,0.3)]"
            >
              CONCLUIR SÉRIE
            </button>
          </div>
        )}

        {isLastSet && !isResting && (
          <button 
            onClick={finishExercise}
            className="w-full bg-brand-500 text-zinc-950 py-4 rounded-2xl font-bold text-xl active:scale-[0.98] transition-transform shadow-[0_0_20px_rgba(255,178,0,0.3)] mb-[env(safe-area-inset-bottom)]"
          >
            {isLastExercise ? 'FINALIZAR TREINO' : 'PRÓXIMO EXERCÍCIO'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-xl"
            >
              <h3 className="text-xl font-bold mb-2">Abandonar Treino?</h3>
              <p className="text-zinc-400 mb-6">O progresso atual será perdido.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-3 rounded-xl font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Continuar
                </button>
                <button
                  onClick={() => { localStorage.removeItem('iron_active_workout_state'); onCancel(); }}
                  className="flex-1 py-3 rounded-xl font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                >
                  Abandonar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- History View ---
function HistoryView({ sessions, plans, availableExercises, onClearHistory }: { sessions: WorkoutSession[], plans: WorkoutPlan[], availableExercises: Exercise[], onClearHistory: () => void, key?: React.Key }) {
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);

  // --- Helper: Map Exercise to Fixed Categories ---
  const getDetailedMuscleGroup = (exercise: Exercise): string => {
    const name = exercise.name.toLowerCase();
    const group = exercise.muscleGroup;

    if (group === 'Braços') {
      if (name.includes('tríceps') || name.includes('testa') || name.includes('frances')) return 'Tríceps';
      if (name.includes('rosca') || name.includes('bíceps')) return 'Bíceps';
      return 'Bíceps'; // Default fallback
    }
    if (group === 'Pernas') {
      if (name.includes('flexora') || name.includes('stiff') || name.includes('posterior')) return 'Posteriores';
      return 'Quadríceps'; // Default for squats, leg press, extensora
    }
    return group;
  };

  // --- Data Preparation ---
  // 1. Calculate Sets per Muscle Group (Last 30 Days) & Top Equipment
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const muscleStats: Record<string, { sets: number, equipmentCounts: Record<string, number> }> = {
    'Peito': { sets: 0, equipmentCounts: {} }, 
    'Costas': { sets: 0, equipmentCounts: {} }, 
    'Quadríceps': { sets: 0, equipmentCounts: {} }, 
    'Posteriores': { sets: 0, equipmentCounts: {} }, 
    'Ombros': { sets: 0, equipmentCounts: {} }, 
    'Bíceps': { sets: 0, equipmentCounts: {} }, 
    'Tríceps': { sets: 0, equipmentCounts: {} }, 
    'Core': { sets: 0, equipmentCounts: {} }
  };

  sessions.forEach(session => {
    const sessionDate = new Date(session.startTime);
    if (sessionDate >= thirtyDaysAgo) {
      session.exercises.forEach(ex => {
        const exerciseDef = availableExercises.find(e => e.id === ex.exerciseId);
        if (exerciseDef) {
          const group = getDetailedMuscleGroup(exerciseDef);
          const setsCount = ex.sets.length;
          
          if (muscleStats[group]) {
            muscleStats[group].sets += setsCount;
            const equip = exerciseDef.equipment;
            muscleStats[group].equipmentCounts[equip] = (muscleStats[group].equipmentCounts[equip] || 0) + setsCount;
          }
        }
      });
    }
  });

  const muscleChartData = Object.entries(muscleStats).map(([name, stats]) => {
    let topEquip = '-';
    let maxCount = 0;
    Object.entries(stats.equipmentCounts).forEach(([equip, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topEquip = equip;
      }
    });

    return {
      name,
      sets: stats.sets,
      topEquipment: topEquip
    };
  }).filter(d => d.sets > 0);

  // Sort by sets descending
  muscleChartData.sort((a, b) => b.sets - a.sets);

  const avgSets = muscleChartData.length > 0 
    ? muscleChartData.reduce((acc, d) => acc + d.sets, 0) / muscleChartData.length 
    : 0;

  // 2. Group all completed exercises by exerciseId
  const exerciseHistory: Record<string, { date: Date, sets: CompletedSet[] }[]> = {};

  sessions.forEach(session => {
    session.exercises.forEach(ex => {
      if (!exerciseHistory[ex.exerciseId]) {
        exerciseHistory[ex.exerciseId] = [];
      }
      exerciseHistory[ex.exerciseId].push({
        date: new Date(session.startTime),
        sets: ex.sets
      });
    });
  });

  // Sort history for each exercise by date desc
  Object.keys(exerciseHistory).forEach(exId => {
    exerciseHistory[exId].sort((a, b) => b.date.getTime() - a.date.getTime());
  });

  // Get list of exercises that have history
  let exercisesWithHistory = Object.keys(exerciseHistory);

  // Filter by selected muscle group
  if (selectedMuscleGroup) {
    exercisesWithHistory = exercisesWithHistory.filter(exId => {
      const exerciseDef = availableExercises.find(e => e.id === exId);
      return exerciseDef && getDetailedMuscleGroup(exerciseDef) === selectedMuscleGroup;
    });
  }

  // Helper to calculate total volume of a session
  const calculateVolume = (sets: CompletedSet[]) => {
    return sets.reduce((acc, set) => acc + (set.weight * set.reps), 0);
  };

  // Helper to get max weight of a session
  const getMaxWeight = (sets: CompletedSet[]) => {
    return Math.max(...sets.map(s => s.weight));
  };

  // Calculate stats for new cards
  const uniqueWorkoutDays = new Set(sessions.map(s => new Date(s.startTime).toDateString())).size;

  const calculateStreak = () => {
    if (sessions.length === 0) return 0;
    
    const sortedDates = [...new Set(sessions.map(s => new Date(s.startTime).toDateString()))]
      .map(d => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime()); // Descending

    if (sortedDates.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastWorkout = new Date(sortedDates[0]);
    lastWorkout.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(today.getTime() - lastWorkout.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    // If last workout was before yesterday, streak is 0
    if (diffDays > 1) return 0;

    let streak = 1;
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const current = sortedDates[i];
      const next = sortedDates[i + 1];
      
      const diff = Math.abs(current.getTime() - next.getTime());
      const daysDiff = Math.round(diff / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const currentStreak = calculateStreak();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 pt-12 space-y-6"
    >
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Progresso</h1>
          <p className="text-zinc-400">Análise técnica por exercício.</p>
        </div>
        <div className="flex gap-2">
          {sessions.length > 0 && (
            <button 
              onClick={() => setShowClearConfirmation(true)}
              className="text-red-500 hover:text-red-400 p-2 rounded-full hover:bg-zinc-800 transition-colors"
              title="Limpar Progresso"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-zinc-400 mb-2">
            <Dumbbell size={18} className="text-brand-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Treinos Totais</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {uniqueWorkoutDays}
            <span className="text-sm font-normal text-zinc-500 ml-1">dias</span>
          </div>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-zinc-400 mb-2">
            <TrendingUp size={18} className="text-brand-500" />
            <span className="text-xs font-bold uppercase tracking-wider">Dias Seguidos</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {currentStreak}
            <span className="text-sm font-normal text-zinc-500 ml-1">dias</span>
          </div>
        </div>
      </div>

      {/* Macro Volume Chart */}
      {muscleChartData.length > 0 && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Activity size={18} className="text-brand-500" />
              Volume de Séries (Sets)
            </h2>
            {selectedMuscleGroup && (
              <button 
                onClick={() => setSelectedMuscleGroup(null)}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded-full"
              >
                <X size={12} /> Limpar Filtro
              </button>
            )}
          </div>
          <div className="h-80 w-full overflow-x-auto" style={{ minHeight: '320px', position: 'relative' }}>
            <div style={{ width: '100%', height: '100%', minWidth: '300px' }}>
              <BarChart 
                width={350}
                height={320}
                layout="vertical" 
                data={muscleChartData} 
                margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#a1a1aa" 
                  fontSize={12} 
                  fontWeight={600}
                  tickLine={false} 
                  axisLine={false} 
                  width={80}
                  tick={({ x, y, payload }) => {
                    const data = muscleChartData.find(d => d.name === payload.value);
                    const equip = data?.topEquipment || '';
                    let equipShort = '';
                    if (equip.includes('Barra')) equipShort = 'Barra';
                    else if (equip.includes('Halter')) equipShort = 'Halter';
                    else if (equip.includes('Máquina')) equipShort = 'Máq.';
                    else if (equip.includes('Cabo')) equipShort = 'Cabo';
                    else if (equip.includes('Corporal')) equipShort = 'Corp.';
                    
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text x={-12} y={0} dy={-4} textAnchor="end" fill="#e4e4e7" fontSize={12} fontWeight={600}>
                          {payload.value}
                        </text>
                        {equipShort && (
                          <text x={-12} y={0} dy={8} textAnchor="end" fill="#71717a" fontSize={9} fontStyle="italic">
                            {equipShort}
                          </text>
                        )}
                      </g>
                    );
                  }}
                />
                <Bar dataKey="sets" radius={[0, 4, 4, 0]} barSize={24} onClick={(data) => setSelectedMuscleGroup(data.name === selectedMuscleGroup ? null : data.name)} style={{ cursor: 'pointer' }}>
                  {muscleChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.sets < avgSets * 0.5 ? '#f59e0b' : (selectedMuscleGroup === entry.name ? '#FFB200' : '#3f3f46')} 
                    />
                  ))}
                  <LabelList dataKey="sets" position="right" fill="#e4e4e7" fontSize={12} fontWeight="bold" formatter={(val: number) => `${val}`} />
                </Bar>
              </BarChart>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-center gap-4 text-[10px] text-zinc-500">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-zinc-700"></div>Normal</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div>Atenção (&lt;50% média)</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-brand-500"></div>Selecionado</div>
          </div>
        </section>
      )}

      {exercisesWithHistory.length === 0 ? (
         <div className="text-center py-10 text-zinc-500 italic">
           Nenhum progresso disponível.
         </div>
      ) : (
        <div className="space-y-3">
          {exercisesWithHistory.map(exId => {
            const history = exerciseHistory[exId];
            const exerciseDef = availableExercises.find(e => e.id === exId);
            const latestSession = history[0];
            const previousSession = history.length > 1 ? history[1] : null;
            
            const latestVolume = calculateVolume(latestSession.sets);
            const previousVolume = previousSession ? calculateVolume(previousSession.sets) : 0;
            const volumeDelta = previousSession ? latestVolume - previousVolume : 0;
            
            const latestMaxWeight = getMaxWeight(latestSession.sets);

            const isExpanded = expandedExerciseId === exId;

            return (
              <div key={exId} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden transition-all">
                {/* Card Header (Closed State) */}
                <button 
                  onClick={() => setExpandedExerciseId(isExpanded ? null : exId)}
                  className="w-full px-4 py-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="text-left">
                    <h3 className="font-bold text-zinc-200">{exerciseDef?.name || 'Ex. Desconhecido'}</h3>
                    <div className="text-xs text-zinc-500 font-mono mt-1">
                      Última: {latestMaxWeight}kg
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Delta Indicator */}
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">VOL Δ</span>
                      {previousSession ? (
                        <div className={`font-mono font-bold text-sm flex items-center gap-1 ${volumeDelta > 0 ? 'text-brand-500' : volumeDelta < 0 ? 'text-red-500' : 'text-zinc-500'}`}>
                          {volumeDelta > 0 ? <TrendingUp size={14} /> : volumeDelta < 0 ? <TrendingUp size={14} className="rotate-180" /> : null}
                          {volumeDelta > 0 ? '+' : ''}{volumeDelta}
                        </div>
                      ) : (
                        <span className="text-zinc-600 font-mono text-sm">-</span>
                      )}
                    </div>
                    <ChevronRight size={20} className={`text-zinc-600 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-zinc-800/50 bg-zinc-950/30"
                    >
                      <div className="p-4">
                        <table className="w-full text-left text-xs font-mono">
                          <thead>
                            <tr className="text-zinc-500 border-b border-zinc-800/50">
                              <th className="pb-2 font-normal">DATA</th>
                              <th className="pb-2 font-normal text-center">CARGA</th>
                              <th className="pb-2 font-normal text-center">REPS</th>
                              <th className="pb-2 font-normal text-right">VOL Δ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/30">
                            {history.slice(0, 5).map((entry, idx) => {
                              const entryVolume = calculateVolume(entry.sets);
                              // Compare with the NEXT entry in the array (which is the previous chronological session)
                              const prevEntry = history[idx + 1];
                              const prevEntryVolume = prevEntry ? calculateVolume(prevEntry.sets) : 0;
                              const delta = prevEntry ? entryVolume - prevEntryVolume : 0;
                              const maxWeight = getMaxWeight(entry.sets);
                              const totalReps = entry.sets.reduce((acc, s) => acc + s.reps, 0);

                              return (
                                <tr key={idx} className="text-zinc-300">
                                  <td className="py-2">{entry.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</td>
                                  <td className="py-2 text-center">{maxWeight}kg</td>
                                  <td className="py-2 text-center">{totalReps}</td>
                                  <td className={`py-2 text-right font-bold ${delta > 0 ? 'text-brand-500' : delta < 0 ? 'text-red-500' : 'text-zinc-600'}`}>
                                    {prevEntry ? (delta > 0 ? `+${delta}` : delta) : '-'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Clear History Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirmation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowClearConfirmation(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-2">Limpar Progresso?</h3>
              <p className="text-zinc-400 mb-6">Esta ação apagará todos os registros de treinos realizados. Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowClearConfirmation(false)}
                  className="flex-1 py-3 rounded-xl font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    onClearHistory();
                    setShowClearConfirmation(false);
                  }}
                  className="flex-1 py-3 rounded-xl font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                >
                  Limpar Tudo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Exercises View ---
function ExercisesView({ 
  exercises, 
  muscleGroups, 
  equipmentList, 
  onAddExercise, 
  onEditExercise,
  onDeleteExercise,
  onUpdateMuscleGroups, 
  onUpdateEquipment 
}: { 
  exercises: Exercise[], 
  muscleGroups: string[], 
  equipmentList: string[], 
  onAddExercise: (e: Exercise) => void, 
  onEditExercise: (e: Exercise) => void,
  onDeleteExercise: (id: string) => void,
  onUpdateMuscleGroups: (items: string[]) => void, 
  onUpdateEquipment: (items: string[]) => void, 
  key?: React.Key 
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [filterMuscle, setFilterMuscle] = useState<string>('Todos');
  const [filterEquipment, setFilterEquipment] = useState<string>('Todos');
  const [managingList, setManagingList] = useState<'muscle' | 'equipment' | null>(null);
  const [exerciseToDelete, setExerciseToDelete] = useState<string | null>(null);

  // New Exercise State
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscle, setNewExerciseMuscle] = useState<string>(muscleGroups[0] || '');
  const [newExerciseEquipment, setNewExerciseEquipment] = useState<string>(equipmentList[0] || '');
  const [newExerciseType, setNewExerciseType] = useState<'weighted' | 'reps_only' | 'timed' | 'cardio'>('weighted');

  const handleCreateExercise = () => {
    if (!newExerciseName.trim()) return;
    
    if (editingExercise) {
      onEditExercise({
        ...editingExercise,
        name: newExerciseName,
        muscleGroup: newExerciseMuscle,
        equipment: newExerciseEquipment,
        type: newExerciseType
      });
      setEditingExercise(null);
    } else {
      const newExercise: Exercise = {
        id: `custom_${Date.now()}`,
        name: newExerciseName,
        muscleGroup: newExerciseMuscle,
        equipment: newExerciseEquipment,
        type: newExerciseType
      };
      onAddExercise(newExercise);
    }
    
    setNewExerciseName('');
    setShowCreate(false);
  };

  const startEditing = (ex: Exercise) => {
    setEditingExercise(ex);
    setNewExerciseName(ex.name);
    setNewExerciseMuscle(ex.muscleGroup);
    setNewExerciseEquipment(ex.equipment);
    setNewExerciseType(ex.type || 'weighted');
    setShowCreate(true);
  };

  const cancelEditing = () => {
    setEditingExercise(null);
    setNewExerciseName('');
    setShowCreate(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 pt-12 space-y-6"
    >
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Exercícios</h1>
          <p className="text-zinc-400">Gerencie sua biblioteca.</p>
        </div>
        {!showCreate && (
          <button 
            onClick={() => setShowCreate(true)}
            className="p-3 bg-brand-500 rounded-full text-zinc-950 hover:bg-brand-400 transition-colors"
          >
            <PlusCircle size={24} />
          </button>
        )}
      </header>

      {showCreate ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{editingExercise ? 'Editar Exercício' : 'Novo Exercício'}</h2>
            <button onClick={cancelEditing} className="p-2 bg-zinc-800 rounded-full">
              <X size={20} />
            </button>
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Nome</label>
            <input 
              type="text" 
              value={newExerciseName}
              onChange={e => setNewExerciseName(e.target.value)}
              placeholder="Ex: Agachamento Búlgaro"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-lg focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider">Grupo Muscular</label>
              <button onClick={() => setManagingList('muscle')} className="text-xs text-brand-500 font-medium hover:text-brand-400">Gerenciar</button>
            </div>
            <select 
              value={newExerciseMuscle}
              onChange={e => setNewExerciseMuscle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-lg focus:outline-none focus:border-brand-500 transition-colors appearance-none"
            >
              {[...muscleGroups].sort((a, b) => a.localeCompare(b)).map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
          <div>
              <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Tipo de Exercício</label>
              <select
                value={newExerciseType}
                onChange={e => setNewExerciseType(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-lg focus:outline-none focus:border-brand-500 transition-colors appearance-none"
              >
                <option value="weighted">Carga + Reps</option>
                <option value="reps_only">Só Reps</option>
                <option value="timed">Tempo (estático)</option>
                <option value="cardio">Cardio</option>
              </select>
            </div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider">Equipamento</label>
              <button onClick={() => setManagingList('equipment')} className="text-xs text-brand-500 font-medium hover:text-brand-400">Gerenciar</button>
            </div>
            <select 
              value={newExerciseEquipment}
              onChange={e => setNewExerciseEquipment(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-lg focus:outline-none focus:border-brand-500 transition-colors appearance-none"
            >
              {[...equipmentList].sort((a, b) => a.localeCompare(b)).map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={handleCreateExercise}
            disabled={!newExerciseName.trim()}
            className="w-full bg-brand-500 text-zinc-950 py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Salvar
          </button>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1 uppercase tracking-wider">Músculo</label>
              <select 
                value={filterMuscle}
                onChange={e => setFilterMuscle(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-brand-500 transition-colors appearance-none"
              >
                <option value="Todos">Todos</option>
                {[...muscleGroups].sort((a, b) => a.localeCompare(b)).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1 uppercase tracking-wider">Equipamento</label>
              <select 
                value={filterEquipment}
                onChange={e => setFilterEquipment(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-brand-500 transition-colors appearance-none"
              >
                <option value="Todos">Todos</option>
                {[...equipmentList].sort((a, b) => a.localeCompare(b)).map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {exercises
              .filter(ex => (filterMuscle === 'Todos' || ex.muscleGroup === filterMuscle) && 
                            (filterEquipment === 'Todos' || ex.equipment === filterEquipment))
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(ex => (
            <div 
                key={ex.id}
                className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-4 rounded-xl group"
              >
                <div>
                  <div className="font-semibold">{ex.name}</div>
                  <div className="text-xs text-zinc-500 font-mono mt-1">{ex.muscleGroup} • {ex.equipment}</div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => startEditing(ex)}
                    className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-full transition-colors"
                  >
                    <Pencil size={18} />
                  </button>
                  <button 
                    onClick={() => setExerciseToDelete(ex.id)}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-full transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {exercises.filter(ex => (filterMuscle === 'Todos' || ex.muscleGroup === filterMuscle) && 
                            (filterEquipment === 'Todos' || ex.equipment === filterEquipment)).length === 0 && (
              <div className="text-center py-8 text-zinc-500">
                Nenhum exercício encontrado.
              </div>
            )}
          </div>
        </>
      )}

      {managingList && (
        <ListManager 
          title={managingList === 'muscle' ? 'Grupos Musculares' : 'Equipamentos'}
          items={managingList === 'muscle' ? muscleGroups : equipmentList}
          onUpdate={managingList === 'muscle' ? onUpdateMuscleGroups : onUpdateEquipment}
          onClose={() => setManagingList(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {exerciseToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setExerciseToDelete(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-2">Excluir Exercício?</h3>
              <p className="text-zinc-400 mb-6">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setExerciseToDelete(null)}
                  className="flex-1 py-3 rounded-xl font-bold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    if (exerciseToDelete) {
                      onDeleteExercise(exerciseToDelete);
                      setExerciseToDelete(null);
                    }
                  }}
                  className="flex-1 py-3 rounded-xl font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Settings View ---
function SettingsView({ onBack, profile, onUpdateProfile }: { onBack: () => void, profile: UserProfile, onUpdateProfile: (p: UserProfile) => void, key?: React.Key }) {
  const days = [
    { value: 1, label: 'Segunda-feira' },
    { value: 2, label: 'Terça-feira' },
    { value: 3, label: 'Quarta-feira' },
    { value: 4, label: 'Quinta-feira' },
    { value: 5, label: 'Sexta-feira' },
    { value: 6, label: 'Sábado' },
    { value: 0, label: 'Domingo' },
  ];

  const handleChangeStartDay = (day: number) => {
    onUpdateProfile({ ...profile, trainingStartDay: day });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 pt-12 space-y-8 pb-32"
    >
      <header className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 bg-zinc-800 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
        >
          <ChevronRight className="rotate-180" size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Configurações</h1>
          <p className="text-zinc-400">Preferências do aplicativo.</p>
        </div>
      </header>

      <div className="space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-zinc-300 flex items-center gap-2">
            <Calendar size={20} className="text-brand-500" />
            Preferências de Treino
          </h3>
          
          <div>
            <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">
              Incremento de Carga (kg)
            </label>
            <select 
              value={profile.weightIncrement || 1}
              onChange={(e) => onUpdateProfile({ ...profile, weightIncrement: parseInt(e.target.value) })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-lg focus:outline-none focus:border-brand-500 transition-colors appearance-none"
            >
              {[1, 2, 3, 5, 10].map(val => (
                <option key={val} value={val}>{val} kg</option>
              ))}
            </select>
            <p className="text-xs text-zinc-500 mt-2">
              Valor usado nos botões + e - de carga durante o treino.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Profile View ---
function ProfileView({ profile, onSave, onLogout }: { profile: UserProfile, onSave: (p: UserProfile) => void, onLogout: () => void, key?: React.Key }) {
  const [localProfile, setLocalProfile] = useState(profile);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field: keyof UserProfile, value: string | number) => {
    setLocalProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(localProfile);
    setIsEditing(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 pt-12 space-y-8 pb-32"
    >
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Perfil</h1>
          <p className="text-zinc-400">Seus dados pessoais.</p>
        </div>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="p-2 bg-zinc-800 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
          >
            <Pencil size={20} />
          </button>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={() => { setLocalProfile(profile); setIsEditing(false); }}
              className="p-2 bg-zinc-800 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
            >
              <X size={20} />
            </button>
            <button 
              onClick={handleSave}
              className="p-2 bg-brand-500 rounded-full text-zinc-950 hover:bg-brand-400 transition-colors"
            >
              <Check size={20} />
            </button>
          </div>
        )}
      </header>

      <div className="space-y-6">
        {isEditing ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Nome</label>
              <input type="text" value={localProfile.name} onChange={e => handleChange('name', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-lg focus:outline-none focus:border-brand-500 transition-colors" placeholder="Seu nome" />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Email</label>
              <input type="email" value={localProfile.email || ''} onChange={e => handleChange('email', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-lg focus:outline-none focus:border-brand-500 transition-colors" placeholder="seu@email.com" />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Senha</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={localProfile.password || ''} onChange={e => handleChange('password', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-lg focus:outline-none focus:border-brand-500 transition-colors pr-10" placeholder="Nova senha" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Peso (kg)</label>
                <input type="number" value={localProfile.weight || ''} onChange={e => handleChange('weight', parseFloat(e.target.value) || 0)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-lg focus:outline-none focus:border-brand-500 transition-colors" placeholder="0.0" />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Altura (cm)</label>
                <input type="number" value={localProfile.height || ''} onChange={e => handleChange('height', parseInt(e.target.value) || 0)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-lg focus:outline-none focus:border-brand-500 transition-colors" placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Idade</label>
                <input type="number" value={localProfile.age || ''} onChange={e => handleChange('age', parseInt(e.target.value) || 0)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-lg focus:outline-none focus:border-brand-500 transition-colors" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Gênero</label>
                <select value={localProfile.gender} onChange={e => handleChange('gender', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-lg focus:outline-none focus:border-brand-500 transition-colors appearance-none">
                  <option value="male">Masculino</option>
                  <option value="female">Feminino</option>
                  <option value="other">Outro</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Condição Física</label>
              <select value={localProfile.activityLevel || ''} onChange={e => handleChange('activityLevel', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-lg focus:outline-none focus:border-brand-500 transition-colors appearance-none">
                <option value="">-- selecionar --</option>
                <option value="sedentary">Sedentário (pouco/nenhum exercício)</option>
                <option value="lightly_active">Levemente ativo (atividade até 2 dias/sem)</option>
                <option value="moderately_active">Moderadamente ativo (atividade até 4 dias/sem)</option>
                <option value="very_active">Muito ativo (atividade até 6 dias/sem)</option>
                <option value="extremely_active">Extremamente ativo (atividade 7 dias/sem)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Defina o Objetivo</label>
              <select value={localProfile.goal || ''} onChange={e => handleChange('goal', e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-lg focus:outline-none focus:border-brand-500 transition-colors appearance-none">
                <option value="">-- selecionar --</option>
                <option value="maintenance">Manutenção</option>
                <option value="weight_loss">Perda de Peso</option>
                <option value="muscle_gain">Ganho de Massa</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-zinc-800 border-2 border-brand-500 flex items-center justify-center text-brand-500 font-bold text-2xl flex-shrink-0">
                {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div>
                <div className="text-xl font-bold">{profile.name || 'Sem nome'}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{profile.email || '-'}</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-px bg-zinc-700 rounded-2xl overflow-hidden mb-3">
              {[
                { val: profile.weight ? `${profile.weight}` : '-', label: 'kg' },
                { val: profile.height ? `${profile.height}` : '-', label: 'cm' },
                { val: profile.age ? `${profile.age}` : '-', label: 'anos' },
                { val: profile.gender === 'male' ? 'M' : profile.gender === 'female' ? 'F' : '-', label: 'gênero' },
              ].map((item, i) => (
                <div key={i} className="bg-zinc-900 py-3 px-2 text-center">
                  <div className="text-lg font-bold text-zinc-100">{item.val}</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              {profile.activityLevel && (
                <span className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-400">
                  {{ sedentary: 'Sedentário', lightly_active: 'Levemente Ativo', moderately_active: 'Moderadamente Ativo', very_active: 'Muito Ativo', extremely_active: 'Extremamente Ativo' }[profile.activityLevel]}
                </span>
              )}
              {profile.goal && (
                <span className="bg-brand-500/5 border border-brand-500/30 rounded-lg px-3 py-1.5 text-xs text-brand-500">
                  ⚡ {{ maintenance: 'Manutenção', weight_loss: 'Perda de Peso', muscle_gain: 'Ganho de Massa' }[profile.goal]}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="text-zinc-500 mb-2">IMC</div>
            <div className="text-2xl font-bold text-brand-400">
              {profile.weight && profile.height ? (profile.weight / ((profile.height / 100) ** 2)).toFixed(1) : '-'}
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="text-zinc-500 mb-2">TMB (Basal)</div>
            <div className="text-2xl font-bold text-brand-400">
              {profile.weight && profile.height && profile.age ? Math.round((10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) + (profile.gender === 'female' ? -161 : 5)) : '-'} <span className="text-sm text-zinc-500 font-normal">kcal</span>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 col-span-2">
            <div className="text-zinc-500 mb-2">Meta Diária (Estimada)</div>
            <div className="text-2xl font-bold text-brand-400">
              {(() => {
                if (!profile.weight || !profile.height || !profile.age) return '-';
                const bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) + (profile.gender === 'female' ? -161 : 5);
                const multipliers: Record<string, number> = { sedentary: 1.2, lightly_active: 1.375, moderately_active: 1.55, very_active: 1.725, extremely_active: 1.9 };
                const multiplier = multipliers[profile.activityLevel || 'sedentary'] || 1.2;
                let tdee = bmr * multiplier;
                if (profile.goal === 'weight_loss') tdee -= (profile.gender === 'female' ? 300 : 500);
                else if (profile.goal === 'muscle_gain') tdee += (profile.gender === 'female' ? 300 : 500);
                return Math.round(tdee);
              })()} <span className="text-sm text-zinc-500 font-normal">kcal</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-brand-500 text-center opacity-80 px-4">
          <p>Os valores informados (IMC, TMB e metas calóricas) são estimativas referenciais e puramente indicativas. Estes dados não substituem diagnósticos médicos ou prescrições profissionais personalizadas.</p>
        </div>

        <button 
          onClick={onLogout}
          className="w-full py-4 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw size={20} />
          Sair da Conta
        </button>
      </div>
    </motion.div>
  );
}
// --- Auth View ---
function AuthView({ onLogin, onCreateAccount, existingProfile }: { onLogin: (email: string, pass: string) => Promise<boolean>, onCreateAccount: (profile: UserProfile) => Promise<boolean>, existingProfile?: UserProfile, key?: React.Key }) {
  const [isLoginMode, setIsLoginMode] = useState(!!existingProfile?.email);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Clear fields when switching modes
  useEffect(() => {
    setError('');
    setEmail('');
    setPassword('');
    setName('');
  }, [isLoginMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLoginMode) {
        if (!email || !password) {
          setError('Preencha todos os campos.');
          setLoading(false);
          return;
        }
        const success = await onLogin(email, password);
        if (!success) {
          setError('Email ou senha incorretos.');
        }
      } else {
        if (!name || !email || !password) {
          setError('Preencha todos os campos.');
          setLoading(false);
          return;
        }
        const success = await onCreateAccount({
          name,
          email,
          password,
          weight: 0,
          height: 0,
          age: 0,
          gender: 'other'
        });
        if (success) {
           setIsLoginMode(true);
           setError('Conta criada com sucesso! Faça login para continuar.');
           // Password cleared by useEffect dependency on isLoginMode
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-screen p-6"
    >
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold tracking-tighter mb-2">
            <span className="text-white">Iron</span>
            <span className="text-brand-500">Track</span>
          </h1>
          <p className="text-zinc-500 font-mono text-sm uppercase tracking-[0.2em]">
            Sua rotina de força
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="flex border-b border-zinc-800 pb-4">
            <button 
              onClick={() => setIsLoginMode(true)}
              className={`flex-1 pb-2 text-sm font-medium transition-colors ${isLoginMode ? 'text-brand-500 border-b-2 border-brand-500' : 'text-zinc-500'}`}
            >
              Entrar
            </button>
            <button 
              onClick={() => setIsLoginMode(false)}
              className={`flex-1 pb-2 text-sm font-medium transition-colors ${!isLoginMode ? 'text-brand-500 border-b-2 border-brand-500' : 'text-zinc-500'}`}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            {!isLoginMode && (
              <div>
                <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Nome</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-lg focus:outline-none focus:border-brand-500 transition-colors"
                  placeholder="Seu nome"
                  autoComplete="off"
                  name="signup_name"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-lg focus:outline-none focus:border-brand-500 transition-colors"
                placeholder="seu@email.com"
                autoComplete="off"
                name={isLoginMode ? "login_email" : "signup_email"}
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Senha</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-lg focus:outline-none focus:border-brand-500 transition-colors"
                placeholder="********"
                autoComplete="new-password"
                name={isLoginMode ? "login_password" : "signup_password"}
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-[#18181b] p-2 rounded-lg border border-[#18181b]">
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brand-500 text-zinc-950 hover:bg-brand-400 rounded-xl font-bold transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Carregando...' : (isLoginMode ? 'Entrar' : 'Criar Conta')}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
