
import React, { useEffect, useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Routines from './pages/Routines';
import FocusMode from './pages/FocusMode';
import Insights from './pages/Insights';
import NeuroChat from './pages/NeuroChat';
import Settings from './pages/Settings';
import Login from './pages/Login';
import NeuroSetup from './components/NeuroSetup'; // Import New Component
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { UserProfile, Task, TaskType, TaskPriority } from './types';
import { Session } from '@supabase/supabase-js';
import { Trophy, Zap, Crown, Star } from 'lucide-react';

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

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // State for Onboarding
  const [showSetup, setShowSetup] = useState(false);

  // States for Auth/Recovery
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryConfirm, setRecoveryConfirm] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<string|null>(null);

  // Toast agora suporta tipos diferentes para feedbacks visuais
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

      if (error || !data) {
        // Create Default Profile
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
          chronotype: 'bear'
        };
        
        setUserProfile(newProfile);
        setShowSetup(true); // New User -> Trigger Setup
        
        await (supabase.from('profiles') as any).upsert(newProfile);
      } else {
        setUserProfile(data);
        
        // Check if user is "unconfigured" (Name matches email prefix)
        // This forces existing users who haven't set up to see the screen too
        const emailPrefix = data.email.split('@')[0];
        if (data.username === emailPrefix) {
           setShowSetup(true);
        }
      }
    } catch (e) {
      console.error("Erro no fluxo de perfil:", e);
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
          const today = new Date().toISOString().split('T')[0];
          const tasksToResetIds: string[] = [];

          const processedTasks = data.map((task: Task) => {
             const isRecurring = task.type === TaskType.DAILY || task.type === TaskType.HABIT;
             
             if (isRecurring && task.is_completed) {
                const taskDate = task.last_completed_date ? task.last_completed_date.split(' ')[0].split('T')[0] : null;
                
                if (taskDate !== today) {
                    tasksToResetIds.push(task.id);
                    // Reseta os pontos para o base APENAS quando vira o dia
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
     } catch (e) {
       console.error("Erro ao buscar tarefas:", e);
     }
  };

  const handleSetupComplete = async (username: string, chronotype: string) => {
    if (!userProfile) return;

    const updatedProfile = { ...userProfile, username, chronotype: chronotype as any };
    setUserProfile(updatedProfile);
    setShowSetup(false);

    try {
      await (supabase.from('profiles') as any).upsert(updatedProfile);
      setToast({ message: "Sistema Neural Calibrado", xp: 0, type: 'critical' });
    } catch (e) {
      console.error("Erro ao salvar setup:", e);
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
      energy_level: taskData.energy_level as any
    };

    setTasks([newTask, ...tasks]);
    await (supabase.from('tasks') as any).insert(newTask);
  };

  const handleToggleTask = async (task: Task) => {
    const updatedStatus = !task.is_completed;
    const today = new Date().toISOString().split('T')[0];
    const taskLastDate = task.last_completed_date ? task.last_completed_date.split('T')[0] : null;
    
    let finalPoints = task.points; 
    let xpType: 'normal' | 'critical' | 'jackpot' = 'normal';

    if (updatedStatus) {
        if (taskLastDate === today) {
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
    }

    setTasks(tasks.map(t => t.id === task.id ? { 
        ...t, 
        is_completed: updatedStatus,
        points: finalPoints,
        last_completed_date: updatedStatus ? today : t.last_completed_date 
    } : t));

    if (updatedStatus) {
       await (supabase.from('tasks') as any).update({ 
          is_completed: true,
          last_completed_date: today,
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

    await (supabase
      .from('profiles') as any)
      .upsert(updatedProfile);
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

  // RECOVERY MODE SCREEN
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

  // LOGIN SCREEN
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

  // LOADING PROFILE
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

  // MAIN APP + ONBOARDING CHECK
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
        />;
      case 'routines':
        return <Routines 
          tasks={tasks} 
          user={userProfile!}
          onAddTask={handleAddTask} 
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
        />;
      case 'focus':
        return <FocusMode />;
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
        />;
    }
  };

  return (
    <>
       {/* SHOW SETUP IF NEW USER */}
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
