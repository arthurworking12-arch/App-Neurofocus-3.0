import React, { useState } from 'react';
import { Task, TaskType } from '../types';
import { Plus, Trash2, Check, Sparkles, Clock, Calendar, X, Zap, AlertTriangle, TrendingDown, ArrowRight } from 'lucide-react';

interface RoutinesProps {
  tasks: Task[];
  onAddTask: (taskData: Partial<Task>) => Promise<void>;
  onToggleTask: (task: Task) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

const DAYS_OF_WEEK = [
  { id: 'seg', label: 'S' },
  { id: 'ter', label: 'T' },
  { id: 'qua', label: 'Q' },
  { id: 'qui', label: 'Q' },
  { id: 'sex', label: 'S' },
  { id: 'sab', label: 'S' },
  { id: 'dom', label: 'D' },
];

const Routines: React.FC<RoutinesProps> = ({ tasks, onAddTask, onToggleTask, onDeleteTask }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Neuro-Biorhythm State
  const [showEnergyWarning, setShowEnergyWarning] = useState(false);
  const [pendingTaskData, setPendingTaskData] = useState<Partial<Task> | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TaskType>(TaskType.DAILY);
  const [time, setTime] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');

  const resetForm = () => {
    setTitle('');
    setType(TaskType.DAILY);
    setTime('');
    setSelectedDays([]);
    setDueDate('');
    setIsModalOpen(false);
    setShowEnergyWarning(false);
    setPendingTaskData(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskPayload = {
      title,
      type,
      time: time || undefined,
      repeat_days: type !== TaskType.TODO ? selectedDays : undefined,
      due_date: type === TaskType.TODO ? dueDate : undefined
    };

    // --- NEURO-BIORRITMO CHECK ---
    // Se tiver horário definido, verifica se cai na "Janela de Baixa Energia" (13h - 15h)
    if (time) {
        const hour = parseInt(time.split(':')[0], 10);
        if (hour >= 13 && hour < 15) {
            setPendingTaskData(taskPayload);
            setShowEnergyWarning(true);
            return; // Interrompe o envio
        }
    }

    // Se estiver tudo ok, cria direto
    await onAddTask(taskPayload);
    resetForm();
  };

  const handleConfirmOptimization = async () => {
      if (pendingTaskData) {
          // Muda para 16:00 (Horário de Pico simulado)
          await onAddTask({ ...pendingTaskData, time: '16:00', energy_level: 'high' });
          resetForm();
      }
  };

  const handleConfirmOriginal = async () => {
      if (pendingTaskData) {
          // Mantém horário original mas marca como baixa energia
          await onAddTask({ ...pendingTaskData, energy_level: 'low' });
          resetForm();
      }
  };

  const toggleDay = (dayId: string) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter(d => d !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  // Sort tasks: Time (if exists) -> Incomplete first
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
    if (a.time && b.time) return a.time.localeCompare(b.time);
    return 0;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white mb-2">Minhas Rotinas</h2>
          <p className="text-neuro-muted">Construa hábitos sólidos, um dia de cada vez.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-neuro-primary hover:bg-neuro-secondary text-white px-4 py-3 rounded-xl shadow-glow flex items-center gap-2 transition-all active:scale-95 border border-neuro-secondary/20"
        >
          <Plus size={20} />
          <span className="font-medium hidden md:inline">Nova Rotina</span>
        </button>
      </header>

      {/* Task List */}
      <div className="grid gap-3">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-12 text-neuro-muted bg-neuro-surface/30 rounded-2xl border border-white/5 border-dashed">
            <Sparkles className="mx-auto mb-3 opacity-50 text-neuro-secondary" />
            <p>Nenhuma rotina definida ainda.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="mt-4 text-neuro-secondary font-medium hover:underline hover:text-white transition-colors"
            >
              Criar a primeira
            </button>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <div
              key={task.id}
              className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                task.is_completed
                  ? 'bg-neuro-surface/50 border-white/5 opacity-60'
                  : 'bg-neuro-surface border-white/10 shadow-sm hover:border-neuro-primary/30 hover:shadow-glow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onToggleTask(task)}
                  className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                    task.is_completed
                      ? 'bg-neuro-deep border-neuro-deep text-white'
                      : 'border-neuro-muted/30 hover:border-neuro-secondary text-transparent'
                  }`}
                >
                  <Check size={14} strokeWidth={3} />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-medium transition-all ${
                      task.is_completed ? 'text-neuro-muted line-through decoration-neuro-muted/50' : 'text-white'
                    }`}>
                      {task.title}
                    </h3>
                    {task.time && (
                      <span className="flex items-center gap-1 text-xs text-neuro-muted bg-neuro-base px-2 py-0.5 rounded-md font-mono border border-white/5">
                         <Clock size={10} />
                         {task.time}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-1 items-center">
                     <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        task.type === TaskType.HABIT ? 'bg-purple-900/30 text-purple-300' :
                        task.type === TaskType.DAILY ? 'bg-blue-900/30 text-blue-300' :
                        'bg-orange-900/30 text-orange-300'
                     }`}>
                        {task.type === TaskType.HABIT ? 'Hábito' : task.type === TaskType.DAILY ? 'Rotina' : 'Tarefa'}
                     </span>
                     
                     {task.repeat_days && task.repeat_days.length > 0 && (
                        <div className="flex gap-0.5">
                           {DAYS_OF_WEEK.map(d => (
                              <span key={d.id} className={`text-[9px] w-3 h-3 flex items-center justify-center rounded-full ${
                                 task.repeat_days?.includes(d.id) ? 'bg-neuro-primary text-white font-bold' : 'text-neuro-muted/30'
                              }`}>
                                {d.label}
                              </span>
                           ))}
                        </div>
                     )}

                     {task.due_date && (
                        <span className="text-[10px] text-neuro-muted flex items-center gap-1">
                           <Calendar size={10} />
                           {new Date(task.due_date).toLocaleDateString('pt-BR')}
                        </span>
                     )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onDeleteTask(task.id)}
                className="p-2 text-neuro-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-neuro-surface rounded-3xl shadow-2xl shadow-neuro-base border border-white/10 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 relative">
              
              {/* --- NEURO-BIORRITMO ALERT OVERLAY --- */}
              {showEnergyWarning && (
                <div className="absolute inset-0 z-50 bg-neuro-surface p-6 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-10">
                    <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
                        <TrendingDown size={32} />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-white text-center mb-2">Queda de Energia Prevista</h3>
                    <p className="text-neuro-muted text-center text-sm mb-8 px-4">
                        Seu ciclo circadiano natural tende a baixar entre <strong>13h e 15h</strong>. 
                        Tarefas cognitivas complexas podem custar 2x mais esforço mental agora.
                    </p>

                    {/* Chart Visualization */}
                    <div className="w-full flex items-end justify-center gap-2 h-24 mb-8 px-8">
                        <div className="w-8 h-full bg-white/5 rounded-t-lg relative group">
                            <div className="absolute bottom-0 w-full h-[80%] bg-neuro-secondary/50 rounded-t-lg"></div>
                            <span className="absolute -bottom-6 text-[10px] text-neuro-muted left-1">10h</span>
                        </div>
                        <div className="w-8 h-full bg-white/5 rounded-t-lg relative">
                             <div className="absolute bottom-0 w-full h-[40%] bg-orange-500/80 rounded-t-lg animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
                             <span className="absolute -bottom-6 text-[10px] text-orange-500 font-bold left-1">14h</span>
                        </div>
                        <div className="w-8 h-full bg-white/5 rounded-t-lg relative">
                             <div className="absolute bottom-0 w-full h-[90%] bg-neuro-primary rounded-t-lg shadow-glow"></div>
                             <span className="absolute -bottom-6 text-[10px] text-neuro-secondary font-bold left-1">16h</span>
                        </div>
                    </div>

                    <div className="w-full space-y-3">
                        <button 
                            onClick={handleConfirmOptimization}
                            className="w-full bg-neuro-primary hover:bg-neuro-secondary text-white py-4 rounded-xl font-medium shadow-glow flex items-center justify-center gap-2 transition-all active:scale-95 border border-neuro-secondary/20"
                        >
                            <Zap size={18} fill="currentColor" />
                            Otimizar para 16:00
                        </button>
                        <button 
                            onClick={handleConfirmOriginal}
                            className="w-full bg-transparent border border-white/20 text-neuro-muted hover:bg-white/5 hover:text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            Manter às {pendingTaskData?.time}
                        </button>
                    </div>
                </div>
              )}

              <div className="flex justify-between items-center p-6 border-b border-white/5">
                 <h3 className="text-xl font-serif font-bold text-white">Nova Atividade</h3>
                 <button onClick={resetForm} className="text-neuro-muted hover:text-white transition-colors">
                    <X size={24} />
                 </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                 {/* Title */}
                 <div>
                    <label className="block text-xs font-bold text-neuro-muted uppercase tracking-wider mb-2">O que você vai fazer?</label>
                    <input
                      autoFocus
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Meditar, Ler 10 páginas..."
                      className="w-full px-4 py-3 bg-neuro-base border border-neuro-highlight rounded-xl focus:outline-none focus:ring-2 focus:ring-neuro-primary/50 focus:border-neuro-primary text-white placeholder:text-gray-700"
                    />
                 </div>

                 {/* Type Selection */}
                 <div>
                    <label className="block text-xs font-bold text-neuro-muted uppercase tracking-wider mb-2">Tipo de Atividade</label>
                    <div className="grid grid-cols-3 gap-2">
                       {[
                         { id: TaskType.DAILY, label: 'Rotina' },
                         { id: TaskType.HABIT, label: 'Hábito' },
                         { id: TaskType.TODO, label: 'Tarefa' }
                       ].map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setType(t.id)}
                            className={`py-2 rounded-xl text-sm font-medium transition-all border ${
                               type === t.id 
                               ? 'bg-neuro-primary text-white shadow-glow border-neuro-secondary/50' 
                               : 'bg-neuro-base text-neuro-muted border-white/5 hover:bg-white/5'
                            }`}
                          >
                             {t.label}
                          </button>
                       ))}
                    </div>
                 </div>

                 {/* Time Picker */}
                 <div>
                    <label className="block text-xs font-bold text-neuro-muted uppercase tracking-wider mb-2">Horário (Opcional)</label>
                    <input 
                       type="time" 
                       value={time}
                       onChange={(e) => setTime(e.target.value)}
                       className="w-full px-4 py-3 bg-neuro-base border border-neuro-highlight rounded-xl focus:outline-none focus:border-neuro-primary text-white"
                       style={{ colorScheme: 'dark' }}
                    />
                    <p className="text-[10px] text-neuro-muted mt-1 ml-1 flex items-center gap-1 opacity-70">
                        <Sparkles size={10} />
                        Dica: Evite tarefas pesadas entre 13h e 15h.
                    </p>
                 </div>

                 {/* Conditional: Days (Habit/Daily) OR Date (Todo) */}
                 {type === TaskType.TODO ? (
                    <div>
                        <label className="block text-xs font-bold text-neuro-muted uppercase tracking-wider mb-2">Data (Opcional)</label>
                        <input 
                           type="date"
                           value={dueDate}
                           onChange={(e) => setDueDate(e.target.value)}
                           className="w-full px-4 py-3 bg-neuro-base border border-neuro-highlight rounded-xl focus:outline-none focus:border-neuro-primary text-white"
                           style={{ colorScheme: 'dark' }}
                        />
                    </div>
                 ) : (
                    <div>
                       <label className="block text-xs font-bold text-neuro-muted uppercase tracking-wider mb-2">Repetir nos dias</label>
                       <div className="flex justify-between gap-1">
                          {DAYS_OF_WEEK.map((day) => (
                             <button
                                key={day.id}
                                type="button"
                                onClick={() => toggleDay(day.id)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                   selectedDays.includes(day.id)
                                   ? 'bg-neuro-primary text-white border-2 border-neuro-secondary'
                                   : 'bg-neuro-base text-neuro-muted border border-white/5 hover:bg-white/5'
                                }`}
                             >
                                {day.label}
                             </button>
                          ))}
                       </div>
                    </div>
                 )}

                 <button
                    type="submit"
                    disabled={!title.trim()}
                    className="w-full mt-4 bg-neuro-primary hover:bg-neuro-secondary text-white py-4 rounded-xl font-medium shadow-glow flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-neuro-secondary/20"
                 >
                    <Check size={18} />
                    Confirmar
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Routines;