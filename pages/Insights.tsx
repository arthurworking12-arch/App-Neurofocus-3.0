import React, { useState } from 'react';
import { Task } from '../types';
import { getRoutineSuggestions } from '../services/geminiService';
import { Sparkles, Bot, Lightbulb, ArrowRight } from 'lucide-react';

interface InsightsProps {
  tasks: Task[];
}

const Insights: React.FC<InsightsProps> = ({ tasks }) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const completed = tasks.filter(t => t.is_completed);
    const pending = tasks.filter(t => !t.is_completed);
    
    try {
      const response = await getRoutineSuggestions(completed, pending);
      const parsed = JSON.parse(response);
      if (parsed && parsed.suggestions) {
        setSuggestions(parsed.suggestions);
        setHasGenerated(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl mx-auto">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 bg-neuro-highlight rounded-2xl mx-auto flex items-center justify-center text-neuro-secondary shadow-glow border border-neuro-primary/20">
          <Sparkles size={24} />
        </div>
        <h2 className="text-3xl font-serif font-bold text-white">Insights Neurais</h2>
        <p className="text-neuro-muted max-w-lg mx-auto">
          Utilize a IA para analisar seus padrões de comportamento e receber sugestões personalizadas para otimizar sua rotina.
        </p>
      </div>

      {!hasGenerated ? (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="group relative overflow-hidden bg-neuro-primary text-white px-8 py-4 rounded-2xl font-medium shadow-glow hover:shadow-[0_0_30px_rgba(122,43,239,0.4)] transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 border border-neuro-secondary/20"
          >
            <span className="relative z-10 flex items-center gap-3">
              {loading ? (
                <>Analisando dados...</>
              ) : (
                <>
                  <Bot size={20} />
                  Gerar Análise Diária
                </>
              )}
            </span>
            {loading && (
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            )}
          </button>
        </div>
      ) : (
        <div className="grid gap-6 mt-8">
           {suggestions.map((s, idx) => (
             <div 
                key={idx} 
                className="bg-neuro-surface p-6 rounded-2xl shadow-sm border border-white/5 flex gap-4 hover:border-neuro-primary/30 transition-colors animate-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-neuro-highlight text-neuro-secondary rounded-full flex items-center justify-center border border-white/5">
                    <Lightbulb size={20} />
                  </div>
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-white mb-2">{s.title}</h3>
                  <p className="text-neuro-muted leading-relaxed">{s.description}</p>
                </div>
             </div>
           ))}
           
           <div className="flex justify-center mt-4">
              <button 
                onClick={handleGenerate}
                className="text-neuro-muted hover:text-neuro-secondary text-sm font-medium flex items-center gap-1 transition-colors"
              >
                Gerar novas sugestões <ArrowRight size={14} />
              </button>
           </div>
        </div>
      )}
      
      {!hasGenerated && !loading && (
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 opacity-50 pointer-events-none filter blur-[1px]">
            {[1,2,3].map(i => (
              <div key={i} className="h-32 bg-neuro-surface/30 rounded-2xl border border-white/5"></div>
            ))}
         </div>
      )}
    </div>
  );
};

export default Insights;