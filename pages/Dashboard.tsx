
import React, { useMemo, useState, useEffect } from 'react';
import { Task, UserProfile, TaskType, UserActivity } from '../types';
import { CheckCircle2, Flame, ArrowRight, Zap, Target, Play } from 'lucide-react';
import ActivityHeatmap from '../components/ActivityHeatmap';

interface DashboardProps {
  tasks: Task[];
  user: UserProfile;
  onToggleTask: (taskId: string) => void;
  onNavigate: (tab: string) => void;
  activityData?: UserActivity[];
  onStartFocus?: (task: Task) => void; // Prop for deep focus
}

const Dashboard: React.FC<DashboardProps> = ({ tasks, user, onToggleTask, onNavigate, activityData, onStartFocus }) => {
  // Estado local para a data e hora em tempo real
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const updateTime = () => setCurrentDate(new Date());
    
    // Atualiza a cada 60 segundos
    const interval = setInterval(updateTime, 60000);
    
    // Atualiza imediatamente ao focar na janela (se o usuário voltar de outra aba)
    const handleFocus = () => updateTime();
    window.addEventListener('focus', handleFocus);

    return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const dailyTasks = useMemo(() => 
    tasks.filter(t => t.type === TaskType.DAILY || t.type === TaskType.HABIT).slice(0, 5), 
  [tasks]);

  const completedToday = useMemo(() => 
    tasks.filter(t => t.is_completed).length, 
  [tasks]);

  const progress = dailyTasks.length > 0 
    ? Math.round((dailyTasks.filter(t => t.is_completed).length / dailyTasks.length) * 100) 
    : 0;

  const getGreeting = () => {
    const hour = currentDate.getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-neuro-primary animate-pulse shadow-glow"></div>
             <p className="text-neuro-muted text-sm font-medium uppercase tracking-widest">
                {currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
             </p>
          </div>
          <h2 className="text-3xl md:text-5xl font-sans font-bold text-white tracking-tight">
            {getGreeting()}, <span className="text-neuro-primary">{user.username || 'Membro'}.</span>
          </h2>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-neuro-surface px-5 py-4 rounded-2xl shadow-sm border border-white/5 flex items-center gap-4 hover:border-neuro-primary/30 transition-colors">
            <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-xl">
              <Flame size={20} fill="currentColor" />
            </div>
            <div>
              <p className="text-[10px] text-neuro-muted uppercase font-bold tracking-wider">Sequência</p>
              <p className="text-xl font-bold text-white leading-none">{user.streak_days} <span className="text-sm text-neuro-muted font-medium">dias</span></p>
            </div>
          </div>
          <div className="bg-neuro-surface px-5 py-4 rounded-2xl shadow-sm border border-white/5 flex items-center gap-4 hover:border-neuro-primary/30 transition-colors">
            <div className="p-2.5 bg-neuro-primary/10 text-neuro-primary rounded-xl">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-[10px] text-neuro-muted uppercase font-bold tracking-wider">Concluídas</p>
              <p className="text-xl font-bold text-white leading-none">{completedToday} <span className="text-sm text-neuro-muted font-medium">hoje</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Card - Custom Purple Gradient */}
      <div className="bg-neuro-gradient text-white p-8 md:p-10 rounded-3xl shadow-glow relative overflow-hidden group border border-neuro-secondary/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/15 transition-all duration-700"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/30 rounded-full -ml-20 -mb-20 blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="max-w-lg">
            <h3 className="text-2xl md:text-3xl font-sans font-bold mb-2 text-white">Progresso Neural</h3>
            <p className="text-white/80 font-medium leading-relaxed">
              Você completou <strong className="text-white font-bold text-shadow-glow">{progress}%</strong> das suas prioridades. 
              {progress === 100 ? ' Sistema otimizado. Aproveite o descanso.' : ' Mantenha o foco, objetivo próximo.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
              <span className="text-5xl md:text-6xl font-black tracking-tighter text-white drop-shadow-md">{progress}</span>
              <span className="text-xl md:text-2xl font-medium text-neuro-secondary">%</span>
          </div>
        </div>
        
        <div className="w-full bg-black/30 h-3 rounded-full overflow-hidden mt-8 backdrop-blur-sm border border-white/5">
          <div 
            className="bg-white h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.8)]" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* HEATMAP SECTION */}
      {activityData && activityData.length > 0 && (
         <ActivityHeatmap activityData={activityData} />
      )}

      {/* Task List Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neuro-surface p-6 rounded-3xl border border-white/5 shadow-sm hover:border-neuro-primary/20 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Target className="text-neuro-primary" size={20} />
                Foco Principal
            </h3>
            <button className="p-2 hover:bg-neuro-highlight rounded-full transition-colors" onClick={() => onNavigate('routines')}>
              <ArrowRight size={20} className="text-neuro-muted hover:text-neuro-secondary" />
            </button>
          </div>
          
          <div className="space-y-3">
            {dailyTasks.length === 0 ? (
              <div className="text-center py-12 text-neuro-muted text-sm border-2 border-dashed border-neuro-highlight rounded-2xl">
                <p>Nenhuma tarefa prioritária.</p>
              </div>
            ) : (
              dailyTasks.map(task => (
                <div 
                  key={task.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-neuro-base/50 border border-transparent hover:border-neuro-primary/30 hover:shadow-glow-sm transition-all duration-200 group cursor-pointer"
                  onClick={() => onToggleTask(task.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                        w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300
                        ${task.is_completed ? 'bg-neuro-primary border-neuro-primary shadow-glow' : 'border-neuro-muted/30 group-hover:border-neuro-secondary'}
                    `}>
                        {task.is_completed && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                    <span className={`text-sm font-medium transition-colors ${task.is_completed ? 'text-neuro-muted line-through decoration-neuro-muted/50' : 'text-gray-200'}`}>
                        {task.title}
                    </span>
                  </div>

                  {/* DEEP FOCUS PLAY BUTTON */}
                  {!task.is_completed && onStartFocus && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onStartFocus(task); }}
                        className="p-2 text-neuro-secondary hover:text-white hover:bg-neuro-secondary rounded-full opacity-0 group-hover:opacity-100 transition-all"
                        title="Iniciar Foco"
                    >
                        <Play size={16} fill="currentColor" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div 
           onClick={() => onNavigate('focus')}
           className="bg-neuro-surface border border-neuro-primary/20 text-white p-8 rounded-3xl shadow-lg flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:shadow-glow transition-all duration-300"
        >
           <div className="relative z-10">
              <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                 <Zap size={20} className="text-neuro-secondary" fill="currentColor" />
                 NeuroTimer
              </h3>
              <p className="text-neuro-muted text-sm mb-8 leading-relaxed">
                 Inicie uma sessão de foco profundo. Ondas Theta e intervalos estratégicos.
              </p>
           </div>
           
           <div className="relative z-10 flex items-center justify-between group-hover:translate-x-1 transition-transform duration-300">
               <span className="text-3xl font-bold text-white">25:00</span>
               <div className="w-10 h-10 bg-neuro-primary rounded-full flex items-center justify-center shadow-glow">
                   <ArrowRight size={20} />
               </div>
           </div>

           {/* Decorative */}
           <div className="absolute top-0 right-0 w-48 h-48 bg-neuro-primary/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-neuro-primary/20 transition-colors"></div>
           <div className="absolute bottom-0 left-0 w-32 h-32 bg-neuro-deep/20 rounded-full blur-2xl -ml-10 -mb-10"></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
