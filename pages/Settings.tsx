import React, { useState } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../services/supabaseClient';
import { User, Mail, Save, Award, Zap, Quote, Loader2, Lock, CheckCircle2, AlertCircle, Sun, Moon, Sunrise, Waves } from 'lucide-react';

interface SettingsProps {
  user: UserProfile;
  onUpdateProfile: (name: string, bio: string, chronotype?: string) => Promise<void>;
}

const CHRONOTYPES = [
  { 
    id: 'lion', 
    label: 'Leão (Matutino)', 
    icon: Sunrise, 
    desc: 'Acorda cedo cheio de energia. Pico de foco: 08h - 12h. Cansaço bate cedo à noite.' 
  },
  { 
    id: 'bear', 
    label: 'Urso (Solar)', 
    icon: Sun, 
    desc: 'Ritmo solar tradicional. Pico de foco: 10h - 14h. Necessita de 8h de sono sólidas.' 
  },
  { 
    id: 'wolf', 
    label: 'Lobo (Noturno)', 
    icon: Moon, 
    desc: 'Dificuldade de manhã. Pico criativo e energético começa tarde: 17h - 00h.' 
  },
  { 
    id: 'dolphin', 
    label: 'Golfinho (Errático)', 
    icon: Waves, 
    desc: 'Sono leve e fragmentado. Melhor foco em janelas curtas: 10h - 12h.' 
  }
];

