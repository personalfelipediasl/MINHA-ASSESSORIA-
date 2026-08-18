import React from 'react';
import { Home, Play, TrendingUp, User, ShieldCheck, HeartPulse } from 'lucide-react';

export type NavTab = 'home' | 'treinos' | 'treinador' | 'evolucao' | 'perfil';

interface NavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  hasActiveWorkout?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  hasActiveWorkout,
}) => {
  const tabs = [
    { id: 'home' as NavTab, label: 'Início', icon: Home },
    { id: 'treinos' as NavTab, label: 'Treino', icon: Play },
    { id: 'treinador' as NavTab, label: 'Meu Treinador', icon: ShieldCheck, highlight: true },
    { id: 'evolucao' as NavTab, label: 'Minha Evolução', icon: TrendingUp },
    { id: 'perfil' as NavTab, label: 'Perfil', icon: User },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav
        id="mobile-nav"
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#111111]/95 backdrop-blur-md border-t border-[#222222] md:hidden pb-safe"
      >
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-btn-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                  isActive
                    ? 'text-[#FF5500] font-semibold scale-105'
                    : 'text-[#888888] hover:text-white'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                  {tab.id === 'treinador' && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#FF5500] rounded-full animate-pulse" />
                  )}
                </div>
                <span className="text-[10px] mt-1 tracking-tight truncate max-w-[68px]">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Header Navigation */}
      <header
        id="desktop-header"
        className="hidden md:flex fixed top-0 left-0 right-0 z-40 bg-[#0c0c0c]/90 backdrop-blur-md border-b border-[#222222] h-16 px-6 items-center justify-between"
      >
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange('home')}>
          <div className="w-8 h-8 rounded-lg bg-[#FF5500] flex items-center justify-center font-black text-black text-lg">
            M
          </div>
          <div>
            <div className="text-white font-extrabold tracking-wider text-base">MINHA ASSESSORIA</div>
            <div className="text-[10px] text-[#AFAFAF] uppercase tracking-widest">Seu treino. Seu ritmo. Sua evolução.</div>
          </div>
        </div>

        <div className="flex items-center space-x-1 bg-[#141414] p-1 rounded-xl border border-[#262626]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`desktop-nav-btn-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#FF5500] text-black font-bold shadow-md shadow-[#FF5500]/20'
                    : 'text-[#AFAFAF] hover:text-white hover:bg-[#202020]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>
    </>
  );
};
