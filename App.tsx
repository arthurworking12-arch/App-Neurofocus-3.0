
import React, { useEffect, useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Routines from './pages/Routines';
import FocusMode from './pages/FocusMode';
import Insights from './pages/Insights';
import NeuroChat from './pages/NeuroChat';
import Settings from './pages/Settings';
import Login from './pages/Login';
import NeuroSetup from './components/NeuroSetup';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { UserProfile, Task, TaskType, TaskPriority, Subtask, UserActivity } from './types';
import { Session } from '@supabase/supabase-js';
import { Trophy, Zap, Crown } from 'lucide-react';
import { decomposeTask } from './services/geminiService';
import { playSound } from './services/soundService';

const MOTIVATIONAL_QUOTES = [
  "Dopamina liberada! O cérebro agradece.",
  "Mais um passo rumo à sua melhor versão.",
  "Foco total! Você está no controle.",
  "Neuroplasticidade em ação: hábito fortalecido!",
  "Pequenas vitórias constroem grandes impérios.",
  "Sua disciplina é sua liberdade.",
  "Fluxo neural otimizado com sucesso.",
  "A constância vence a intensidade.",
  "Cada check é um voto na pessoa que você quer ser."
];

// Helper para obter a data local no formato YYYY-MM-DD
const getLocalISOString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localDate = new Date(now.getTime() - offset);
  return localDate.toISOString().split('T')[0];
};

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activityData, setActivityData] = useState<UserActivity[]>([]); 
  
  const [showSetup, setShowSetup] = useState(false);

  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryConfirm, setRecoveryConfirm] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<string|null>(null);

  const [focusedTask, setFocusedTask] = useState<Task | null>(null);

  const [toast, setToast] = useState<{ message: string; xp: number; type: 'normal' | 'critical' | 'jackpot' } | null>(null);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
      })
      .catch(err => {
        console.error("Erro ao verificar sessão inicial:", err);
      })
      .finally(() => {
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (session?.user && !isRecoveryMode) {
      fetchUserProfile();
      fetchTasks();
      fetchActivityHistory();
    }
  }, [session, isRecoveryMode]);

  const fetchUserProfile = async () => {
    if (!session?.user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
         console.error("Erro ao buscar perfil:", error.message);
         return; 
      }

      if (!data) {
        const emailPrefix = session.user.email?.split('@')[0] || 'Membro';
        const newProfile: UserProfile = {
          id: session.user.id,
          email: session.user.email!,
          username: emailPrefix,
          level: 1,
          current_xp: 0,
          xp_to_next_level: 100,
          streak_days: 0,
          bio: '',
          chronotype: null 
        };
        
        setUserProfile(newProfile);
        setShowSetup(true); 
        
        await (supabase.from('profiles') as any).upsert(newProfile);

      } else {
        setUserProfile(data);
        if (!data.chronotype) {
           setShowSetup(true);
        } else {
           setShowSetup(false);
           // Recalcular Streak ao carregar o perfil existente
           recalculateStreak(data.streak_days);
        }
      }
    } catch (e: any) {
      console.error("Exceção no fluxo de perfil:", e.message || e);
    }
  };

  const recalculateStreak = async (currentStreak: number) => {
    if (!session?.user) return;

    try {
      // Busca os últimos 2 dias de atividade
      const today = getLocalISOString();
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = yesterdayDate.toISOString().split('T')[0];

      const { data } = await supabase
        .from('user_activity')
        .select('date, count')
        .eq('user_id', session.user.id)
        .in('date', [yesterday, today]);

      const hasActivityToday = data?.some(a => a.date === today && a.count > 0);
      const hasActivityYesterday = data?.some(a => a.date === yesterday && a.count > 0);

      let newStreak = currentStreak;

      if (!hasActivityYesterday && !hasActivityToday) {
        // Se não fez nada ontem nem hoje, o streak zera
        newStreak = 0;
      } else if (hasActivityYesterday && !hasActivityToday) {
        // Se fez ontem, o streak mantém (esperando atividade de hoje)
        // Não faz nada
      }
      
      // Se o cálculo diferir do que está salvo, atualiza
      if (newStreak !== currentStreak) {
        setUserProfile(prev => prev ? { ...prev, streak_days: newStreak } : null);
        await (supabase.from('profiles') as any).update({ streak_days: newStreak }).eq('id', session.user.id);
      }
    } catch (e) {
      console.error("Erro ao recalcular streak:", e);
    }
  };

  const fetchTasks = async () => {
     if (!session?.user) return;
     
     try {
       const { data } = await supabase
         .from('tasks')
         .select('*')
         .eq('user_id', session.user.id);
       
       if (data) {
          const localToday = getLocalISOString();
          const tasksToResetIds: string[] = [];

          const processedTasks = data.map((task: Task) => {
             const isRecurring = task.type === TaskType.DAILY || task.type === TaskType.HABIT;
             
             if (isRecurring && task.is_completed) {
                const taskLastDate = task.last_completed_date ? task.last_completed_date.split('T')[0] : null;
                
                // Reseta se a data da última conclusão não for HOJE (data local)
                if (taskLastDate !== localToday) {
                    tasksToResetIds.push(task.id);
                    const basePoints = task.type === TaskType.HABIT ? 10 : 20;
                    return { ...task, is_completed: false, points: basePoints };
                }
             }
             return task;
          });

          setTasks(processedTasks);

          if (tasksToResetIds.length > 0) {
             await (supabase.from('tasks') as any)
               .update({ is_completed: false, points: 20 }) 
               .in('id', tasksToResetIds);
          }
       }
     } catch (e: any) {
       console.error("Erro ao buscar tarefas:", e.message || e);
     }
  };

  const fetchActivityHistory = async () => {
    if (!session?.user) return;
    try {
      const { data } = await supabase
        .from('user_activity')
        .select('date, count, total_xp')
        .eq('user_id', session.user.id)
        .gte('date', new Date(new Date().setDate(new Date().getDate() - 365)).toISOString());

      if (data) {
        setActivityData(data);
      }
    } catch (e) {
      console.error("Erro ao buscar histórico de atividade", e);
    }
  };

  const handleSetupComplete = async (username: string, chronotype: string) => {
    if (!userProfile) return;

    const updatedProfile = { 
        ...userProfile, 
        username, 
        chronotype: chronotype as any 
    };

    setUserProfile(updatedProfile);
    setShowSetup(false);

    try {
      const { error } = await (supabase.from('profiles') as any)
        .update({ username, chronotype })
        .eq('id', userProfile.id);
      
      if (error) throw error;
      
      setToast({ message: "Sistema Neural Calibrado", xp: 0, type: 'critical' });
      playSound('levelUp', 0.4); 
    } catch (e: any) {
      console.error("Erro fatal ao salvar setup:", e.message || e);
    }
  };

  const handleAddTask = async (taskData: Partial<Task>) => {
    if (!session?.user || !taskData.title) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      user_id: session.user.id,
      title: taskData.title,
      type: taskData.type || TaskType.TODO,
      priority: TaskPriority.MEDIUM,
      is_completed: false,
      created_at: new Date().toISOString(),
      points: taskData.type === TaskType.HABIT ? 10 : 20,
      time: taskData.time,
      repeat_days: taskData.repeat_days,
      due_date: taskData.due_date,
      energy_level: taskData.energy_level as any,
      subtasks: [] 
    };

    setTasks([newTask, ...tasks]);
    await (supabase.from('tasks') as any).insert(newTask);
    playSound('check', 0.2); 
  };

  const handleEditTask = async (updatedTask: Task) => {
    if (!session?.user) return;

    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));

    try {
      const { error } = await (supabase.from('tasks') as any)
        .update({
          title: updatedTask.title,
          type: updatedTask.type,
          time: updatedTask.time,
          repeat_days: updatedTask.repeat_days,
          due_date: updatedTask.due_date,
        })
        .eq('id', updatedTask.id);

      if (error) throw error;
      playSound('click', 0.2);
    } catch (e: any) {
      console.error("Erro ao editar tarefa:", e);
    }
  };

  const handleDecomposeTask = async (task: Task) => {
    try {
       const steps = await decomposeTask(task.title);
       if (steps.length === 0) return;

       const newSubtasks: Subtask[] = steps.map(step => ({
          id: crypto.randomUUID(),
          title: step,
          is_completed: false
       }));

       setTasks(tasks.map(t => t.id === task.id ? { ...t, subtasks: newSubtasks } : t));

       await (supabase.from('tasks') as any)
         .update({ subtasks: newSubtasks })
         .eq('id', task.id);
         
       setToast({ message: "Neuro-Decomposição Concluída!", xp: 0, type: 'critical' });
       playSound('critical', 0.4); 
    } catch (e) {
       console.error("Erro ao decompor tarefa", e);
    }
  };

  const handleToggleSubtask = async (task: Task, subtaskId: string) => {
     if (!task.subtasks) return;

     const updatedSubtasks = task.subtasks.map(sub => 
        sub.id === subtaskId ? { ...sub, is_completed: !sub.is_completed } : sub
     );

     const newStatus = !task.subtasks.find(s => s.id === subtaskId)?.is_completed;
     setTasks(tasks.map(t => t.id === task.id ? { ...t, subtasks: updatedSubtasks } : t));
     
     if (newStatus) playSound('check', 0.3); 

     await (supabase.from('tasks') as any)
        .update({ subtasks: updatedSubtasks })
        .eq('id', task.id);
  };

  const handleStartFocusSession = (task: Task) => {
     setFocusedTask(task);
     setActiveTab('focus');
  };

  const handleCompleteFocusSession = async () => {
    if (focusedTask) {
        await handleToggleTask(focusedTask);
        setFocusedTask(null); 
    }
  };

  const updateActivityLog = async (isCompleted: boolean, points: number) => {
    if (!session?.user) return;
    
    const localToday = getLocalISOString();

    // Optimistic Update for UI Heatmap
    const existingEntryIndex = activityData.findIndex(a => a.date === localToday);
    const newActivityData = [...activityData];

    let currentStreak = userProfile?.streak_days || 0;

    if (existingEntryIndex >= 0) {
      const entry = newActivityData[existingEntryIndex];
      newActivityData[existingEntryIndex] = {
        ...entry,
        count: isCompleted ? entry.count + 1 : Math.max(0, entry.count - 1),
        total_xp: isCompleted ? entry.total_xp + points : Math.max(0, entry.total_xp - points)
      };
      // Se for a primeira tarefa do dia, incrementa streak
      if (entry.count === 0 && isCompleted) {
         currentStreak += 1;
      } else if (entry.count === 1 && !isCompleted) {
         // Se removeu a única tarefa do dia, decremente (opcional, depende da regra)
         currentStreak = Math.max(0, currentStreak - 1);
      }
    } else if (isCompleted) {
      newActivityData.push({ date: localToday, count: 1, total_xp: points });
      currentStreak += 1;
    }
    setActivityData(newActivityData);

    // Atualiza streak no perfil local e banco
    if (currentStreak !== userProfile?.streak_days) {
        setUserProfile(prev => prev ? { ...prev, streak_days: currentStreak } : null);
        await (supabase.from('profiles') as any).update({ streak_days: currentStreak }).eq('id', session.user.id);
    }

    try {
      const { data: todayRow } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('date', localToday)
        .single();
        
      if (todayRow) {
         await supabase.from('user_activity').update({
            count: isCompleted ? todayRow.count + 1 : Math.max(0, todayRow.count - 1),
            total_xp: isCompleted ? todayRow.total_xp + points : Math.max(0, todayRow.total_xp - points)
         }).eq('id', todayRow.id);
      } else if (isCompleted) {
         await supabase.from('user_activity').insert({
            user_id: session.user.id,
            date: localToday,
            count: 1,
            total_xp: points
         });
      }
    } catch (e) {
      console.error("Erro ao atualizar log de atividade", e);
    }
  };

  const handleToggleTask = async (task: Task) => {
    const updatedStatus = !task.is_completed;
    
    const localToday = getLocalISOString();
    const taskLastDate = task.last_completed_date ? task.last_completed_date.split('T')[0] : null;
    
    let finalPoints = task.points; 
    let xpType: 'normal' | 'critical' | 'jackpot' = 'normal';

    if (updatedStatus) {
        // ANTI-FARM LOGIC:
        if (taskLastDate === localToday) {
            finalPoints = task.points; 
            
            const base = task.type === TaskType.HABIT ? 10 : 20;
            if (finalPoints >= base + 50) xpType = 'jackpot';
            else if (finalPoints >= base * 2) xpType = 'critical';
            else xpType = 'normal';
        } else {
            const basePoints = task.type === TaskType.HABIT ? 10 : 20;
            const rng = Math.random() * 100;
            
            if (rng >= 90) { 
                finalPoints = basePoints + 50;
                xpType = 'jackpot';
            } else if (rng >= 70) { 
                finalPoints = basePoints * 2;
                xpType = 'critical';
            } else {
                finalPoints = basePoints;
                xpType = 'normal';
            }
        }
        
        const soundType = xpType === 'normal' ? 'check' : xpType;
        playSound(soundType, xpType === 'normal' ? 0.4 : 0.6);
    }

    setTasks(tasks.map(t => t.id === task.id ? { 
        ...t, 
        is_completed: updatedStatus,
        points: finalPoints,
        last_completed_date: updatedStatus ? localToday : t.last_completed_date 
    } : t));

    updateActivityLog(updatedStatus, finalPoints);

    if (updatedStatus) {
       await (supabase.from('tasks') as any).update({ 
          is_completed: true,
          last_completed_date: localToday,
          points: finalPoints 
       }).eq('id', task.id);
    } else {
       await (supabase.from('tasks') as any).update({ 
          is_completed: false,
       }).eq('id', task.id);
    }

    if (userProfile) {
      let newLevel = userProfile.level;
      let newCurrentXp = userProfile.current_xp;
      
      let xpThreshold = newLevel * 100;

      if (updatedStatus) {
        newCurrentXp += finalPoints;
        
        while (newCurrentXp >= xpThreshold) {
          newCurrentXp = newCurrentXp - xpThreshold;
          newLevel += 1;
          xpThreshold = newLevel * 100; 
          
          setTimeout(() => playSound('levelUp', 0.7), 500); 
        }

        let message = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
        if (xpType === 'critical') message = "Sincronia Neural! Foco em dobro!";
        if (xpType === 'jackpot') message = "FLUXO PERFEITO! Recompensa máxima!";
        
        setToast({ message, xp: finalPoints, type: xpType });

      } else {
        newCurrentXp -= finalPoints;
        while (newCurrentXp < 0) {
           if (newLevel > 1) {
              newLevel -= 1;
              const prevThreshold = newLevel * 100;
              newCurrentXp = prevThreshold + newCurrentXp;
           } else {
              newCurrentXp = 0;
              break;
           }
        }
        xpThreshold = newLevel * 100; 
      }

      const updatedProfile = { 
        ...userProfile, 
        current_xp: newCurrentXp, 
        level: newLevel,
        xp_to_next_level: xpThreshold
      };
      
      setUserProfile(updatedProfile);
      
      await (supabase.from('profiles') as any).update({
        current_xp: newCurrentXp,
        level: newLevel,
        xp_to_next_level: xpThreshold
      }).eq('id', userProfile.id);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    await supabase.from('tasks').delete().eq('id', taskId);
  };

  const handleUpdateProfile = async (username: string, bio: string, chronotype?: string) => {
    if (!userProfile) return;

    const updatedProfile = { ...userProfile, username, bio, chronotype: chronotype as any };
    setUserProfile(updatedProfile);

    await (supabase.from('profiles') as any)
      .update({ username, bio, chronotype })
      .eq('id', userProfile.id);
      
    playSound('check', 0.4);
  };
  
  const handlePasswordRecoveryReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryLoading(true);
    setRecoveryMessage(null);

    if (recoveryPassword !== recoveryConfirm) {
      setRecoveryMessage('As senhas não coincidem.');
      setRecoveryLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: recoveryPassword });
      if (error) throw error;
      setRecoveryMessage('Senha redefinida com sucesso! Redirecionando...');
      setTimeout(() => {
        setIsRecoveryMode(false);
        window.location.hash = ''; 
      }, 2000);
    } catch (err: any) {
      setRecoveryMessage(err.message || 'Erro ao redefinir senha.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neuro-base">
        <img 
          src="https://i.postimg.cc/G3FxF89L/NFbasica.png" 
          alt="Loading..." 
          className="w-24 h-24 object-contain animate-pulse drop-shadow-[0_0_20px_rgba(122,43,239,0.5)]" 
        />
      </div>
    );
  }

  if (isRecoveryMode) {
    return (
      <div className="min-h-screen bg-neuro-base flex items-center justify-center p-4 relative overflow-hidden">
        <div className="max-w-md w-full bg-neuro-surface/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/5 p-8 relative z-10 animate-in fade-in zoom-in duration-300">
           <h2 className="text-2xl font-bold text-white mb-6 text-center">Definir Nova Senha</h2>
           <form onSubmit={handlePasswordRecoveryReset} className="space-y-4">
             <div>
                <label className="text-xs font-bold text-neuro-muted uppercase">Nova Senha</label>
                <input 
                  type="password" 
                  value={recoveryPassword}
                  onChange={e => setRecoveryPassword(e.target.value)}
                  className="w-full mt-1 p-3 rounded-xl bg-neuro-base border border-neuro-highlight text-white focus:border-neuro-primary outline-none"
                  required 
                  minLength={6}
                />
             </div>
             <div>
                <label className="text-xs font-bold text-neuro-muted uppercase">Confirmar Senha</label>
                <input 
                  type="password" 
                  value={recoveryConfirm}
                  onChange={e => setRecoveryConfirm(e.target.value)}
                  className="w-full mt-1 p-3 rounded-xl bg-neuro-base border border-neuro-highlight text-white focus:border-neuro-primary outline-none"
                  required 
                  minLength={6}
                />
             </div>
             <button 
               type="submit" 
               disabled={recoveryLoading}
               className="w-full py-3 bg-neuro-primary text-white rounded-xl font-bold shadow-glow hover:bg-neuro-secondary transition-all"
             >
               {recoveryLoading ? 'Salvando...' : 'Redefinir Senha'}
             </button>
             {recoveryMessage && (
               <p className={`text-center text-sm font-medium ${recoveryMessage.includes('sucesso') ? 'text-green-400' : 'text-red-400'}`}>
                 {recoveryMessage}
               </p>
             )}
           </form>
        </div>
      </div>
    );
  }

  if (!session) {
    if (!isSupabaseConfigured) {
      return (
         <div className="min-h-screen flex items-center justify-center p-8 text-center bg-stone-50 animate-in fade-in duration-700">
            <div className="max-w-lg bg-white p-8 rounded-3xl shadow-xl border border-stone-100">
              <h1 className="text-2xl font-serif font-bold text-stone-800 mb-4">Configuração Necessária</h1>
              <p className="text-stone-600 mb-6 leading-relaxed">
                Configure as chaves no services/supabaseClient.ts
              </p>
            </div>
         </div>
      )
    }
    return <Login />;
  }

  if (session && !userProfile) {
     return (
      <div className="min-h-screen flex items-center justify-center bg-neuro-base">
        <img 
          src="https://i.postimg.cc/G3FxF89L/NFbasica.png" 
          alt="Loading..." 
          className="w-24 h-24 object-contain animate-pulse drop-shadow-[0_0_20px_rgba(122,43,239,0.5)]" 
        />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard 
          tasks={tasks} 
          user={userProfile!} 
          onToggleTask={(id) => {
             const task = tasks.find(t => t.id === id);
             if (task) handleToggleTask(task);
          }} 
          onNavigate={setActiveTab}
          activityData={activityData}
          onStartFocus={handleStartFocusSession} 
        />;
      case 'routines':
        return <Routines 
          tasks={tasks} 
          user={userProfile!}
          onAddTask={handleAddTask} 
          onEditTask={handleEditTask}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          onDecomposeTask={handleDecomposeTask}
          onToggleSubtask={handleToggleSubtask}
          onStartFocus={handleStartFocusSession} 
        />;
      case 'focus':
        return <FocusMode 
          focusedTask={focusedTask}
          onCompleteTask={handleCompleteFocusSession}
        />;
      case 'insights':
        return <Insights tasks={tasks} />;
      case 'chat':
        return <NeuroChat user={userProfile!} tasks={tasks} />;
      case 'settings':
        return <Settings user={userProfile!} onUpdateProfile={handleUpdateProfile} />;
      default:
        return <Dashboard 
          tasks={tasks} 
          user={userProfile!} 
          onToggleTask={() => {}} 
          onNavigate={setActiveTab}
          activityData={activityData}
          onStartFocus={handleStartFocusSession}
        />;
    }
  };

  return (
    <>
       {showSetup && userProfile && (
          <NeuroSetup user={userProfile} onComplete={handleSetupComplete} />
       )}

       <Layout 
         activeTab={activeTab} 
         onTabChange={setActiveTab}
         userProfile={userProfile}
       >
         {renderContent()}
         
         {toast && (
           <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right fade-in duration-500 ease-out">
             <div className={`
               px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border hover:scale-105 transition-transform cursor-default
               ${toast.type === 'jackpot' 
                 ? 'bg-yellow-900/90 border-yellow-500 text-yellow-100 shadow-[0_0_30px_rgba(234,179,8,0.4)]' 
                 : toast.type === 'critical' 
                   ? 'bg-blue-900/90 border-blue-400 text-blue-100 shadow-[0_0_30px_rgba(96,165,250,0.4)]' 
                   : 'bg-neuro-surface text-white border-neuro-primary/30'}
             `}>
               <div className={`
                 p-2.5 rounded-xl shadow-lg
                 ${toast.type === 'jackpot' ? 'bg-yellow-500 text-black animate-pulse' : toast.type === 'critical' ? 'bg-blue-500 text-white' : 'bg-neuro-primary text-white'}
               `}>
                 {toast.type === 'jackpot' ? <Crown size={24} fill="currentColor" /> : toast.type === 'critical' ? <Zap size={24} fill="currentColor" /> : <Trophy size={20} fill="currentColor" />}
               </div>
               <div>
                 <p className={`font-serif font-bold text-lg leading-none mb-1 ${toast.type === 'jackpot' ? 'text-yellow-400' : toast.type === 'critical' ? 'text-blue-300' : 'text-white'}`}>
                   +{toast.xp} XP
                   {toast.type !== 'normal' && <span className="text-[10px] ml-2 uppercase tracking-wider opacity-80">{toast.type}</span>}
                 </p>
                 <p className={`text-xs font-medium ${toast.type === 'jackpot' ? 'text-yellow-200' : 'text-gray-300'}`}>{toast.message}</p>
               </div>
             </div>
           </div>
         )}
       </Layout>
    </>
  );
};

export default App;
