
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { ArrowRight, User, Zap, Activity, Cpu, CheckCircle2, Sunrise, Sun, Moon, Waves } from 'lucide-react';

interface NeuroSetupProps {
  user: UserProfile;
  onComplete: (username: string, chronotype: string) => Promise<void>;
}

const STEPS = {
  IDENTITY: 0,
  RHYTHM: 1,
  BOOT: 2
};

const CHRONOTYPES = [
  { 
    id: 'lion', 
    label: 'Manhã (06h - 10h)', 
    sub: 'Acordo com energia total.',
    icon: Sunrise,
    color: 'text-orange-400',
    border: 'border-orange-500/50'
  },
  { 
    id: 'bear', 
    label: 'Meio do Dia (10h - 14h)', 
    sub: 'Acompanho o sol.',
    icon: Sun,
    color: 'text-yellow-400',
    border: 'border-yellow-500/50'
  },
  { 
    id: 'wolf', 
    label: 'Noite (18h - 00h)', 
    sub: 'Minha mente acorda tarde.',
    icon: Moon,
    color: 'text-purple-400',
    border: 'border-purple-500/50'
  },
  { 
    id: 'dolphin', 
    label: 'Variável / Picado', 
    sub: 'Tenho picos curtos de foco.',
    icon: Waves,
    color: 'text-cyan-400',
    border: 'border-cyan-500/50'
  }
];

const NeuroSetup: React.FC<NeuroSetupProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(STEPS.IDENTITY);
  const [username, setUsername] = useState(user.username === user.email.split('@')[0] ? '' : user.username || '');
  const [selectedChronotype, setSelectedChronotype] = useState<string | null>(null);
  const [bootProgress, setBootProgress] = useState(0);
  const [bootStatus, setBootStatus] = useState('Iniciando núcleo...');

  // Boot Sequence Effect
  useEffect(() => {
    if (step === STEPS.BOOT) {
      const sequences = [
        { progress: 20, text: 'Analisando padrões neurais...' },
        { progress: 45, text: 'Calibrando ciclo circadiano...' },
        { progress: 70, text: 'Otimizando sistema de dopamina...' },
        { progress: 90, text: 'Sincronizando banco de dados...' },
        { progress: 100, text: 'Sistema NeuroFocus: ONLINE' }
      ];

      let currentSeq = 0;

      const interval = setInterval(() => {
        if (currentSeq < sequences.length) {
          setBootProgress(sequences[currentSeq].progress);
          setBootStatus(sequences[currentSeq].text);
          currentSeq++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
             onComplete(username || user.email.split('@')[0], selectedChronotype || 'bear');
          }, 800);
        }
      }, 800);

      return () => clearInterval(interval);
    }
  }, [step, onComplete, username, selectedChronotype, user.email]);

  const handleIdentitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setStep(STEPS.RHYTHM);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neuro-base flex flex-col items-center justify-center p-6 overflow-hidden">
      
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-neuro-primary/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-neuro-secondary/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg">
        
        {/* Header Logo */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
           <img 
             src="https://i.postimg.cc/G3FxF89L/NFbasica.png" 
             alt="NeuroFocus" 
             className="h-16 w-auto mx-auto mb-4 drop-shadow-[0_0_15px_rgba(122,43,239,0.5)]"
           />
           <div className="h-1 w-24 bg-neuro-primary/30 mx-auto rounded-full overflow-hidden">
             <div className="h-full bg-neuro-secondary animate-progress-indeterminate"></div>
           </div>
        </div>

        {/* STEP 1: IDENTITY */}
        {step === STEPS.IDENTITY && (
          <div className="bg-neuro-surface/50 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-500">
            <h2 className="text-2xl font-serif font-bold text-white mb-2 text-center">Identificação</h2>
            <p className="text-neuro-muted text-center mb-8 text-sm">Como o sistema deve se referir a você?</p>
            
            <form onSubmit={handleIdentitySubmit} className="space-y-6">
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neuro-muted group-focus-within:text-neuro-primary transition-colors" size={20} />
                <input 
                  autoFocus
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu nome ou apelido"
                  className="w-full pl-12 pr-4 py-4 bg-neuro-base border border-neuro-highlight rounded-xl focus:outline-none focus:ring-2 focus:ring-neuro-primary/50 focus:border-neuro-primary text-white placeholder:text-gray-600 transition-all text-lg font-medium"
                />
              </div>

              <button 
                type="submit"
                disabled={!username.trim()}
                className="w-full bg-neuro-primary hover:bg-neuro-secondary text-white py-4 rounded-xl font-bold shadow-glow flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                Continuar
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: RHYTHM */}
        {step === STEPS.RHYTHM && (
          <div className="animate-in slide-in-from-right duration-500">
             <div className="text-center mb-8">
                <h2 className="text-3xl font-serif font-bold text-white mb-2">Calibragem Neural</h2>
                <p className="text-neuro-muted">Qual horário você sente seu <span className="text-neuro-secondary font-bold">PICO</span> de energia?</p>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {CHRONOTYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setSelectedChronotype(type.id);
                      setTimeout(() => setStep(STEPS.BOOT), 300);
                    }}
                    className={`
                      relative p-6 rounded-2xl border bg-neuro-surface/80 hover:bg-neuro-highlight text-left transition-all duration-300 group
                      ${selectedChronotype === type.id ? `border-neuro-secondary ring-1 ring-neuro-secondary ${type.color}` : 'border-white/5 hover:border-white/20 text-gray-400'}
                    `}
                  >
                     <div className="flex items-center justify-between mb-3">
                        <type.icon size={28} className={selectedChronotype === type.id ? type.color : 'text-neuro-muted group-hover:text-white'} />
                        {selectedChronotype === type.id && <CheckCircle2 size={20} className="text-neuro-secondary" />}
                     </div>
                     <h3 className={`font-bold text-sm mb-1 ${selectedChronotype === type.id ? 'text-white' : 'text-gray-200'}`}>{type.label}</h3>
                     <p className="text-xs text-neuro-muted">{type.sub}</p>
                  </button>
                ))}
             </div>
          </div>
        )}

        {/* STEP 3: BOOT SEQUENCE */}
        {step === STEPS.BOOT && (
           <div className="text-center animate-in zoom-in duration-700">
              <div className="w-24 h-24 bg-neuro-surface rounded-full flex items-center justify-center mx-auto mb-8 border border-neuro-primary/20 shadow-glow relative">
                 <div className="absolute inset-0 rounded-full border-4 border-neuro-primary/20 border-t-neuro-secondary animate-spin"></div>
                 <Cpu size={40} className="text-neuro-primary animate-pulse" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2 tracking-widest uppercase">Inicializando</h2>
              <p className="text-neuro-secondary font-mono text-sm mb-8 h-6">{bootStatus}</p>

              <div className="w-full bg-neuro-surface h-2 rounded-full overflow-hidden border border-white/5">
                 <div 
                   className="bg-neuro-primary h-full transition-all duration-700 ease-out shadow-glow"
                   style={{ width: `${bootProgress}%` }}
                 ></div>
              </div>
              <p className="text-right text-xs text-neuro-muted mt-2 font-mono">{bootProgress}%</p>
           </div>
        )}

      </div>
    </div>
  );
};

export default NeuroSetup;
