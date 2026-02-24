import React, { useState, useEffect } from 'react';
import { Home, PlusCircle, Activity, History as HistoryIcon, Dumbbell, Play, CheckCircle2, Clock, Calendar, ChevronRight, X, Save, Trash2, Pencil, User, TrendingUp, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WorkoutPlan, WorkoutSession, Exercise, PlannedExercise, CompletedSet, CompletedExercise, UserProfile, Equipment, MuscleGroup } from './types';
import { EXERCISES, MOCK_PLANS } from './data';

const DEFAULT_MUSCLE_GROUPS = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core', 'Cardio'];
const DEFAULT_EQUIPMENT = ['Halteres', 'Barra', 'Máquina', 'Peso Corporal', 'Cabos', 'Kettlebell'];

type View = 'dashboard' | 'builder' | 'active' | 'history' | 'profile' | 'exercises' | 'weekly-schedule';

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
    if (savedProfile) setUserProfile(JSON.parse(savedProfile));
    
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-emerald-500/30">
      <main className="pb-24 max-w-md mx-auto min-h-screen relative overflow-hidden">
        <AnimatePresence mode="wait">
          {currentView === 'dashboard' && (
            <DashboardView 
              key="dashboard" 
              plans={plans} 
              sessions={sessions}
              availableExercises={exercises}
              userProfile={userProfile}
              onUpdateProfile={setUserProfile}
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
            />
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
      {currentView !== 'active' && (
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
              icon={<HistoryIcon size={24} />} 
              label="Histórico" 
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
      className={`flex flex-col items-center justify-center gap-1 transition-colors w-full ${isActive ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
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
  onUpdateProfile,
  onStartWorkout, 
  onNewPlan, 
  onEditPlan, 
  onDeletePlan,
  onEditDay
}: { 
  plans: WorkoutPlan[], 
  sessions: WorkoutSession[], 
  availableExercises: Exercise[], 
  userProfile: UserProfile,
  onUpdateProfile: (p: UserProfile) => void,
  onStartWorkout: (p: WorkoutPlan) => void, 
  onNewPlan: () => void, 
  onEditPlan: (p: WorkoutPlan) => void, 
  onDeletePlan: (id: string) => void, 
  onEditDay: (day: number) => void,
  key?: React.Key 
}) {
  const today = new Date().getDay();
  const todaysPlans = plans.filter(p => p.daysOfWeek.includes(today));
  const [time, setTime] = useState(new Date());
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [reactivatedPlans, setReactivatedPlans] = useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const daysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const fullDaysMap = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('A imagem é muito grande. Por favor, escolha uma imagem menor que 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const result = reader.result as string;
          onUpdateProfile({ ...userProfile, photoUrl: result });
        } catch (error) {
          console.error('Error updating profile photo:', error);
          alert('Erro ao processar a imagem. Tente outra.');
        }
      };
      reader.onerror = () => {
        console.error('FileReader error');
        alert('Erro ao ler o arquivo.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    onUpdateProfile({ ...userProfile, photoUrl: undefined });
    setShowPhotoOptions(false);
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
          <h1 className="text-4xl font-bold tracking-tighter">Iron<span className="text-emerald-500">Track</span></h1>
          <p className="text-zinc-400 mt-2 font-mono text-sm">SUA ROTINA DE FORÇA</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <div className="text-sm font-bold text-zinc-100 tracking-tight uppercase flex items-center gap-2">
              {time.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
              <span className="text-emerald-500">{time.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
            </div>
            <div className="text-xs font-mono text-zinc-500 bg-zinc-900/80 px-2 py-1 rounded-md border border-zinc-800 flex items-center gap-1.5">
              <Clock size={10} />
              {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          
          <div 
            onClick={() => {
              if (userProfile.photoUrl) {
                setShowPhotoOptions(true);
              } else {
                fileInputRef.current?.click();
              }
            }}
            className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden cursor-pointer hover:border-emerald-500 transition-colors"
          >
            {userProfile.photoUrl ? (
              <img src={userProfile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-zinc-400">
                {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
              </span>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handlePhotoUpload} 
              accept="image/png, image/jpeg" 
              className="hidden" 
            />
          </div>
        </div>
      </header>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="text-emerald-500" size={20} />
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
        <h2 className="text-xl font-semibold mb-4">Treino da Semana</h2>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3, 4, 5, 6, 0].map(day => { // Start from Monday (1) to Sunday (0)
            const dayPlans = plans.filter(p => p.daysOfWeek.includes(day));
            return (
              <div key={day} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-emerald-500">{fullDaysMap[day]}</h3>
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
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
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
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Todos os Treinos</h2>
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
      </section>

      {/* Photo Options Modal */}
      <AnimatePresence>
        {showPhotoOptions && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPhotoOptions(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-xs w-full shadow-xl space-y-3"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-center mb-4">Foto de Perfil</h3>
              <button 
                onClick={() => {
                  setShowPhotoOptions(false);
                  fileInputRef.current?.click();
                }}
                className="w-full py-3 rounded-xl font-medium bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors"
              >
                Alterar Foto
              </button>
              <button 
                onClick={handleRemovePhoto}
                className="w-full py-3 rounded-xl font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
              >
                Remover Foto
              </button>
              <button 
                onClick={() => setShowPhotoOptions(false)}
                className="w-full py-3 rounded-xl font-medium text-zinc-400 hover:text-zinc-300 transition-colors"
              >
                Cancelar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                      className="w-full flex items-center justify-between bg-zinc-950 border border-zinc-800 p-4 rounded-xl hover:border-emerald-500/50 transition-colors text-left group"
                    >
                      <div>
                        <div className="font-semibold group-hover:text-emerald-400 transition-colors">{plan.name}</div>
                        <div className="text-xs text-zinc-500 font-mono mt-1">{plan.exercises.length} exercícios</div>
                      </div>
                      <Play className="text-zinc-500 group-hover:text-emerald-500" size={20} />
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
          <p className="text-emerald-500 font-medium">{fullDaysMap[day]}</p>
        </div>
      </header>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="text-emerald-500" size={20} />
            Treinos do Dia
          </h2>
          {dayPlans.length > 0 ? (
            <div className="space-y-3">
              {dayPlans.map(plan => (
                <div key={plan.id} className="bg-zinc-900 border border-emerald-500/30 rounded-xl p-4">
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
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{plan.name}</span>
                    {isSelected ? (
                      <CheckCircle2 size={20} className="text-emerald-500" />
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
    <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-5 transition-colors group relative ${isCompleted ? 'opacity-50' : 'hover:border-emerald-500/30'}`}>
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
              className="bg-zinc-800 text-zinc-300 p-3 rounded-full hover:bg-zinc-700 hover:text-emerald-400 transition-colors ml-2"
              title="Repetir Treino"
            >
              <RotateCcw size={20} />
            </button>
          ) : (
            <button 
              onClick={onStart}
              className="bg-emerald-500 text-zinc-950 p-3 rounded-full hover:bg-emerald-400 transition-transform active:scale-95 ml-2"
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
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
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
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
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
              className="w-full flex items-center justify-between bg-zinc-900 border border-zinc-800 p-4 rounded-xl hover:border-emerald-500/50 transition-colors text-left"
            >
              <div>
                <div className="font-semibold">{ex.name}</div>
                <div className="text-xs text-zinc-500 font-mono mt-1">{ex.muscleGroup} • {ex.equipment}</div>
              </div>
              <PlusCircle className="text-emerald-500" size={20} />
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
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-lg focus:outline-none focus:border-emerald-500 transition-colors"
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
                  days.includes(i) ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
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
              className="text-emerald-400 text-sm font-medium flex items-center gap-1"
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
                          className="w-full min-w-0 bg-zinc-950 rounded-lg p-2 text-center font-mono text-sm border border-zinc-800 focus:outline-none focus:border-emerald-500"
                        />
                        <input 
                          type="number" 
                          value={set.weight || ''}
                          onChange={e => updateSet(ex.id, sIdx, 'weight', parseInt(e.target.value) || 0)}
                          className="w-full min-w-0 bg-zinc-950 rounded-lg p-2 text-center font-mono text-sm border border-zinc-800 focus:outline-none focus:border-emerald-500"
                        />
                        <button onClick={() => removeSet(ex.id, sIdx)} className="text-zinc-600 hover:text-red-400 p-1 flex justify-center items-center h-full w-full">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => addSet(ex.id)}
                      className="w-full mt-2 py-2 border border-dashed border-zinc-700 rounded-lg text-xs font-medium text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors"
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
        className="w-full bg-emerald-500 text-zinc-950 py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-3 focus:outline-none focus:border-emerald-500"
          />
          <button onClick={handleAdd} className="bg-emerald-500 text-zinc-950 p-3 rounded-xl">
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
                    className="flex-1 bg-zinc-900 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  <button onClick={() => handleUpdate(index)} className="text-emerald-500 p-2"><CheckCircle2 size={18} /></button>
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
          <div className="font-mono text-xl font-bold text-emerald-400 tracking-wider">
            {formatTime(elapsed)}
          </div>
          <button onClick={finishExercise} className="text-emerald-500 text-sm font-bold">
            PULAR
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500 ease-out"
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
              className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-6 mb-8 text-center"
            >
              <div className="text-emerald-500 font-mono text-sm mb-2 uppercase tracking-widest">Descanso</div>
              <div className="text-5xl font-bold font-mono text-emerald-400 mb-4">{formatTime(restTime)}</div>
              <button 
                onClick={() => setIsResting(false)}
                className="bg-emerald-500/20 text-emerald-400 px-6 py-2 rounded-full text-sm font-bold hover:bg-emerald-500/30 transition-colors"
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
                  isCurrent ? 'bg-zinc-900 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 
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
                  {isCompleted && <CheckCircle2 size={18} className="text-emerald-500" />}
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
              className="w-full bg-emerald-500 text-zinc-950 py-4 rounded-2xl font-bold text-xl active:scale-[0.98] transition-transform shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              CONCLUIR SÉRIE
            </button>
          </div>
        )}

        {isLastSet && !isResting && (
          <button 
            onClick={finishExercise}
            className="w-full bg-emerald-500 text-zinc-950 py-4 rounded-2xl font-bold text-xl active:scale-[0.98] transition-transform shadow-[0_0_20px_rgba(16,185,129,0.3)] mb-[env(safe-area-inset-bottom)]"
          >
            {isLastExercise ? 'FINALIZAR TREINO' : 'PRÓXIMO EXERCÍCIO'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// --- History View ---
function HistoryView({ sessions, plans, availableExercises }: { sessions: WorkoutSession[], plans: WorkoutPlan[], availableExercises: Exercise[], key?: React.Key }) {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  // Get all unique exercises performed in history
  const performedExerciseIds = Array.from(new Set(
    sessions.flatMap(s => s.exercises.map(e => e.exerciseId))
  ));

  const chartData = selectedExerciseId ? sessions
    .filter(s => s.exercises.some(e => e.exerciseId === selectedExerciseId))
    .map(s => {
      const ex = s.exercises.find(e => e.exerciseId === selectedExerciseId);
      const maxWeight = ex ? Math.max(...ex.sets.map(set => set.weight)) : 0;
      return {
        date: new Date(s.startTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        weight: maxWeight,
        fullDate: new Date(s.startTime).toLocaleDateString('pt-BR')
      };
    })
    .reverse() : [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 pt-12 space-y-4"
    >
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Histórico</h1>
        <p className="text-zinc-400">Seus treinos concluídos.</p>
      </header>

      {/* Progress Chart Section */}
      {performedExerciseIds.length > 0 && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="text-emerald-500" size={20} />
            <h2 className="font-bold text-lg">Progressão de Carga</h2>
          </div>
          
          <div className="mb-4">
            <select 
              value={selectedExerciseId || ''} 
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
            >
              <option value="">Selecione um exercício</option>
              {performedExerciseIds.map(id => {
                const exDef = availableExercises.find(e => e.id === id);
                return <option key={id} value={id}>{exDef?.name || 'Exercício desconhecido'}</option>
              })}
            </select>
          </div>

          {selectedExerciseId && chartData.length > 0 ? (
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#71717a" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickMargin={10}
                  />
                  <YAxis 
                    stroke="#71717a" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `${value}kg`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                    itemStyle={{ color: '#10b981' }}
                    labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                    formatter={(value: number) => [`${value} kg`, 'Carga Máxima']}
                    labelFormatter={(label, payload) => payload[0]?.payload.fullDate}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    dot={{ fill: '#10b981', r: 4 }} 
                    activeDot={{ r: 6, fill: '#34d399' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : selectedExerciseId ? (
            <div className="text-center py-8 text-zinc-500 text-sm">
              Dados insuficientes para exibir o gráfico.
            </div>
          ) : null}
        </section>
      )}

      {sessions.length === 0 ? (
        <div className="text-center p-8 border border-dashed border-zinc-800 rounded-2xl text-zinc-500 mt-8">
          <HistoryIcon className="mx-auto mb-4 opacity-50" size={32} />
          Nenhum treino registrado ainda.
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="font-bold text-lg px-1">Últimos Treinos</h2>
          {sessions.map(session => {
            const plan = plans.find(p => p.id === session.planId);
            const date = new Date(session.startTime);
            const duration = session.endTime ? Math.floor((new Date(session.endTime).getTime() - date.getTime()) / 60000) : 0;
            const totalVolume = session.exercises.reduce((acc, ex) => {
              return acc + ex.sets.reduce((setAcc, set) => setAcc + (set.reps * set.weight), 0);
            }, 0);

            return (
              <div key={session.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg">{plan?.name || 'Treino Excluído'}</h3>
                    <div className="text-sm text-zinc-400 mt-0.5">
                      {date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <div className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full text-xs font-mono flex items-center gap-1">
                    <Clock size={12} />
                    {duration} min
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-zinc-800/50">
                  <div>
                    <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-0.5">Exercícios</div>
                    <div className="font-bold text-xl">{session.exercises.length}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-0.5">Volume Total</div>
                    <div className="font-bold text-xl">{totalVolume} <span className="text-sm text-zinc-500 font-normal">kg</span></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
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
            className="p-3 bg-emerald-500 rounded-full text-zinc-950 hover:bg-emerald-400 transition-colors"
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
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-lg focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider">Grupo Muscular</label>
              <button onClick={() => setManagingList('muscle')} className="text-xs text-emerald-500 font-medium hover:text-emerald-400">Gerenciar</button>
            </div>
            <select 
              value={newExerciseMuscle}
              onChange={e => setNewExerciseMuscle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-lg focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
            >
              {muscleGroups.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider">Equipamento</label>
              <button onClick={() => setManagingList('equipment')} className="text-xs text-emerald-500 font-medium hover:text-emerald-400">Gerenciar</button>
            </div>
            <select 
              value={newExerciseEquipment}
              onChange={e => setNewExerciseEquipment(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-lg focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
            >
              {equipmentList.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={handleCreateExercise}
            disabled={!newExerciseName.trim()}
            className="w-full bg-emerald-500 text-zinc-950 py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
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
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
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

// --- Profile View ---
function ProfileView({ profile, onSave }: { profile: UserProfile, onSave: (p: UserProfile) => void, key?: React.Key }) {
  const [localProfile, setLocalProfile] = useState(profile);
  const [isEditing, setIsEditing] = useState(false);

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
      className="p-6 pt-12 space-y-8"
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
              className="p-2 bg-emerald-500 rounded-full text-zinc-950 hover:bg-emerald-400 transition-colors"
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
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-lg focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Seu nome"
              />
            ) : (
              <div className="text-xl font-medium">{profile.name || 'Não informado'}</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">Peso (kg)</label>
              {isEditing ? (
                <input 
                  type="number" 
                  value={localProfile.weight || ''}
                  onChange={e => handleChange('weight', parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-lg focus:outline-none focus:border-emerald-500 transition-colors"
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
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-lg focus:outline-none focus:border-emerald-500 transition-colors"
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
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-lg focus:outline-none focus:border-emerald-500 transition-colors"
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
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-lg focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
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
            <div className="text-2xl font-bold text-emerald-400">
              {profile.weight && profile.height 
                ? (profile.weight / ((profile.height / 100) ** 2)).toFixed(1)
                : '-'}
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="text-zinc-500 mb-2">Meta Diária</div>
            <div className="text-2xl font-bold text-emerald-400">
              {profile.weight ? Math.round(profile.weight * 30) : '-'} <span className="text-sm text-zinc-500 font-normal">kcal</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
