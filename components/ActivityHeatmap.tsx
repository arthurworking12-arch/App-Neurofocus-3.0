
import React from 'react';
import { UserActivity } from '../types';

interface ActivityHeatmapProps {
  activityData: UserActivity[];
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ activityData }) => {
  // Gera datas garantindo que o início seja um Domingo para alinhar com o CSS Grid
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    
    // Queremos mostrar aproximadamente 5 a 6 meses (24 semanas)
    const weeksToShow = 24; 
    
    // Calcula a data de início (hoje - X semanas)
    const startDate = new Date();
    startDate.setDate(today.getDate() - (weeksToShow * 7));

    // CORREÇÃO CRÍTICA:
    // Volta para o Domingo imediatamente anterior à data de início.
    // Isso garante que o índice 0 do array seja Domingo, alinhando com grid-rows-7.
    const dayOfWeek = startDate.getDay(); // 0 = Domingo, 1 = Segunda...
    startDate.setDate(startDate.getDate() - dayOfWeek);

    // Gera as datas do domingo inicial até hoje
    const currentDate = new Date(startDate);
    // Adicionamos um buffer para garantir que preencha até o fim
    while (currentDate <= today) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  const dates = generateDates();

  const getActivityLevel = (dateStr: string) => {
    const activity = activityData.find(a => a.date === dateStr);
    const count = activity?.count || 0;

    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 4) return 2;
    if (count <= 6) return 3;
    return 4;
  };

  const getColorClass = (level: number) => {
    switch (level) {
      case 0: return 'bg-white/5 border-transparent';
      case 1: return 'bg-neuro-primary/30 border-neuro-primary/20';
      case 2: return 'bg-neuro-primary/60 border-neuro-primary/40 shadow-glow-text';
      case 3: return 'bg-neuro-primary border-neuro-highlight shadow-glow-sm';
      case 4: return 'bg-neuro-secondary border-white/20 shadow-glow animate-pulse-slow';
      default: return 'bg-white/5';
    }
  };

  const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <div className="bg-neuro-surface border border-white/5 rounded-3xl p-6 md:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white font-serif">Mapa de Sinapses</h3>
          <p className="text-xs text-neuro-muted">Visualização da sua consistência diária.</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-neuro-muted">
          <span>Menos</span>
          <div className="flex gap-1">
             <div className="w-3 h-3 rounded-sm bg-white/5"></div>
             <div className="w-3 h-3 rounded-sm bg-neuro-primary/30"></div>
             <div className="w-3 h-3 rounded-sm bg-neuro-primary/60"></div>
             <div className="w-3 h-3 rounded-sm bg-neuro-primary"></div>
             <div className="w-3 h-3 rounded-sm bg-neuro-secondary"></div>
          </div>
          <span>Mais</span>
        </div>
      </div>

      <div className="flex gap-3">
        {/* Day Labels Column */}
        <div className="grid grid-rows-7 gap-1.5 h-full pt-[1px]">
          {WEEKDAYS.map((day, i) => (
             <span key={i} className="text-[9px] text-neuro-muted h-3.5 flex items-center leading-none">
               {i % 2 === 0 ? day : ''} {/* Show only D, T, Q, S for cleaner look */}
             </span>
          ))}
        </div>

        {/* The Grid */}
        <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex gap-1 min-w-max">
             <div className="grid grid-rows-7 grid-flow-col gap-1.5">
                {dates.map((dateStr) => {
                   const level = getActivityLevel(dateStr);
                   const dateObj = new Date(dateStr + 'T00:00:00'); // Force local interpretation or consistent parsing
                   const activity = activityData.find(a => a.date === dateStr);
                   
                   return (
                      <div 
                        key={dateStr}
                        className={`w-3.5 h-3.5 rounded-sm border transition-all duration-300 hover:scale-125 hover:z-10 relative group ${getColorClass(level)}`}
                      >
                         {/* Tooltip */}
                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-neuro-base border border-white/10 text-white text-[10px] px-3 py-2 rounded-xl whitespace-nowrap z-50 shadow-2xl pointer-events-none">
                            <span className="font-bold text-neuro-secondary block mb-0.5">
                               {activity?.count || 0} tarefas
                            </span>
                            <span className="text-gray-400 capitalize">
                               {dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
                            </span>
                         </div>
                      </div>
                   );
                })}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
