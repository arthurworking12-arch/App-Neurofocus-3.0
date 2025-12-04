import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Loader2, ArrowRight, ArrowLeft, Mail } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for Recovery Mode (Request)
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Erro ao tentar entrar.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecoveryRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.href, // Redirect back to this app
        });
        if (error) throw error;
        setRecoverySent(true);
    } catch (err: any) {
        setError(err.message || 'Erro ao enviar email de recuperação.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neuro-base flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-neuro-primary/20 rounded-full blur-[100px] opacity-40"></div>
         <div className="absolute top-[40%] right-[0%] w-[500px] h-[500px] bg-neuro-deep/20 rounded-full blur-[120px] opacity-40"></div>
         <div className="absolute bottom-0 left-[20%] w-[400px] h-[400px] bg-neuro-secondary/10 rounded-full blur-[80px] opacity-30"></div>
      </div>

      <div className="max-w-md w-full bg-neuro-surface/50 backdrop-blur-xl rounded-3xl shadow-2xl shadow-neuro-base border border-white/5 p-8 md:p-12 animate-in fade-in zoom-in duration-500 relative z-10">
        <div className="text-center mb-10">
          {/* Logo Oficial NeuroFocus */}
          <div className="flex justify-center mb-6">
             <img 
               src="https://i.postimg.cc/G3FxF89L/NFbasica.png" 
               alt="NeuroFocus Logo" 
               className="w-32 h-auto object-contain drop-shadow-[0_0_25px_rgba(122,43,239,0.5)]"
             />
          </div>
          
          <h1 className="text-3xl font-sans font-extrabold text-white mb-2 tracking-tight">
            Neuro<span className="text-neuro-primary">Focus</span>
          </h1>
          <p className="text-neuro-muted text-sm font-medium">
            {isForgotPassword ? 'Recuperação de Acesso' : 'Acesso ao Sistema Neural'}
          </p>
        </div>

        {isForgotPassword ? (
            /* Forgot Password Form */
            !recoverySent ? (
                <form onSubmit={handleRecoveryRequest} className="space-y-5 animate-in slide-in-from-right duration-300">
                    {error && (
                        <div className="p-4 bg-red-500/10 text-red-400 text-sm rounded-xl border border-red-500/20 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        {error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-neuro-muted uppercase tracking-widest ml-1">Email para recuperação</label>
                        <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-4 bg-neuro-base border border-neuro-highlight rounded-xl focus:outline-none focus:ring-2 focus:ring-neuro-primary/50 focus:border-neuro-primary transition-all text-white placeholder:text-gray-600"
                        placeholder="seu@email.com"
                        required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-neuro-primary hover:bg-neuro-secondary text-white font-bold py-4 rounded-xl shadow-glow flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-6 active:scale-[0.98] border border-neuro-secondary/20"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                        <>
                            Enviar Link
                            <Mail size={18} />
                        </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => { setIsForgotPassword(false); setError(null); }}
                        className="w-full text-neuro-muted hover:text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 py-2"
                    >
                        <ArrowLeft size={16} /> Voltar para Login
                    </button>
                </form>
            ) : (
                <div className="text-center space-y-6 animate-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto border border-green-500/20 shadow-glow-sm">
                        <Mail size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">Email Enviado!</h3>
                        <p className="text-neuro-muted text-sm leading-relaxed">
                            Verifique sua caixa de entrada (e spam) para encontrar o link de redefinição de senha.
                        </p>
                    </div>
                    <button
                        onClick={() => { setRecoverySent(false); setIsForgotPassword(false); }}
                        className="text-neuro-primary hover:text-neuro-secondary font-bold text-sm"
                    >
                        Voltar ao início
                    </button>
                </div>
            )
        ) : (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-5 animate-in slide-in-from-left duration-300">
            {error && (
                <div className="p-4 bg-red-500/10 text-red-400 text-sm rounded-xl border border-red-500/20 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                {error}
                </div>
            )}
            
            <div className="space-y-2">
                <label className="text-xs font-bold text-neuro-muted uppercase tracking-widest ml-1">Email</label>
                <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-4 bg-neuro-base border border-neuro-highlight rounded-xl focus:outline-none focus:ring-2 focus:ring-neuro-primary/50 focus:border-neuro-primary transition-all text-white placeholder:text-gray-600"
                placeholder="seu@email.com"
                required
                />
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-neuro-muted uppercase tracking-widest ml-1">Senha</label>
                    <button 
                        type="button"
                        onClick={() => setIsForgotPassword(true)}
                        className="text-xs text-neuro-primary hover:text-neuro-secondary font-semibold transition-colors"
                    >
                        Esqueceu?
                    </button>
                </div>
                <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 bg-neuro-base border border-neuro-highlight rounded-xl focus:outline-none focus:ring-2 focus:ring-neuro-primary/50 focus:border-neuro-primary transition-all text-white placeholder:text-gray-600"
                placeholder="••••••••"
                required
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-neuro-primary hover:bg-neuro-secondary text-white font-bold py-4 rounded-xl shadow-glow flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-6 active:scale-[0.98] border border-neuro-secondary/20"
            >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                    Entrar
                    <ArrowRight size={18} />
                </>
                )}
            </button>
            </form>
        )}

        <p className="text-center text-xs text-gray-700 mt-8 font-medium">
          NeuroFocus OS v2.1
        </p>
      </div>
    </div>
  );
};

export default Login;