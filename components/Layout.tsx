import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Timer, 
  Sparkles, 
  LogOut, 
  Menu,
  X,
  User,
  Settings,
  MessageCircleHeart
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { UserProfile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  userProfile?: UserProfile | null;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, userProfile }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'routines', label: 'Rotinas', icon: CheckSquare },
    { id: 'focus', label: 'Focus Timer', icon: Timer },
    { id: 'insights', label: 'AI Insights', icon: Sparkles },
    { id: 'chat', label: 'NeuroChat', icon: MessageCircleHeart },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-neuro-base border-r border-neuro-highlight">
      <div className="p-8 pb-4 flex flex-col items-center md:items-start">
        {/* LOGO OFICIAL - IMAGEM */}
        <div className="flex items-center gap-3">
          <img 
            src="https://i.postimg.cc/G3FxF89L/NFbasica.png" 
            alt="NeuroFocus Logo" 
            className="h-16 w-auto object-contain drop-shadow-[0_0_15px_rgba(122,43,239,0.3)]"
          />
          <span className="text-xl font-sans font-bold text-white tracking-tight hidden md:block">
            Neuro<span className="text-neuro-primary">Focus</span>
          </span>
        </div>
      </div>

      {userProfile && (
        <div className="px-6 py-4 mx-4 mb-2 bg-neuro-surface rounded-xl border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-0.5 rounded-full border border-neuro-secondary/50 shadow-glow-sm">
               <div className="w-8 h-8 bg-neuro-highlight rounded-full flex items-center justify-center text-neuro-secondary">
                 <User size={16} />
               </div>
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">{userProfile.username || 'Membro'}</p>
              <p className="text-[10px] text-neuro-muted font-bold uppercase tracking-widest mt-1">Nível {userProfile.level}</p>
            </div>
          </div>
          
          <div className="relative w-full h-1.5 bg-neuro-highlight rounded-full overflow-hidden mt-3">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-neuro-primary to-neuro-secondary shadow-glow-sm transition-all duration-500 ease-out"
              style={{ width: `${(userProfile.current_xp / userProfile.xp_to_next_level) * 100}%` }}
            />
          </div>
        </div>
      )}

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onTabChange(item.id);
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
              activeTab === item.id 
                ? 'text-white shadow-glow-sm bg-neuro-highlight border border-neuro-primary/20' 
                : 'text-neuro-muted hover:text-white hover:bg-neuro-highlight/50'
            }`}
          >
            {activeTab === item.id && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-neuro-primary rounded-l-xl" />
            )}
            
            <item.icon 
              size={18} 
              className={`relative z-10 transition-transform duration-300 ${activeTab === item.id ? 'text-neuro-secondary scale-110' : 'group-hover:text-neuro-secondary group-hover:scale-110'}`}
              strokeWidth={activeTab === item.id ? 2.5 : 2}
            />
            <span className={`relative z-10 text-sm font-medium ${activeTab === item.id ? 'font-semibold tracking-wide' : ''}`}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-neuro-highlight">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-neuro-muted hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 text-sm font-medium"
        >
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-neuro-base selection:bg-neuro-primary selection:text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 h-full flex-shrink-0 z-20 shadow-[5px_0_30px_-10px_rgba(0,0,0,0.5)]">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-neuro-base/80 backdrop-blur-md border-b border-neuro-highlight z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
           <img 
            src="https://i.postimg.cc/G3FxF89L/NFbasica.png" 
            alt="NF" 
            className="h-10 w-auto object-contain"
           />
           <span className="text-lg font-bold text-white tracking-tight">Neuro<span className="text-neuro-primary">Focus</span></span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-white hover:bg-neuro-highlight rounded-lg active:scale-95 transition-transform"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden pt-16 bg-black/50 backdrop-blur-sm">
           <div className="bg-neuro-base h-full w-3/4 max-w-xs animate-in slide-in-from-left duration-300 shadow-2xl border-r border-neuro-highlight">
              <SidebarContent />
           </div>
           <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto pt-16 md:pt-0 scroll-smooth bg-neuro-base">
        <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;