const Settings: React.FC<SettingsProps> = ({ user, onUpdateProfile }) => {
  // Profile State
  const [username, setUsername] = useState(user.username || '');
  const [bio, setBio] = useState(user.bio || '');
  const [chronotype, setChronotype] = useState<string>(user.chronotype || 'bear'); // Default to Bear if null
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passSaving, setPassSaving] = useState(false);
  const [passMessage, setPassMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      await onUpdateProfile(username, bio, chronotype);
      setProfileMessage('Perfil atualizado com sucesso!');
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (error) {
      console.error(error);
      setProfileMessage('Erro ao atualizar perfil.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassSaving(true);
    setPassMessage(null);

    if (newPassword !== confirmPassword) {
        setPassMessage({ text: 'As senhas não coincidem.', type: 'error' });
        setPassSaving(false);
        return;
    }

    if (newPassword.length < 6) {
        setPassMessage({ text: 'A senha deve ter no mínimo 6 caracteres.', type: 'error' });
        setPassSaving(false);
        return;
    }

    try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        
        if (error) throw error;

        setPassMessage({ text: 'Senha atualizada com segurança.', type: 'success' });
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPassMessage(null), 4000);
    } catch (error: any) {
        setPassMessage({ text: error.message || 'Erro ao alterar senha.', type: 'error' });
    } finally {
        setPassSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
           <h2 className="text-3xl font-serif font-bold text-white mb-2">Meu Perfil</h2>
           <p className="text-neuro-muted">Personalize sua identidade e segurança.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Forms */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* PROFILE FORM */}
          <form onSubmit={handleProfileSubmit} className="bg-neuro-surface p-8 rounded-3xl border border-white/5 shadow-sm space-y-6">
            <h3 className="text-xl font-serif font-semibold text-white mb-4 flex items-center gap-2">
               <User className="text-neuro-primary" size={24} />
               Dados Pessoais
            </h3>

            <div className="space-y-2">
               <label className="text-xs font-bold text-neuro-muted uppercase tracking-wider ml-1">Nome de Exibição</label>
               <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-neuro-base border border-neuro-highlight rounded-xl focus:outline-none focus:ring-2 focus:ring-neuro-primary/50 focus:border-neuro-primary text-white font-medium placeholder:text-gray-700"
                  placeholder="Como quer ser chamado?"
               />
            </div>

            <div className="space-y-2">
               <label className="text-xs font-bold text-neuro-muted uppercase tracking-wider ml-1">Bio / Mantra Pessoal</label>
               <div className="relative">
                  <Quote className="absolute top-3 left-3 text-neuro-muted/50" size={16} />
                  <textarea 
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={2}
                      className="w-full pl-10 pr-4 py-3 bg-neuro-base border border-neuro-highlight rounded-xl focus:outline-none focus:ring-2 focus:ring-neuro-primary/50 focus:border-neuro-primary text-white resize-none placeholder:text-gray-700"
                      placeholder="Uma frase que te inspira..."
                  />
               </div>
            </div>

            {/* CHRONOTYPE SELECTION */}
            <div className="space-y-3 pt-2">
               <label className="text-xs font-bold text-neuro-muted uppercase tracking-wider ml-1 flex items-center gap-2">
                  <Zap size={14} className="text-neuro-secondary" />
                  Seu Cronotipo (Bio-Ritmo)
               </label>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {CHRONOTYPES.map((type) => (
                    <div 
                      key={type.id}
                      onClick={() => setChronotype(type.id)}
                      className={`cursor-pointer p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group ${
                        chronotype === type.id 
                          ? 'bg-neuro-highlight border-neuro-primary shadow-glow-sm' 
                          : 'bg-neuro-base border-white/5 hover:border-white/20'
                      }`}
                    >
                       <div className="flex items-center gap-3 mb-2">
                          <type.icon size={20} className={chronotype === type.id ? 'text-neuro-secondary' : 'text-neuro-muted'} />
                          <span className={`font-bold text-sm ${chronotype === type.id ? 'text-white' : 'text-gray-400'}`}>
                             {type.label}
                          </span>
                       </div>
                       <p className="text-xs text-neuro-muted leading-tight opacity-80">
                          {type.desc}
                       </p>
                       {chronotype === type.id && (
                          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-neuro-primary shadow-glow"></div>
                       )}
                    </div>
                  ))}
               </div>
            </div>

            <div className="space-y-2 opacity-60">
               <label className="text-xs font-bold text-neuro-muted uppercase tracking-wider ml-1">Email</label>
               <div className="flex items-center gap-3 px-4 py-3 bg-neuro-base/50 border border-white/5 rounded-xl text-neuro-muted">
                  <Mail size={16} />
                  <span>{user.email}</span>
               </div>
            </div>

            <div className="pt-4 flex items-center gap-4">
              <button 
                type="submit" 
                disabled={profileSaving}
                className="bg-neuro-primary hover:bg-neuro-secondary text-white px-6 py-3 rounded-xl shadow-glow flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed border border-neuro-secondary/20"
              >
                 {profileSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                 Salvar Perfil
              </button>
              {profileMessage && (
                <span className={`text-sm font-medium animate-in fade-in ${profileMessage.includes('Erro') ? 'text-red-400' : 'text-neuro-secondary'}`}>
                   {profileMessage}
                </span>
              )}
            </div>
          </form>

          {/* PASSWORD FORM */}
          <form onSubmit={handlePasswordSubmit} className="bg-neuro-surface p-8 rounded-3xl border border-white/5 shadow-sm space-y-6">
             <h3 className="text-xl font-serif font-semibold text-white mb-4 flex items-center gap-2">
               <Lock className="text-neuro-secondary" size={24} />
               Segurança
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-neuro-muted uppercase tracking-wider ml-1">Nova Senha</label>
                    <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-neuro-base border border-neuro-highlight rounded-xl focus:outline-none focus:ring-2 focus:ring-neuro-secondary/50 focus:border-neuro-secondary text-white placeholder:text-gray-700"
                        placeholder="••••••••"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-neuro-muted uppercase tracking-wider ml-1">Confirmar Senha</label>
                    <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-neuro-base border border-neuro-highlight rounded-xl focus:outline-none focus:ring-2 focus:ring-neuro-secondary/50 focus:border-neuro-secondary text-white placeholder:text-gray-700"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <div className="pt-2 flex items-center gap-4">
              <button 
                type="submit" 
                disabled={passSaving || !newPassword}
                className="bg-transparent border border-neuro-secondary/30 text-neuro-secondary hover:bg-neuro-secondary hover:text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 {passSaving ? <Loader2 className="animate-spin" size={20} /> : <Lock size={18} />}
                 Atualizar Senha
              </button>
              
              {passMessage && (
                <div className={`flex items-center gap-2 text-sm font-medium animate-in fade-in ${passMessage.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                   {passMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                   {passMessage.text}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Stats */}
        <div className="space-y-6">
           <div className="bg-neuro-surface text-white p-8 rounded-3xl shadow-lg relative overflow-hidden border border-neuro-primary/20">
               {/* Decorative Background */}
               <div className="absolute top-0 right-0 w-48 h-48 bg-neuro-primary/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
               
               <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-neuro-gradient rounded-2xl flex items-center justify-center text-white shadow-glow mb-4 border-2 border-white/10">
                     <span className="text-3xl font-serif font-bold">{user.level}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-1">Nível Atual</h3>
                  <p className="text-neuro-muted text-sm mb-6">Continue completando tarefas para evoluir.</p>
                  
                  <div className="w-full space-y-2">
                     <div className="flex justify-between text-xs font-medium text-neuro-muted uppercase tracking-wider">
                        <span>XP</span>
                        <span>{user.current_xp} / {user.xp_to_next_level}</span>
                     </div>
                     <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                        <div 
                           className="bg-neuro-primary h-full rounded-full transition-all duration-1000 ease-out shadow-glow-sm"
                           style={{ width: `${(user.current_xp / user.xp_to_next_level) * 100}%` }}
                        />
                     </div>
                  </div>
               </div>
           </div>

           <div className="bg-neuro-surface p-6 rounded-3xl border border-white/5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
                 <Zap size={24} fill="currentColor" />
              </div>
              <div>
                 <p className="text-xs text-neuro-muted uppercase font-bold tracking-wider">Sequência</p>
                 <p className="text-xl font-bold text-white">{user.streak_days} dias seguidos</p>
              </div>
           </div>
           
           <div className="bg-neuro-surface p-6 rounded-3xl border border-white/5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                 <Award size={24} />
              </div>
              <div>
                 <p className="text-xs text-neuro-muted uppercase font-bold tracking-wider">Status</p>
                 <p className="text-xl font-bold text-white">
                    {user.level < 5 ? 'Iniciante' : user.level < 15 ? 'Focado' : 'Mestre Zen'}
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;