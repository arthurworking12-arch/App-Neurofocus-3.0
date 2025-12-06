
import React, { useState, useEffect } from 'react';
import { Task, TaskType, UserProfile, Subtask } from '../types';
import { Plus, Trash2, Check, Sparkles, Clock, Calendar, X, Zap, TrendingDown, CornerDownRight, Loader2, Pencil, Play } from 'lucide-react';

interface RoutinesProps {
  tasks: Task[];
  user: UserProfile; 
  onAddTask: (taskData: Partial<Task>) => Promise<void>;
  onEditTask: (task: Task) => Promise<void>; // Prop para editar
  onToggleTask: (task: Task) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onDecomposeTask?: (task: Task) => Promise<void>;
  onToggleSubtask?: (task: Task, subtaskId: string) => Promise<void>;
  onStartFocus?: (task: Task) => void; // Prop para Deep Focus
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

// Dados dos Cronotipos
const CHRONOTYPE_DATA: Record<string, { label: string, lowEnergyStart: number, lowEnergyEnd: number, peakTime: string, message: string }> = {
  lion: { 
    label: 'Leão (Matutino)', 
    lowEnergyStart: 18, 
    lowEnergyEnd: 24,   
    peakTime: '07:00',
    message: 'Leões funcionam com o sol. Tentar focar pesado à noite vai contra sua biologia.'
  },
  bear: { 
    label: 'Urso (Solar)', 
    lowEnergyStart: 14, 
    lowEnergyEnd: 16, 
    peakTime: '10:00',
    message: 'Ursos seguem o sol e têm o famoso "post-lunch dip".'
  },
  wolf: { 
    label: 'Lobo (Noturno)', 
    lowEnergyStart: 6, 
    lowEnergyEnd: 12, 
    peakTime: '20:00',
    message: 'Lobos demoram a "ligar" o cérebro pela manhã.'
  },
  dolphin: { 
    label: 'Golfinho', 
    lowEnergyStart: 13, 
    lowEnergyEnd: 15, 
    peakTime: '10:00',
    message: 'Golfinhos são sensíveis, a tarde pode ser dispersa.'
  }
};

const Routines: React.FC<RoutinesProps> = ({ tasks, user, onAddTask, onEditTask, onToggleTask, onDeleteTask, onDecomposeTask, onToggleSubtask, onStartFocus }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Neuro-Biorhythm State
  const [showEnergyWarning, setShowEnergyWarning] = useState(false);
  const [pendingTaskData, setPendingTaskData] = useState<Partial<Task> | null>(null);
  const [energyContext, setEnergyContext] = useState<any>(null);

  // Loading state for AI Decomposition
  const [decomposingTaskId, setDecomposingTaskId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TaskType>(TaskType.DAILY);
  const [time, setTime] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');

  // Effect to populate form when editing
  useEffect(() => {
    if (editingTask) {
        setTitle(editingTask.title);
        setType(editingTask.type);
        setTime(editingTask.time || '');
        setSelectedDays(editingTask.repeat_days || []);
        setDueDate(editingTask.due_date || '');
        setIsModalOpen(true);
    }
  }, [editingTask]);

  const resetForm = () => {
    setTitle('');
    setType(TaskType.DAILY);
    setTime('');
    setSelectedDays([]);
    setDueDate('');
    setIsModalOpen(false);
    setEditingTask(null); // Clear editing state
    setShowEnergyWarning(false);
    setPendingTaskData(null);
    setEnergyContext(null);
  };

  const handleEditClick = (e: React.MouseEvent, task: Task) => {
      e.stopPropagation();
      setEditingTask(task);
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

    // --- NEURO-BIORRITMO CHECK (Dinâmico) ---
    // Apenas checa biorritmo se estiver criando ou se mudou o horário
    if (time) {
        const userChronotype = user.chronotype || 'bear';
        const chronoData = CHRONOTYPE_DATA[userChronotype];
        
        if (chronoData) {
            const hour = parseInt(time.split(':')[0], 10);
            
            // Só avisa se o horário mudou ou é novo e cai na janela ruim
            const isTimeChanged = !editingTask || editingTask.time !== time;
            
            if (isTimeChanged && hour >= chronoData.lowEnergyStart && hour < chronoData.lowEnergyEnd) {
                setPendingTaskData(taskPayload);
                setEnergyContext(chronoData);
                setShowEnergyWarning(true);
                return; // Interrompe envio
            }
        }
    }

    if (editingTask) {
        await onEditTask({ ...editingTask, ...taskPayload });
    } else {
        await onAddTask(taskPayload);
    }
    resetForm();
  };

  const handleConfirmOptimization = async () => {
      if (pendingTaskData && energyContext) {
          const optimizedPayload = { ...pendingTaskData, time: energyContext.peakTime, energy_level: 'high' as const };
          if (editingTask) {
             await onEditTask({ ...editingTask, ...optimizedPayload });
          } else {
             await onAddTask(optimizedPayload);
          }
          resetForm();
      }
  };

  const handleConfirmOriginal = async () => {
      if (pendingTaskData) {
          const originalPayload = { ...pendingTaskData, energy_level: 'low' as const };
          if (editingTask) {
             await onEditTask({ ...editingTask, ...originalPayload });
          } else {
             await onAddTask(originalPayload);
          }
          resetForm();
      }
  };

  const handleDecomposeClick = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    if (onDecomposeTask) {
        setDecomposingTaskId(task.id);
        await onDecomposeTask(task);
        setDecomposingTaskId(null);
    }
  };

  const toggleDay = (dayId: string) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter(d => d !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

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
                className={`group rounded-xl border transition-all duration-300 overflow-hidden ${
                task.is_completed
                    ? 'bg-neuro-surface/50 border-white/5 opacity-60'
                    : 'bg-neuro-surface border-white/10 shadow-sm hover:border-neuro-primary/30'
                }`}
            >
                <div
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => onToggleTask(task)}
                >
                    <div className="flex items-center gap-4">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                            task.is_completed
                            ? 'bg-neuro-deep border-neuro-deep text-white'
                            : 'border-neuro-muted/30 hover:border-neuro-secondary text-transparent'
                        }`}>
                            <Check size={14} strokeWidth={3} />
                        </div>
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

                    <div className="flex items-center gap-2">
                        {/* DEEP FOCUS BUTTON (PLAY) */}
                        {!task.is_completed && onStartFocus && (
                           <button
                              onClick={(e) => { e.stopPropagation(); onStartFocus(task); }}
                              className="p-2 text-neuro-secondary hover:text-white hover:bg-neuro-secondary rounded-lg transition-all"
                              title="Iniciar Foco Profundo"
                           >
                              <Play size={18} fill="currentColor" />
                           </button>
                        )}

                        {/* DECOMPOSE BUTTON */}
                        {task.type === TaskType.TODO && !task.is_completed && (!task.subtasks || task.subtasks.length === 0) && (
                            <button
                                onClick={(e) => handleDecomposeClick(e, task)}
                                disabled={decomposingTaskId === task.id}
                                className={`p-2 rounded-lg transition-all flex items-center gap-2 ${
                                    decomposingTaskId === task.id 
                                    ? 'bg-neuro-highlight text-neuro-muted cursor-wait' 
                                    : 'text-neuro-secondary hover:bg-neuro-secondary/20 hover:text-white hover:scale-105'
                                }`}
                                title="Neuro-Decomposição com IA"
                            >
                                {decomposingTaskId === task.id ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} fill="currentColor" />}
                                <span className="text-[10px] font-bold hidden md:inline uppercase tracking-wide">
                                    {decomposingTaskId === task.id ? 'Analisando...' : 'Decompor'}
                                </span>
                            </button>
                        )}

                        {/* EDIT BUTTON */}
                        <button
                            onClick={(e) => handleEditClick(e, task)}
                            className="p-2 text-neuro-muted hover:text-white hover:bg-neuro-highlight rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            title="Editar"
                        >
                            <Pencil size={18} />
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                            className="p-2 text-neuro-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            title="Excluir"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>

                {/* SUBTASKS LIST */}
                {task.subtasks && task.subtasks.length > 0 && (
                    <div className="bg-black/20 border-t border-white/5 px-4 py-3 space-y-2 animate-in slide-in-from-top-2">
                        <p className="text-[10px] text-neuro-muted uppercase tracking-widest pl-9 mb-2 flex items-center gap-1">
                            <CornerDownRight size={12} />
                            Micro-passos
                        </p>
                        {task.subtasks.map(sub => (
                            <div 
                                key={sub.id} 
                                className="flex items-center gap-3 pl-8 hover:bg-white/5 p-1 rounded-lg cursor-pointer transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if(onToggleSubtask) onToggleSubtask(task, sub.id);
                                }}
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                    sub.is_completed 
                                    ? 'bg-neuro-secondary border-neuro-secondary' 
                                    : 'border-neuro-muted/50'
                                }`}>
                                    {sub.is_completed && <Check size={10} className="text-neuro-base" strokeWidth={4} />}
                                </div>
                                <span className={`text-sm ${sub.is_completed ? 'text-neuro-muted line-through' : 'text-gray-300'}`}>
                                    {sub.title}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          ))
        )}
      </div>

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-neuro-surface rounded-3xl shadow-2xl shadow-neuro-base border border-white/10 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 relative">
              
              {/* --- NEURO-BIORRITMO ALERT OVERLAY --- */}
              {showEnergyWarning && energyContext && (
                <div className="absolute inset-0 z-50 bg-neuro-surface p-6 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-10 text-center">
                    <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
                        <TrendingDown size={32} />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-white mb-2">Alerta de Cronotipo</h3>
                    <p className="text-neuro-primary font-bold text-sm mb-2 uppercase tracking-widest">{energyContext.label}</p>
                    <p className="text-neuro-muted text-sm mb-8 px-4 leading-relaxed">
                        Detectamos que você está agendando uma tarefa durante seu vale biológico natural ({energyContext.lowEnergyStart}h - {energyContext.lowEnergyEnd}h).
                        <br/><br/>
                        {energyContext.message}
                    </p>

                    <div className="w-full space-y-3">
                        <button 
                            onClick={handleConfirmOptimization}
                            className="w-full bg-neuro-primary hover:bg-neuro-secondary text-white py-4 rounded-xl font-medium shadow-glow flex items-center justify-center gap-2 transition-all active:scale-95 border border-neuro-secondary/20"
                        >
                            <Zap size={18} fill="currentColor" />
                            Otimizar para {energyContext.peakTime}
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
                 <h3 className="text-xl font-serif font-bold text-white">
                    {editingTask ? 'Editar Atividade' : 'Nova Atividade'}
                 </h3>
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
                        Dica: O NeuroFocus analisará seu cronotipo ({CHRONOTYPE_DATA[user.chronotype || 'bear'].label}).
                    </p>
                 </div>

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
                    {editingTask ? 'Salvar Alterações' : 'Confirmar'}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Routines;
