
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, CheckCircle2, Target } from 'lucide-react';
import { playSound } from '../services/soundService';
import { Task } from '../types';

interface FocusModeProps {
  focusedTask?: Task | null;
  onCompleteTask?: () => void;
}

const MODES = {
  focus: { label: 'Foco Profundo', minutes: 25, color: 'text-neuro-primary', ring: 'stroke-neuro-primary', glow: 'drop-shadow-[0_0_10px_rgba(122,43,239,0.8)]' },
  short: { label: 'Pausa Curta', minutes: 5, color: 'text-blue-400', ring: 'stroke-blue-500', glow: 'drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]' },
  long: { label: 'Pausa Longa', minutes: 15, color: 'text-indigo-400', ring: 'stroke-indigo-500', glow: 'drop-shadow-[0_0_10px_rgba(99,102,241,0.8)]' },
};

type TimerMode = keyof typeof MODES;

const FocusMode: React.FC<FocusModeProps> = ({ focusedTask, onCompleteTask }) => {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(MODES.focus.minutes * 60);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<number | null>(null);

  // AUTO-START if a task is focused
  useEffect(() => {
    if (focusedTask && !isActive) {
        setIsActive(true);
        setMode('focus');
        setTimeLeft(MODES.focus.minutes * 60);
        playSound('click', 0.2);
    }
  }, [focusedTask]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // PLAY SOUND
      playSound('timerFinish', 0.6);
      
      // Notification
      if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification("NeuroFocus", { body: "Tempo esgotado!" });
          } catch (e) {
            console.warn("Notificação falhou", e);
          }
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isActive, timeLeft]);

  useEffect(() => {
      if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission().catch(err => console.log("Erro ao pedir permissão de notificação", err));
      }
  }, []);

  const toggleTimer = () => {
      setIsActive(!isActive);
      if (!isActive) playSound('click', 0.2); // Som ao iniciar
  };
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(MODES[mode].minutes * 60);
    playSound('click', 0.2);
  };

  const changeMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(MODES[newMode].minutes * 60);
    playSound('click', 0.2);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((MODES[mode].minutes * 60 - timeLeft) / (MODES[mode].minutes * 60)) * 100;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-in fade-in duration-700">
      
      {/* HEADER FOR DEEP FOCUS */}
      {focusedTask && (
        <div className="mb-8 bg-neuro-surface/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-neuro-primary/40 shadow-glow text-center animate-in slide-in-from-top-4">
             <div className="flex items-center justify-center gap-2 text-neuro-secondary mb-1 uppercase tracking-widest text-xs font-bold">
                 <Target size={14} />
                 Modo Hiperfoco Ativo
             </div>
             <h2 className="text-xl font-bold text-white">{focusedTask.title}</h2>
        </div>
      )}

      <div className="mb-8 flex gap-2 bg-neuro-surface p-1.5 rounded-2xl shadow-sm border border-white/5">
        {(Object.keys(MODES) as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => changeMode(m)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              mode === m 
                ? 'bg-neuro-highlight text-white shadow-md border border-white/5' 
                : 'text-neuro-muted hover:bg-white/5 hover:text-white'
            }`}
          >
            {MODES[m].label}
          </button>
        ))}
      </div>

      <div className="relative mb-12">
        {/* SVG Circle Timer */}
        <svg className="transform -rotate-90 w-80 h-80">
          <circle
            className="text-white/5"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="160"
            cy="160"
          />
          <circle
            className={`${MODES[mode].ring} transition-all duration-1000 ease-linear ${MODES[mode].glow}`}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="160"
            cy="160"
          />
        </svg>
        
        {/* Time Display */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div className={`text-6xl font-serif font-bold text-white tracking-tighter tabular-nums mb-2 text-shadow-glow`}>
            {formatTime(timeLeft)}
          </div>
          <p className={`text-sm font-medium uppercase tracking-widest ${MODES[mode].color}`}>
            {isActive ? 'Focando' : 'Pausado'}
          </p>
        </div>
      </div>

      <div className="flex gap-6 items-center">
        <button
          onClick={toggleTimer}
          className="w-16 h-16 bg-neuro-primary text-white rounded-2xl flex items-center justify-center shadow-glow hover:bg-neuro-secondary hover:scale-105 transition-all active:scale-95 border border-neuro-secondary/20"
        >
          {isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
        </button>
        <button
          onClick={resetTimer}
          className="w-16 h-16 bg-neuro-surface text-neuro-muted border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/5 hover:text-white transition-all active:scale-95"
        >
          <RotateCcw size={24} />
        </button>
      </div>

      {/* COMPLETE TASK BUTTON - Shows when focused and timer paused or finished */}
      {focusedTask && (!isActive || timeLeft === 0) && (
          <div className="mt-8 animate-in slide-in-from-bottom-4 fade-in">
             <button
                onClick={onCompleteTask}
                className="bg-neuro-secondary hover:bg-white text-neuro-base font-bold px-8 py-4 rounded-xl shadow-glow flex items-center gap-3 transition-all hover:scale-105 active:scale-95"
             >
                <CheckCircle2 size={24} />
                Concluir '{focusedTask.title}'
             </button>
          </div>
      )}

      {!focusedTask && (
        <div className="mt-12 max-w-md text-center">
            <div className="bg-neuro-surface/50 p-6 rounded-2xl border border-white/5">
            <div className="flex items-center justify-center gap-2 mb-2 text-neuro-secondary font-semibold">
                <Brain size={18} />
                <span>Dica de Neurociência</span>
            </div>
            <p className="text-neuro-muted text-sm leading-relaxed">
                O cérebro precisa de pausas difusas para consolidar o aprendizado. 
                Durante os 5 minutos de pausa, evite telas. Olhe pela janela ou beba água.
            </p>
            </div>
        </div>
      )}
    </div>
  );
};

export default FocusMode;
