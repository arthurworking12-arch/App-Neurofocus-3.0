import React, { useEffect, useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Routines from './pages/Routines';
import FocusMode from './pages/FocusMode';
import Insights from './pages/Insights';
import NeuroChat from './pages/NeuroChat';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { UserProfile, Task, TaskType, TaskPriority } from './types';
import { Session } from '@supabase/supabase-js';
import { Trophy } from 'lucide-react';

// Frases baseadas em neurociência e estoicismo
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
  
  // Data State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  // UI State
  const [toast, setToast] = useState<{ message: string; xp: number } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Timer para remover o toast automaticamente
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch Data when session is active
  useEffect(() => {
    if (session?.user) {
      fetchUserProfile();
      fetchTasks();
    }
  }, [session]);

  const fetchUserProfile = async () => {
    if (!session?.user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error || !data) {
      // Create default profile
      const newProfile: UserProfile = {
        id: session.user.id,
        email: session.user.email!,
        username: session.user.email?.split('@')[0],
        level: 1,
        current_xp: 0,
        xp_to_next_level: 100,
        streak_days: 0,
        bio: ''
      };
      
      setUserProfile(newProfile);
      
      // PERSISTENCE FIX: Save immediately to DB so it doesn't vanish on reload
      await (supabase.from('profiles') as any).upsert(newProfile);
    } else {
      setUserProfile(data);
    }
  };

  const fetchTasks = async () => {
     if (!session?.user) return;
     
     const { data } = await supabase
       .from('tasks')
       .select('*')
       .eq('user_id', session.user.id);
     
     if (data) {
        // --- LOGICA DE VIRADA DO DIA (RESET AUTOMÁTICO) ---
        const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
        const tasksToResetIds: string[] = [];

        const processedTasks = data.map((task: Task) => {
           // Verifica se é Rotina ou Hábito (Tarefas únicas "TODO" não resetam)
           const isRecurring = task.type === TaskType.DAILY || task.type === TaskType.HABIT;
           
           if (isRecurring && task.is_completed) {
              // Pega a data salva (removendo hora se houver, ex: 2025-12-01 10:00 -> 2025-12-01)
              const taskDate = task.last_completed_date ? task.last_completed_date.split(' ')[0].split('T')[0] : null;
              
              // Se a data for diferente de hoje (ou nula), reseta
              if (taskDate !== today) {
                  tasksToResetIds.push(task.id);
                  return { ...task, is_completed: false }; // Atualiza estado local
              }
           }
           return task;
        });

        setTasks(processedTasks);

        // Se houver tarefas para resetar, atualiza no banco em lote
        if (tasksToResetIds.length > 0) {
           console.log("Resetando tarefas antigas:", tasksToResetIds);
           await (supabase.from('tasks') as any)
             .update({ is_completed: false })
             .in('id', tasksToResetIds);
        }
     }
  };

  // Actions
  const handleAddTask = async (taskData: Partial<Task>) => {
    if (!session?.user || !taskData.title) return;

    const newTask: Task = {
      id: crypto.randomUUID(), // Optimistic UI
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
      energy_level: taskData.energy_level as any // Add energy level
    };

    setTasks([newTask, ...tasks]);

    // Persist
    await (supabase.from('tasks') as any).insert(newTask);
  };

  const handleToggleTask = async (task: Task) => {
    const updatedStatus = !task.is_completed;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Optimistic Update
    setTasks(tasks.map(t => t.id === task.id ? { ...t, is_completed: updatedStatus } : t));

    if (updatedStatus) {
       // --- MARCAR COMO FEITA ---
       // Salva status E a data de hoje para controle de reset
       await (supabase.from('tasks') as any).update({ 
          is_completed: true,
          last_completed_date: today 
       }).eq('id', task.id);
    } else {
       // --- DESMARCAR ---
       await (supabase.from('tasks') as any).update({ 
          is_completed: false
          // Não limpamos a data necessariamente, ou poderíamos limpar. Manter ajuda no histórico.
       }).eq('id', task.id);
    }

    // Gamification Logic (Anti-farming implemented)
    if (userProfile) {
      const points = task.points;
      let newLevel = userProfile.level;
      let newCurrentXp = userProfile.current_xp;
      const xpThreshold = userProfile.xp_to_next_level;

      if (updatedStatus) {
        // --- GAIN XP ---
        newCurrentXp += points;
        
        // Level Up Logic
        if (newCurrentXp >= xpThreshold) {
          newLevel += 1;
          newCurrentXp = newCurrentXp - xpThreshold;
        }

        // Trigger Toast only on completion
        const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
        setToast({ message: randomQuote, xp: points });

      } else {
        // --- REMOVE XP (Anti-farming) ---
        newCurrentXp -= points;

        // Level Down Logic (if XP goes negative)
        if (newCurrentXp < 0) {
          if (newLevel > 1) {
            newLevel -= 1;
            // Add previous level's threshold to the negative balance
            newCurrentXp = xpThreshold + newCurrentXp; 
          } else {
            // Cap at 0 for level 1
            newCurrentXp = 0;
          }
        }
      }

      const updatedProfile = { 
        ...userProfile, 
        current_xp: newCurrentXp, 
        level: newLevel 
      };
      
      setUserProfile(updatedProfile);
      
      // Update Profile in DB
      await (supabase.from('profiles') as any).update({
        current_xp: newCurrentXp,
        level: newLevel
      }).eq('id', userProfile.id);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    await supabase.from('tasks').delete().eq('id', taskId);
  };

  const handleUpdateProfile = async (username: string, bio: string) => {
    if (!userProfile) return;

    const updatedProfile = { ...userProfile, username, bio };
    setUserProfile(updatedProfile);

    // Use Upsert to be safe
    await (supabase
      .from('profiles') as any)
      .upsert(updatedProfile);
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

  if (!session) {
    if (!isSupabaseConfigured) {
      return (
         <div className="min-h-screen flex items-center justify-center p-8 text-center bg-stone-50 animate-in fade-in duration-700">
            <div className="max-w-lg bg-white p-8 rounded-3xl shadow-xl border border-stone-100">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
              <h1 className="text-2xl font-serif font-bold text-stone-800 mb-4">Configuração Necessária</h1>
              <p className="text-stone-600 mb-6 leading-relaxed">
                Para iniciar o <strong>NeuroFocus</strong>, você precisa conectar seu banco de dados.
                <br/><br/>
                Abra o arquivo <code>services/supabaseClient.ts</code> e insira suas chaves do Supabase.
              </p>
            </div>
         </div>
      )
    }
    return <Login />;
  }

  // Prevent rendering main app until profile is loaded to avoid null pointer
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
        />;
      case 'routines':
        return <Routines 
          tasks={tasks} 
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
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      userProfile={userProfile}
    >
      {renderContent()}
      
      {/* Neuro-Recompensa Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right fade-in duration-500 ease-out">
          <div className="bg-stone-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-stone-700 hover:scale-105 transition-transform cursor-default">
            <div className="bg-neuro-500 p-2.5 rounded-xl text-white shadow-lg shadow-neuro-500/20">
              <Trophy size={20} fill="currentColor" />
            </div>
            <div>
              <p className="font-serif font-bold text-lg leading-none mb-1">+{toast.xp} XP</p>
              <p className="text-neuro-100 text-xs font-medium">{toast.message}</p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;