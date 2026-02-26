import React, { useState, useEffect } from 'react';
import { Home, PlusCircle, Activity, History as HistoryIcon, Dumbbell, Play, CheckCircle2, Clock, Calendar, ChevronRight, X, Save, Trash2, Pencil, User, TrendingUp, RotateCcw, BarChart2, Settings, LogOut, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { WorkoutPlan, WorkoutSession, Exercise, PlannedExercise, CompletedSet, CompletedExercise, UserProfile, Equipment, MuscleGroup } from './types';
import { EXERCISES, MOCK_PLANS } from './data';

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
  const [showAuth, setShowAuth] = useState(true); // Controls if AuthView is shown

  // Load from local storage
  useEffect(() => {
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
        setIsAuthenticated(false);
        setShowAuth(true);
      } else {
        // If no profile or incomplete, treat as new user (or just let them in if it's a legacy user without password)
        // For this feature request, let's force auth if they have credentials, otherwise show creation
        if (profile.name) {
           // Legacy user without password - let them in, but they can add password in profile
           setIsAuthenticated(true);
           setShowAuth(false);
        } else {
           // New user
           setIsAuthenticated(false);
           setShowAuth(true);
        }
      }
    } else {
      setIsAuthenticated(false);
      setShowAuth(true);
    }
    
    if (savedExercisesV2) {
      setExercises(JSON.parse(savedExercisesV2));
    } else if (savedExercises) {
      const customExercises = JSON.parse(savedExercises);
      // Merge custom exercises with default ones, avoiding duplicates if any
      const defaultIds = new Set(EXERCISES.map(e => e.id));
      const newCustom = customExercises.filter((e: Exercise) => !defaultIds.has(e.id));
      setExercises([...EXERCISES, ...newCustom]);
    }
    
    if (savedMuscleGroups) setMuscleGroups(JSON.parse(savedMuscleGroups));
    if (savedEquipment) setEquipmentList(JSON.parse(savedEquipment));
  }, []);

  // Save to local storage
  useEffect(() => {
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
  }, [plans, sessions, userProfile, exercises, muscleGroups, equipmentList]);

  const addExercise = (exercise: Exercise) => {
    setExercises(prev => [...prev, exercise]);
  };

  const editExercise = (exercise: Exercise) => {
    setExercises(prev => prev.map(e => e.id === exercise.id ? exercise : e));
  };

  const deleteExercise = (id: string) => {
    setExercises(prev => prev.filter(e => e.id !== id));
  };

  const savePlan = (plan: WorkoutPlan) => {
    setPlans(prev => {
      const exists = prev.find(p => p.id === plan.id);
      if (exists) {
        return prev.map(p => p.id === plan.id ? plan : p);
      }
      return [...prev, plan];
    });
    setPlanToEdit(null);
    setCurrentView('dashboard');
  };

  const deletePlan = (id: string) => {
    setPlanToDelete(id);
  };

  const confirmDelete = () => {
    if (planToDelete) {
      setPlans(prev => prev.filter(p => p.id !== planToDelete));
      setPlanToDelete(null);
    }
  };

  const editPlan = (plan: WorkoutPlan) => {
    setPlanToEdit(plan);
    setCurrentView('builder');
  };

  const togglePlanDay = (planId: string, day: number) => {
    setPlans(prev => prev.map(p => {
      if (p.id === planId) {
        const newDays = p.daysOfWeek.includes(day)
          ? p.daysOfWeek.filter(d => d !== day)
          : [...p.daysOfWeek, day].sort();
        return { ...p, daysOfWeek: newDays };
      }
      return p;
    }));
  };

  const startWorkout = (plan: WorkoutPlan) => {
    setActivePlan(plan);
    setCurrentView('active');
  };

  const finishWorkout = (session: WorkoutSession) => {
    setSessions(prev => [session, ...prev]);
    setActivePlan(null);
    setCurrentView('dashboard');
  };

  const clearHistory = () => {
    setSessions([]);
  };

  const handleLogin = (email: string, pass: string) => {
    if (userProfile.email === email && userProfile.password === pass) {
      setIsAuthenticated(true);
      setShowAuth(false);
      return true;
    }
    return false;
  };

  const handleCreateAccount = (profile: UserProfile) => {
    setUserProfile(profile);
    setIsAuthenticated(true);
    setShowAuth(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowAuth(true);
  };

  const generateSimulationData = () => {
    // 1. Create 3 Plans
    const planA: WorkoutPlan = {
      id: 'sim_plan_a',
      name: 'Simulação A - Peito/Ombro/Tríceps',
      daysOfWeek: [1],
      exercises: [
        { id: 'sim_pe_1', exerciseId: 'e1', sets: [{ reps: 10, weight: 60 }, { reps: 8, weight: 65 }] }, // Supino
        { id: 'sim_pe_2', exerciseId: 'e4', sets: [{ reps: 12, weight: 14 }, { reps: 10, weight: 16 }] }, // Desenv.
        { id: 'sim_pe_3', exerciseId: 'e6', sets: [{ reps: 15, weight: 20 }, { reps: 12, weight: 25 }] }, // Triceps
      ]
    };

    const planB: WorkoutPlan = {
      id: 'sim_plan_b',
      name: 'Simulação B - Costas/Bíceps',
      daysOfWeek: [2],
      exercises: [
        { id: 'sim_pe_4', exerciseId: 'e8', sets: [{ reps: 12, weight: 50 }, { reps: 10, weight: 55 }] }, // Puxada
        { id: 'sim_pe_5', exerciseId: 'e15', sets: [{ reps: 10, weight: 40 }, { reps: 8, weight: 45 }] }, // Remada
        { id: 'sim_pe_6', exerciseId: 'e5', sets: [{ reps: 12, weight: 10 }, { reps: 10, weight: 12 }] }, // Rosca
      ]
    };

    const planC: WorkoutPlan = {
      id: 'sim_plan_c',
      name: 'Simulação C - Pernas',
      daysOfWeek: [3],
      exercises: [
        { id: 'sim_pe_7', exerciseId: 'e2', sets: [{ reps: 10, weight: 80 }, { reps: 8, weight: 90 }] }, // Agachamento
        { id: 'sim_pe_8', exerciseId: 'e7', sets: [{ reps: 12, weight: 120 }, { reps: 10, weight: 140 }] }, // Leg Press
        { id: 'sim_pe_9', exerciseId: 'e10', sets: [{ reps: 15, weight: 40 }, { reps: 12, weight: 45 }] }, // Extensora
      ]
    };

    // Add plans if they don't exist
    setPlans(prev => {
      const newPlans = [...prev];
      if (!newPlans.find(p => p.id === planA.id)) newPlans.push(planA);
      if (!newPlans.find(p => p.id === planB.id)) newPlans.push(planB);
      if (!newPlans.find(p => p.id === planC.id)) newPlans.push(planC);
      return newPlans;
    });

    // 2. Create Sessions (History)
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Cycle 1 (Baseline) - 1 Week Ago
    const sessionA1: WorkoutSession = {
      id: 'sim_session_a1',
      planId: planA.id,
      startTime: new Date(oneWeekAgo.getTime() + 0 * 24 * 60 * 60 * 1000).toISOString(), // Monday
      endTime: new Date(oneWeekAgo.getTime() + 0 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
      exercises: [
        { exerciseId: 'e1', durationSeconds: 600, sets: [{ reps: 10, weight: 60, completedAt: new Date().toISOString(), rpe: 7 }, { reps: 8, weight: 65, completedAt: new Date().toISOString(), rpe: 8 }] },
        { exerciseId: 'e4', durationSeconds: 600, sets: [{ reps: 12, weight: 14, completedAt: new Date().toISOString(), rpe: 7 }, { reps: 10, weight: 16, completedAt: new Date().toISOString(), rpe: 8 }] },
        { exerciseId: 'e6', durationSeconds: 600, sets: [{ reps: 15, weight: 20, completedAt: new Date().toISOString(), rpe: 7 }, { reps: 12, weight: 25, completedAt: new Date().toISOString(), rpe: 8 }] },
      ]
    };

    const sessionB1: WorkoutSession = {
      id: 'sim_session_b1',
      planId: planB.id,
      startTime: new Date(oneWeekAgo.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Tuesday
      endTime: new Date(oneWeekAgo.getTime() + 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
      exercises: [
        { exerciseId: 'e8', durationSeconds: 600, sets: [{ reps: 12, weight: 50, completedAt: new Date().toISOString(), rpe: 7 }, { reps: 10, weight: 55, completedAt: new Date().toISOString(), rpe: 8 }] },
        { exerciseId: 'e15', durationSeconds: 600, sets: [{ reps: 10, weight: 40, completedAt: new Date().toISOString(), rpe: 7 }, { reps: 8, weight: 45, completedAt: new Date().toISOString(), rpe: 8 }] },
        { exerciseId: 'e5', durationSeconds: 600, sets: [{ reps: 12, weight: 10, completedAt: new Date().toISOString(), rpe: 7 }, { reps: 10, weight: 12, completedAt: new Date().toISOString(), rpe: 8 }] },
      ]
    };

    const sessionC1: WorkoutSession = {
      id: 'sim_session_c1',
      planId: planC.id,
      startTime: new Date(oneWeekAgo.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Wednesday
      endTime: new Date(oneWeekAgo.getTime() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
      exercises: [
        { exerciseId: 'e2', durationSeconds: 600, sets: [{ reps: 10, weight: 80, completedAt: new Date().toISOString(), rpe: 7 }, { reps: 8, weight: 90, completedAt: new Date().toISOString(), rpe: 8 }] },
        { exerciseId: 'e7', durationSeconds: 600, sets: [{ reps: 12, weight: 120, completedAt: new Date().toISOString(), rpe: 7 }, { reps: 10, weight: 140, completedAt: new Date().toISOString(), rpe: 8 }] },
        { exerciseId: 'e10', durationSeconds: 600, sets: [{ reps: 15, weight: 40, completedAt: new Date().toISOString(), rpe: 7 }, { reps: 12, weight: 45, completedAt: new Date().toISOString(), rpe: 8 }] },
      ]
    };

    // Cycle 2 (Current) - This Week
    // Plan A: Progress (+2kg on Supino)
    const sessionA2: WorkoutSession = {
      id: 'sim_session_a2',
      planId: planA.id,
      startTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      endTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
      exercises: [
        { exerciseId: 'e1', durationSeconds: 600, sets: [{ reps: 10, weight: 62, completedAt: new Date().toISOString(), rpe: 8 }, { reps: 8, weight: 67, completedAt: new Date().toISOString(), rpe: 9 }] }, // +2kg
        { exerciseId: 'e4', durationSeconds: 600, sets: [{ reps: 12, weight: 14, completedAt: new Date().toISOString(), rpe: 8 }, { reps: 10, weight: 16, completedAt: new Date().toISOString(), rpe: 8 }] }, // Same
        { exerciseId: 'e6', durationSeconds: 600, sets: [{ reps: 15, weight: 20, completedAt: new Date().toISOString(), rpe: 8 }, { reps: 12, weight: 25, completedAt: new Date().toISOString(), rpe: 8 }] }, // Same
      ]
    };

    // Plan B: Same weights, higher RPE
    const sessionB2: WorkoutSession = {
      id: 'sim_session_b2',
      planId: planB.id,
      startTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
      endTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
      exercises: [
        { exerciseId: 'e8', durationSeconds: 600, sets: [{ reps: 12, weight: 50, completedAt: new Date().toISOString(), rpe: 8 }, { reps: 10, weight: 55, completedAt: new Date().toISOString(), rpe: 9 }] },
        { exerciseId: 'e15', durationSeconds: 600, sets: [{ reps: 10, weight: 40, completedAt: new Date().toISOString(), rpe: 8 }, { reps: 8, weight: 45, completedAt: new Date().toISOString(), rpe: 9 }] },
        { exerciseId: 'e5', durationSeconds: 600, sets: [{ reps: 12, weight: 10, completedAt: new Date().toISOString(), rpe: 8 }, { reps: 10, weight: 12, completedAt: new Date().toISOString(), rpe: 9 }] },
      ]
    };

    // Plan C: Regress (-5kg on Agachamento)
    const sessionC2: WorkoutSession = {
      id: 'sim_session_c2',
      planId: planC.id,
      startTime: new Date(now.getTime()).toISOString(), // Today
      endTime: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
      exercises: [
        { exerciseId: 'e2', durationSeconds: 600, sets: [{ reps: 10, weight: 75, completedAt: new Date().toISOString(), rpe: 9 }, { reps: 8, weight: 85, completedAt: new Date().toISOString(), rpe: 10 }] }, // -5kg
        { exerciseId: 'e7', durationSeconds: 600, sets: [{ reps: 12, weight: 120, completedAt: new Date().toISOString(), rpe: 8 }, { reps: 10, weight: 140, completedAt: new Date().toISOString(), rpe: 9 }] },
        { exerciseId: 'e10', durationSeconds: 600, sets: [{ reps: 15, weight: 40, completedAt: new Date().toISOString(), rpe: 8 }, { reps: 12, weight: 45, completedAt: new Date().toISOString(), rpe: 9 }] },
      ]
    };

    setSessions([sessionC2, sessionB2, sessionA2, sessionC1, sessionB1, sessionA1]);
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
                  plans={plans}
                  availableExercises={exercises}
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
              onGenerateSimulation={generateSimulationData}
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
  const todaysPlans = plans.filter(p => p.daysOfWeek.includes(today));
  const [time, setTime] = useState(new Date());
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [isWeeklyExpanded, setIsWeeklyExpanded] = useState(true);
  const [isAllWorkoutsExpanded, setIsAllWorkoutsExpanded] = useState(true);
  const [reactivatedPlans, setReactivatedPlans] = useState<string[]>([]);
  const daysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const fullDaysMap = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

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
        <button 
          onClick={() => setIsWeeklyExpanded(!isWeeklyExpanded)}
          className="w-full flex items-center justify-between mb-4 group"
        >
          <h2 className="text-xl font-semibold">Treino da Semana</h2>
          <ChevronRight 
            className={`text-zinc-500 group-hover:text-zinc-300 transition-transform duration-200 ${isWeeklyExpanded ? 'rotate-90' : ''}`} 
            size={20} 
          />
        </button>
        <AnimatePresence>
          {isWeeklyExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3, 4, 5, 6, 0].map(day => { // Start from Monday (1) to Sunday (0)
                  const dayPlans = plans.filter(p => p.daysOfWeek.includes(day));
                  return (
                    <div key={day} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-lg text-brand-500">{fullDaysMap[day]}</h3>
                        <button 
                          onClick={() => onEditDay(day)}
                          className="text-zinc-500 hover:text-zinc-300 p-2 rounded-full hover:bg-zinc-800 transition-colors"
                        >
                          <Pencil size={18} />
                        </button>
                      </div>
                      {dayPlans.length > 0 ? (
                        <div className="space-y-2">
                          {dayPlans.map(plan => (
                            <div key={plan.id} className="text-zinc-300 text-sm flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-brand-500/50" />
                              {plan.name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-zinc-600 text-sm italic">Descanso</p>
                      )}
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
              <div className="space-y-4">
                {plans.map(plan => (
                  <PlanCard 
                    key={plan.id} 
                    plan={plan} 
                    availableExercises={availableExercises}
                    onStart={() => onStartWorkout(plan)} 
                    onEdit={() => onEditPlan(plan)}
                    onDelete={() => onDeletePlan(plan.id)}
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
          <p className="text-brand-500 font-medium">{fullDaysMap[day]}</p>
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

function PlanCard({ plan, availableExercises, onStart, onEdit, onDelete, isCompleted, onActivate }: { plan: WorkoutPlan, availableExercises: Exercise[], onStart: () => void, onEdit: () => void, onDelete: () => void, isCompleted?: boolean, onActivate?: () => void, key?: React.Key }) {
  const daysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-5 transition-colors group relative ${isCompleted ? 'opacity-50' : 'hover:border-brand-500/30'}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={`font-bold text-lg ${isCompleted ? 'line-through decoration-zinc-500' : ''}`}>{plan.name}</h3>
          <div className="flex gap-2 mt-2">
            {plan.daysOfWeek.map(d => (
              <span key={d} className="text-xs font-mono bg-zinc-800 text-zinc-300 px-2 py-1 rounded-md">
                {daysMap[d]}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="text-zinc-500 hover:text-zinc-300 p-2 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <Pencil size={18} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-zinc-500 hover:text-red-400 p-2 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <Trash2 size={18} />
          </button>
          {isCompleted && onActivate ? (
            <button 
              onClick={onActivate}
              className="bg-zinc-800 text-brand-500 p-3 rounded-full hover:bg-zinc-700 hover:text-brand-400 transition-colors ml-2"
              title="Repetir Treino"
            >
              <RotateCcw size={20} />
            </button>
          ) : (
            <button 
              onClick={onStart}
              className="bg-brand-500 text-zinc-950 p-3 rounded-full hover:bg-brand-400 transition-transform active:scale-95 ml-2"
            >
              <Play size={20} className="fill-current" />
            </button>
          )}
        </div>
      </div>
      
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
  const [days, setDays] = useState<number[]>(initialPlan?.daysOfWeek || []);
  const [exercises, setExercises] = useState<PlannedExercise[]>(initialPlan?.exercises || []);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  
  // Filter State
  const [filterMuscle, setFilterMuscle] = useState<string>('Todos');
  const [filterEquipment, setFilterEquipment] = useState<string>('Todos');

  // Get unique muscle groups and equipment from available exercises for filtering
  const availableMuscleGroups = Array.from(new Set(availableExercises.map(e => e.muscleGroup))).sort();
  const availableEquipment = Array.from(new Set(availableExercises.map(e => e.equipment))).sort();

  const daysMap = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const toggleDay = (d: number) => {
    setDays(prev => prev.includes(d) ? prev.filter(day => day !== d) : [...prev, d].sort());
  };

  const addExerciseToPlan = (exerciseId: string) => {
    setExercises(prev => [
      ...prev, 
      {
        id: Math.random().toString(36).substring(7),
        exerciseId,
        sets: [{ reps: 10, weight: 0 }, { reps: 10, weight: 0 }, { reps: 10, weight: 0 }]
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
      daysOfWeek: days,
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
          <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Dias da Semana</label>
          <div className="flex justify-between gap-2">
            {daysMap.map((d, i) => (
              <button
                key={i}
                onClick={() => toggleDay(i)}
                className={`w-10 h-10 rounded-full font-medium flex items-center justify-center transition-colors ${
                  days.includes(i) ? 'bg-brand-500 text-zinc-950' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
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

          <div className="space-y-4">
            {exercises.map((ex, index) => {
              const exerciseDef = availableExercises.find(e => e.id === ex.exerciseId);
              return (
                <div key={ex.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-mono text-xs text-zinc-400">
                        {index + 1}
                      </div>
                      <span className="font-semibold">{exerciseDef?.name || 'Exercício não encontrado'}</span>
                    </div>
                    <button onClick={() => removeExercise(ex.id)} className="text-red-400 p-2">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-[3rem_1fr_1fr_3rem] gap-2 text-xs font-mono text-zinc-500 px-2 mb-1">
                      <div className="text-center">Série</div>
                      <div className="text-center">Reps</div>
                      <div className="text-center">Carga (kg)</div>
                      <div className="text-center"></div>
                    </div>
                    {ex.sets.map((set, sIdx) => (
                      <div key={sIdx} className="grid grid-cols-[3rem_1fr_1fr_3rem] gap-2 items-center">
                        <div className="bg-zinc-950 rounded-lg p-2 text-center font-mono text-sm border border-zinc-800">
                          {sIdx + 1}
                        </div>
                        <input 
                          type="number" 
                          value={set.reps || ''}
                          onChange={e => updateSet(ex.id, sIdx, 'reps', parseInt(e.target.value) || 0)}
                          className="w-full min-w-0 bg-zinc-950 rounded-lg p-2 text-center font-mono text-sm border border-zinc-800 focus:outline-none focus:border-brand-500"
                        />
                        <input 
                          type="number" 
                          value={set.weight || ''}
                          onChange={e => updateSet(ex.id, sIdx, 'weight', parseInt(e.target.value) || 0)}
                          className="w-full min-w-0 bg-zinc-950 rounded-lg p-2 text-center font-mono text-sm border border-zinc-800 focus:outline-none focus:border-brand-500"
                        />
                        <button onClick={() => removeSet(ex.id, sIdx)} className="text-zinc-600 hover:text-red-400 p-1 flex justify-center items-center h-full w-full">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => addSet(ex.id)}
                      className="w-full mt-2 py-2 border border-dashed border-zinc-700 rounded-lg text-xs font-medium text-zinc-400 hover:text-brand-400 hover:border-brand-500/50 transition-colors"
                    >
                      + Adicionar Série
                    </button>
                  </div>
                </div>
              );
            })}
            {exercises.length === 0 && (
              <div className="text-center p-8 border border-dashed border-zinc-800 rounded-2xl text-zinc-500">
                Nenhum exercício adicionado.
              </div>
            )}
          </div>
        </div>
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

  const handleAdd = () => {
    if (newItem.trim()) {
      onUpdate([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleUpdate = (index: number) => {
    if (editValue.trim()) {
      const newItems = [...items];
      newItems[index] = editValue.trim();
      onUpdate(newItems);
      setEditingIndex(null);
    }
  };

  const handleDelete = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
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
          {items.map((item, index) => (
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
function ActiveWorkoutView({ plan, availableExercises, onFinish, onCancel }: { plan: WorkoutPlan, availableExercises: Exercise[], onFinish: (s: WorkoutSession) => void, onCancel: () => void, key?: React.Key }) {
  const [startTime] = useState(new Date().toISOString());
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<CompletedExercise[]>([]);
  
  // State for current exercise being performed
  const currentPlannedEx = plan.exercises[currentExIndex];
  const exerciseDef = availableExercises.find(e => e.id === currentPlannedEx?.exerciseId);
  
  const [currentSets, setCurrentSets] = useState<CompletedSet[]>([]);
  const [currentReps, setCurrentReps] = useState(currentPlannedEx?.sets[0]?.reps || 10);
  const [currentWeight, setCurrentWeight] = useState(currentPlannedEx?.sets[0]?.weight || 0);
  const [exStartTime, setExStartTime] = useState(Date.now());

  // Timer state
  const [elapsed, setElapsed] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(0);

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
    const newSet: CompletedSet = {
      reps: currentReps,
      weight: currentWeight,
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
          <button onClick={onCancel} className="text-zinc-400 hover:text-white">
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
            <div className="text-center">Reps</div>
            <div className="text-center">Carga</div>
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
                  {isCompleted ? completedData.reps : plannedSet.reps}
                </div>
                <div className="text-center font-mono text-lg">
                  {isCompleted ? completedData.weight : plannedSet.weight}
                  <span className="text-xs ml-1 opacity-50">kg</span>
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
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-center text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Reps</label>
                <div className="flex items-center justify-between bg-zinc-950 rounded-2xl p-2 border border-zinc-800">
                  <button onClick={() => setCurrentReps(Math.max(1, currentReps - 1))} className="w-10 h-10 flex items-center justify-center bg-zinc-900 rounded-xl text-xl active:scale-95">-</button>
                  <span className="text-3xl font-bold font-mono">{currentReps}</span>
                  <button onClick={() => setCurrentReps(currentReps + 1)} className="w-10 h-10 flex items-center justify-center bg-zinc-900 rounded-xl text-xl active:scale-95">+</button>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-center text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Carga (kg)</label>
                <div className="flex items-center justify-between bg-zinc-950 rounded-2xl p-2 border border-zinc-800">
                  <button onClick={() => setCurrentWeight(Math.max(0, currentWeight - 2.5))} className="w-10 h-10 flex items-center justify-center bg-zinc-900 rounded-xl text-xl active:scale-95">-</button>
                  <span className="text-3xl font-bold font-mono">{currentWeight}</span>
                  <button onClick={() => setCurrentWeight(currentWeight + 2.5)} className="w-10 h-10 flex items-center justify-center bg-zinc-900 rounded-xl text-xl active:scale-95">+</button>
                </div>
              </div>
            </div>
            
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
    </motion.div>
  );
}

// --- History View ---
function HistoryView({ sessions, plans, availableExercises, onClearHistory, onGenerateSimulation }: { sessions: WorkoutSession[], plans: WorkoutPlan[], availableExercises: Exercise[], onClearHistory: () => void, onGenerateSimulation: () => void, key?: React.Key }) {
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
          {sessions.length === 0 && (
            <button 
              onClick={onGenerateSimulation}
              className="text-brand-500 hover:text-brand-400 p-2 rounded-full hover:bg-zinc-800 transition-colors"
              title="Gerar Simulação"
            >
              <Play size={20} />
            </button>
          )}
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

  const handleCreateExercise = () => {
    if (!newExerciseName.trim()) return;
    
    if (editingExercise) {
      onEditExercise({
        ...editingExercise,
        name: newExerciseName,
        muscleGroup: newExerciseMuscle,
        equipment: newExerciseEquipment
      });
      setEditingExercise(null);
    } else {
      const newExercise: Exercise = {
        id: `custom_${Date.now()}`,
        name: newExerciseName,
        muscleGroup: newExerciseMuscle,
        equipment: newExerciseEquipment
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
              {muscleGroups.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider">Equipamento</label>
              <button onClick={() => setManagingList('equipment')} className="text-xs text-brand-500 font-medium hover:text-brand-400">Gerenciar</button>
            </div>
            <select 
              value={newExerciseEquipment}
              onChange={e => setNewExerciseEquipment(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-lg focus:outline-none focus:border-brand-500 transition-colors appearance-none"
            >
              {equipmentList.map(e => (
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
                {muscleGroups.map(m => (
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
                {equipmentList.map(e => (
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
function SettingsView({ 
  onBack, 
  plans, 
  availableExercises 
}: { 
  onBack: () => void, 
  plans: WorkoutPlan[], 
  availableExercises: Exercise[],
  key?: React.Key 
}) {
  const handlePrint = () => {
    window.print();
  };

  const daysMap = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  return (
    <>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-area, #printable-area * {
              visibility: visible;
            }
            #printable-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              height: 50vh; /* Occupy half A4 roughly */
              overflow: hidden;
            }
            @page {
              size: A4;
              margin: 1cm;
            }
          }
        `}
      </style>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-6 pt-12 space-y-8 pb-32 print:hidden"
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

        <div className="space-y-4">
           <button 
            onClick={handlePrint}
            className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between hover:border-brand-500 transition-colors group"
           >
             <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-brand-500 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                 <Printer size={20} />
               </div>
               <div className="text-left">
                 <h3 className="font-semibold text-zinc-200">Imprimir Treino Semanal</h3>
                 <p className="text-sm text-zinc-500">Gerar PDF compacto para impressão</p>
               </div>
             </div>
             <ChevronRight className="text-zinc-600 group-hover:text-zinc-300" size={20} />
           </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-4">
          <Settings className="mx-auto text-zinc-600" size={48} />
          <h3 className="text-xl font-semibold text-zinc-300">Mais Opções</h3>
          <p className="text-zinc-500 max-w-xs mx-auto">
            Novas opções de personalização e ajustes estarão disponíveis em breve.
          </p>
        </div>
      </motion.div>

      {/* Printable View (Hidden on Screen) */}
      <div id="printable-area" className="hidden print:block bg-white text-black p-4 font-sans">
        <h1 className="text-xl font-bold mb-4 text-center border-b pb-2 uppercase tracking-wide">Cronograma de Treinos - IronTrack</h1>
        <div className="grid grid-cols-2 gap-4 text-xs">
          {daysMap.map((dayName, index) => {
            const dayPlans = plans.filter(p => p.daysOfWeek.includes(index));
            if (dayPlans.length === 0) return null;

            return (
              <div key={index} className="border border-gray-300 rounded-lg p-3 break-inside-avoid bg-gray-50">
                <h3 className="font-bold text-sm bg-gray-200 p-1 rounded mb-2 text-center uppercase">{dayName}</h3>
                {dayPlans.map(plan => (
                  <div key={plan.id} className="mb-3 last:mb-0">
                    <div className="font-bold text-xs mb-1 text-blue-800 uppercase tracking-tight">{plan.name}</div>
                    <ul className="space-y-1">
                      {plan.exercises.map(ex => {
                        const exerciseDef = availableExercises.find(e => e.id === ex.exerciseId);
                        return (
                          <li key={ex.id} className="flex flex-col border-b border-gray-200 pb-1 last:border-0">
                            <span className="font-semibold truncate">{exerciseDef?.name || 'Exercício'}</span>
                            <div className="pl-2 text-gray-600 font-mono text-[10px]">
                              {ex.sets.map((s, i) => (
                                <span key={i} className="mr-2">
                                  {s.reps}x{s.weight}kg
                                </span>
                              ))}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <div className="mt-4 text-center text-[10px] text-gray-400 uppercase tracking-widest">
          Gerado por IronTrack
        </div>
      </div>
    </>
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
              onClick={() => {
                setLocalProfile(profile);
                setIsEditing(false);
              }}
              className="p-2 bg-zinc-800 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
            >
              <X size={20} />
            </button>
            <button 
              onClick={handleSave}
              className="p-2 bg-brand-500 rounded-full text-zinc-950 hover:bg-brand-400 transition-colors"
            >
              <Save size={20} />
            </button>
          </div>
        )}
      </header>

      <div className="space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Nome</label>
            {isEditing ? (
              <input 
                type="text" 
                value={localProfile.name}
                onChange={e => handleChange('name', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-lg focus:outline-none focus:border-brand-500 transition-colors"
                placeholder="Seu nome"
              />
            ) : (
              <div className="text-xl font-medium">{profile.name || 'Não informado'}</div>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Email</label>
            {isEditing ? (
              <input 
                type="email" 
                value={localProfile.email || ''}
                onChange={e => handleChange('email', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-lg focus:outline-none focus:border-brand-500 transition-colors"
                placeholder="seu@email.com"
              />
            ) : (
              <div className="text-xl font-medium">{profile.email || '-'}</div>
            )}
          </div>

          {isEditing && (
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Senha</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={localProfile.password || ''}
                  onChange={e => handleChange('password', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-lg focus:outline-none focus:border-brand-500 transition-colors pr-10"
                  placeholder="Nova senha"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Peso (kg)</label>
              {isEditing ? (
                <input 
                  type="number" 
                  value={localProfile.weight || ''}
                  onChange={e => handleChange('weight', parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-lg focus:outline-none focus:border-brand-500 transition-colors"
                  placeholder="0.0"
                />
              ) : (
                <div className="text-xl font-medium">{profile.weight ? `${profile.weight} kg` : '-'}</div>
              )}
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Altura (cm)</label>
              {isEditing ? (
                <input 
                  type="number" 
                  value={localProfile.height || ''}
                  onChange={e => handleChange('height', parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-lg focus:outline-none focus:border-brand-500 transition-colors"
                  placeholder="0"
                />
              ) : (
                <div className="text-xl font-medium">{profile.height ? `${profile.height} cm` : '-'}</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Idade</label>
              {isEditing ? (
                <input 
                  type="number" 
                  value={localProfile.age || ''}
                  onChange={e => handleChange('age', parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-lg focus:outline-none focus:border-brand-500 transition-colors"
                  placeholder="0"
                />
              ) : (
                <div className="text-xl font-medium">{profile.age ? `${profile.age} anos` : '-'}</div>
              )}
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Gênero</label>
              {isEditing ? (
                <select 
                  value={localProfile.gender}
                  onChange={e => handleChange('gender', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-lg focus:outline-none focus:border-brand-500 transition-colors appearance-none"
                >
                  <option value="male">Masculino</option>
                  <option value="female">Feminino</option>
                  <option value="other">Outro</option>
                </select>
              ) : (
                <div className="text-xl font-medium">
                  {profile.gender === 'male' ? 'Masculino' : profile.gender === 'female' ? 'Feminino' : 'Outro'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="text-zinc-500 mb-2">IMC</div>
            <div className="text-2xl font-bold text-brand-400">
              {profile.weight && profile.height 
                ? (profile.weight / ((profile.height / 100) ** 2)).toFixed(1)
                : '-'}
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="text-zinc-500 mb-2">Meta Diária</div>
            <div className="text-2xl font-bold text-brand-400">
              {profile.weight ? Math.round(profile.weight * 30) : '-'} <span className="text-sm text-zinc-500 font-normal">kcal</span>
            </div>
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="w-full py-4 bg-transparent text-red-500 hover:bg-zinc-900 rounded-xl font-medium text-xl transition-colors flex items-center justify-center gap-3"
        >
          <LogOut size={28} />
          Sair
        </button>
      </div>
    </motion.div>
  );
}

// --- Auth View ---
function AuthView({ onLogin, onCreateAccount, existingProfile }: { onLogin: (email: string, pass: string) => boolean, onCreateAccount: (profile: UserProfile) => void, existingProfile?: UserProfile, key?: React.Key }) {
  const [isLoginMode, setIsLoginMode] = useState(!!existingProfile?.email);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLoginMode) {
      if (!email || !password) {
        setError('Preencha todos os campos.');
        return;
      }
      const success = onLogin(email, password);
      if (!success) {
        setError('Email ou senha incorretos.');
      }
    } else {
      if (!name || !email || !password) {
        setError('Preencha todos os campos.');
        return;
      }
      onCreateAccount({
        name,
        email,
        password,
        weight: 0,
        height: 0,
        age: 0,
        gender: 'other'
      });
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
              onClick={() => { setIsLoginMode(true); setError(''); }}
              className={`flex-1 pb-2 text-sm font-medium transition-colors ${isLoginMode ? 'text-brand-500 border-b-2 border-brand-500' : 'text-zinc-500'}`}
            >
              Entrar
            </button>
            <button 
              onClick={() => { setIsLoginMode(false); setError(''); }}
              className={`flex-1 pb-2 text-sm font-medium transition-colors ${!isLoginMode ? 'text-brand-500 border-b-2 border-brand-500' : 'text-zinc-500'}`}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginMode && (
              <div>
                <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Nome</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-lg focus:outline-none focus:border-brand-500 transition-colors"
                  placeholder="Seu nome"
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
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                {error}
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-4 bg-brand-500 text-zinc-950 hover:bg-brand-400 rounded-xl font-bold transition-colors shadow-lg shadow-brand-500/20"
            >
              {isLoginMode ? 'Entrar' : 'Começar Agora'}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
