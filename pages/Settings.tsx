import React, { useState } from 'react';
import { UserProfile } from '../types';
import { User, Mail, Save, Award, Zap, Quote, Loader2 } from 'lucide-react';

interface SettingsProps {
  user: UserProfile;
  onUpdateProfile: (name: string, bio: string) => Promise<void>;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdateProfile }) => {
  const [username, setUsername] = useState(user.username || '');
  const [bio, setBio] = useState(user.bio || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await onUpdateProfile(username, bio);
      setMessage('Perfil atualizado com sucesso!');
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error(error);
      setMessage('Erro ao atualizar perfil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
           <h2 className="text-3xl font-serif font-bold text-white mb-2">Meu Perfil</h2>
           <p className="text-neuro-muted">Personalize sua identidade e acompanhe sua jornada.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-neuro-surface p-8 rounded-3xl border border-white/5 shadow-sm space-y-6">
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
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 bg-neuro-base border border-neuro-highlight rounded-xl focus:outline-none focus:ring-2 focus:ring-neuro-primary/50 focus:border-neuro-primary text-white resize-none placeholder:text-gray-700"
                      placeholder="Uma frase que te inspira ou seu objetivo principal..."
                  />
               </div>
            </div>

            <div className="space-y-2 opacity-60">
               <label className="text-xs font-bold text-neuro-muted uppercase tracking-wider ml-1">Email (Não editável)</label>
               <div className="flex items-center gap-3 px-4 py-3 bg-neuro-base/50 border border-white/5 rounded-xl text-neuro-muted">
                  <Mail size={16} />
                  <span>{user.email}</span>
               </div>
            </div>

            <div className="pt-4 flex items-center gap-4">
              <button 
                type="submit" 
                disabled={saving}
                className="bg-neuro-primary hover:bg-neuro-secondary text-white px-6 py-3 rounded-xl shadow-glow flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed border border-neuro-secondary/20"
              >
                 {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                 Salvar Alterações
              </button>
              {message && (
                <span className={`text-sm font-medium animate-in fade-in ${message.includes('Erro') ? 'text-red-400' : 'text-neuro-secondary'}`}>
                   {message}
                </span>
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