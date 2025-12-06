
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Task } from '../types';
import { createChatSession } from '../services/geminiService';
import { Send, User, Bot, Loader2, AlertCircle } from 'lucide-react';
import { Chat, GenerateContentResponse } from "@google/genai";

interface NeuroChatProps {
  user: UserProfile;
  tasks: Task[];
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const NeuroChat: React.FC<NeuroChatProps> = ({ user, tasks }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Olá, ${user.username || 'Membro'}. Sou a Dra. Neuro. Como posso ajudar a otimizar sua rotina ou clarear sua mente hoje?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Inicialização segura do Chat
    try {
        setInitError(null);
        chatSessionRef.current = createChatSession(user, tasks);
    } catch (err: any) {
        console.error("Erro ao iniciar NeuroChat:", err);
        setInitError("Não foi possível conectar à Inteligência Artificial. Verifique se a chave de API está configurada corretamente na Vercel.");
    }
  }, [user, tasks]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatSessionRef.current || loading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const result: GenerateContentResponse = await chatSessionRef.current.sendMessage({ message: userMessage });
      const responseText = result.text;

      setMessages(prev => [...prev, { role: 'model', text: responseText || "Desculpe, tive um momento de devaneio. Pode repetir?" }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Houve uma interrupção na minha conexão neural. Tente novamente em instantes." }]);
    } finally {
      setLoading(false);
    }
  };

  if (initError) {
      return (
        <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center text-center p-8 animate-in fade-in">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Sistema Offline</h2>
            <p className="text-neuro-muted max-w-md">
                {initError}
            </p>
        </div>
      )
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col max-w-4xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4 border-b border-white/5 pb-4">
        <div className="w-12 h-12 bg-neuro-highlight text-neuro-secondary rounded-full flex items-center justify-center border border-neuro-primary/20">
           <Bot size={24} />
        </div>
        <div>
           <h2 className="text-2xl font-serif font-bold text-white">NeuroChat</h2>
           <p className="text-sm text-neuro-muted">Consultoria de bem-estar baseada em neurociência.</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-thin">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-neuro-highlight text-neuro-secondary flex items-center justify-center flex-shrink-0 mt-1 border border-white/5">
                <Bot size={16} />
              </div>
            )}
            
            <div className={`
              max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm
              ${msg.role === 'user' 
                ? 'bg-neuro-primary text-white rounded-br-none shadow-glow' 
                : 'bg-neuro-surface border border-white/5 text-gray-200 rounded-bl-none'}
            `}>
              {msg.text}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-neuro-surface text-neuro-muted flex items-center justify-center flex-shrink-0 mt-1 border border-white/5">
                <User size={16} />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start gap-3">
             <div className="w-8 h-8 rounded-full bg-neuro-highlight text-neuro-secondary flex items-center justify-center flex-shrink-0 mt-1">
                <Bot size={16} />
              </div>
              <div className="bg-neuro-surface border border-white/5 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2 text-neuro-muted text-sm">
                 <Loader2 size={16} className="animate-spin" />
                 <span>Processando...</span>
              </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Converse com a Dra. Neuro..."
          className="w-full pl-6 pr-14 py-4 bg-neuro-surface border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neuro-primary/50 focus:border-neuro-primary text-white shadow-sm placeholder:text-gray-600"
          disabled={loading}
        />
        <button 
          type="submit"
          disabled={!input.trim() || loading}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-neuro-primary text-white rounded-xl hover:bg-neuro-secondary disabled:opacity-50 disabled:bg-neuro-highlight transition-all shadow-glow-sm"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default NeuroChat;
