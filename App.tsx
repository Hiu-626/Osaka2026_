
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Ticket, 
  Wallet, 
  Camera, 
  CheckSquare, 
  Users,
  CloudCheck,
  Languages
} from 'lucide-react';
import { MOCK_MEMBERS, MOCK_TRIP_CONFIG } from './constants';
import { TripMember } from './types';
import { translations, Language } from './translations';
import Schedule from './modules/Schedule';
import Bookings from './modules/Bookings';
import Expense from './modules/Expense';
import Journal from './modules/Journal';
import Planning from './modules/Planning';
import Members from './modules/Members';

type Tab = 'schedule' | 'bookings' | 'expense' | 'journal' | 'planning' | 'members';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('appLang') as Language) || 'zh';
  });
  const [lastSync, setLastSync] = useState<string>(new Date().toLocaleTimeString());
  const [members, setMembers] = useState<TripMember[]>(() => {
    const saved = localStorage.getItem('trip_members');
    return saved ? JSON.parse(saved) : MOCK_MEMBERS;
  });
  const [currentUser, setCurrentUser] = useState<TripMember>(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      const exists = members.find(m => m.id === parsed.id);
      return exists || members[0];
    }
    return members[0];
  });
  const [tripConfig, setTripConfig] = useState(MOCK_TRIP_CONFIG);

  const t = translations[lang];

  useEffect(() => {
    const savedTab = localStorage.getItem('activeTab') as Tab;
    if (savedTab) setActiveTab(savedTab);
  }, []);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('appLang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('trip_members', JSON.stringify(members));
    setLastSync(new Date().toLocaleTimeString());
  }, [members]);

  useEffect(() => {
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
  }, [currentUser]);

  const toggleLang = () => {
    setLang(prev => prev === 'zh' ? 'en' : 'zh');
  };

  const handleSwitchUser = (user: TripMember) => {
    setCurrentUser(user);
  };

  const handleAddMember = (name: string, avatar: string) => {
    const newMember: TripMember = { id: Date.now().toString(), name, avatar };
    setMembers([...members, newMember]);
  };

  const handleDeleteMember = (id: string) => {
    if (id === currentUser.id) {
      alert(lang === 'zh' ? "Ohana! 你不能刪除目前正在使用的身分。" : "Ohana! You can't delete your active profile.");
      return;
    }
    if (confirm(lang === 'zh' ? "確定要移除這位成員嗎？這會影響分帳計算。" : "Remove this member? This will affect expense splits.")) {
      setMembers(members.filter(m => m.id !== id));
    }
  };

  const renderContent = () => {
    const commonProps = { lang, t: translations[lang] };
    switch (activeTab) {
      case 'schedule': return <Schedule config={tripConfig} {...commonProps} />;
      case 'bookings': return <Bookings {...commonProps} />;
      case 'expense': return <Expense currentUser={currentUser} members={members} {...commonProps} />;
      case 'journal': return <Journal currentUser={currentUser} members={members} {...commonProps} />;
      case 'planning': return <Planning members={members} {...commonProps} />;
      case 'members': return (
        <Members 
          currentUser={currentUser} 
          members={members} 
          onSwitch={handleSwitchUser} 
          onAdd={handleAddMember}
          onDelete={handleDeleteMember}
          {...commonProps}
        />
      );
      default: return <Schedule config={tripConfig} {...commonProps} />;
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-cream shadow-2xl relative overflow-hidden">
      {/* Top Bar with Language Toggle */}
      <div className="absolute top-0 left-0 right-0 z-[60] px-4 py-2 flex justify-between items-center pointer-events-none">
        <div className="bg-navy/10 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 pointer-events-auto">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          <span className="text-[8px] font-black text-navy/40 uppercase tracking-widest">
            {lastSync}
          </span>
        </div>
        
        <button 
          onClick={toggleLang}
          className="bg-white/80 backdrop-blur-md w-10 h-10 rounded-xl flex items-center justify-center text-stitch sticker-shadow pointer-events-auto active:scale-90 transition-all border border-accent"
        >
          <div className="flex flex-col items-center">
             <Languages size={18} />
             <span className="text-[7px] font-black uppercase">{lang}</span>
          </div>
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-14">
        {renderContent()}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-paper/90 backdrop-blur-lg border-t border-accent px-2 py-3 flex justify-around items-center z-50 rounded-t-3xl shadow-[0_-4px_10px_rgba(0,0,0,0.05)] safe-bottom">
        <NavButton active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} icon={<Calendar size={22} />} label={t.tabs.schedule} />
        <NavButton active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} icon={<Ticket size={22} />} label={t.tabs.bookings} />
        <NavButton active={activeTab === 'expense'} onClick={() => setActiveTab('expense')} icon={<Wallet size={22} />} label={t.tabs.expense} />
        <NavButton active={activeTab === 'journal'} onClick={() => setActiveTab('journal')} icon={<Camera size={22} />} label={t.tabs.journal} />
        <NavButton active={activeTab === 'planning'} onClick={() => setActiveTab('planning')} icon={<CheckSquare size={22} />} label={t.tabs.planning} />
        <NavButton active={activeTab === 'members'} onClick={() => setActiveTab('members')} icon={<Users size={22} />} label={t.tabs.members} />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'text-stitch scale-110' : 'text-navy/30'}`}
  >
    <div className={`p-1.5 rounded-xl transition-colors ${active ? 'bg-stitch/10' : 'bg-transparent'}`}>
      {icon}
    </div>
    <span className={`text-[10px] font-bold uppercase tracking-tighter ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
  </button>
);

export default App;
