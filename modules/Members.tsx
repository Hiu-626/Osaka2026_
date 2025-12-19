
import React, { useState, useRef } from 'react';
import { TripMember, ScheduleItem, Booking, Expense, JournalPost, TripConfig } from '../types';
import { 
  LogOut, 
  Plus, 
  UserPlus, 
  X, 
  Trash2, 
  FileDown, 
  Loader2, 
  Upload, 
  Edit2
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface MembersProps {
  currentUser: TripMember;
  members: TripMember[];
  onSwitch: (user: TripMember) => void;
  onAdd: (name: string, avatar: string) => void;
  onDelete: (id: string) => void;
  lang: string;
  t: any;
}

// 超可愛卡通人偶組件 - 重新設計比例與走路動態
const CharacterAvatar: React.FC<{ src: string; size?: 'sm' | 'md' | 'lg'; isStitchTheme?: boolean }> = ({ src, size = 'md', isStitchTheme = true }) => {
  const sizeMap = {
    sm: { head: 'w-14 h-14', body: 'w-6 h-5', limb: 'w-2 h-3.5', offset: '-mt-2', legGap: 'gap-1.5', armX: 'left-[22%]' },
    md: { head: 'w-28 h-28', body: 'w-10 h-8', limb: 'w-3 h-5.5', offset: '-mt-4', legGap: 'gap-3', armX: 'left-[28%]' },
    lg: { head: 'w-40 h-40', body: 'w-16 h-12', limb: 'w-5 h-8', offset: '-mt-6', legGap: 'gap-5', armX: 'left-[32%]' }
  };

  const s = sizeMap[size];
  const limbColor = isStitchTheme ? 'bg-stitch' : 'bg-donald';

  return (
    <div className="relative animate-waddle flex flex-col items-center">
      {/* 1. 頭部 - 最高層 (z-30) */}
      <div className={`${s.head} rounded-full border-4 ${isStitchTheme ? 'border-stitch' : 'border-donald'} overflow-hidden bg-white relative z-30 p-0.5`}>
        <img src={src} alt="avatar" className="w-full h-full rounded-full object-cover" />
      </div>

      {/* 2. 肢體與軀幹容器 (z-20) */}
      <div className={`relative ${s.offset} flex flex-col items-center z-20 w-full`}>
        
        {/* 2a. 手部 - 中層 (z-25) 在身體前，頭後 */}
        {/* 左手 */}
        <div 
          className={`absolute ${s.armX} top-1 ${s.limb} ${limbColor} rounded-full animate-hand-left border-2 border-white sticker-shadow z-[25]`}
          style={{ transformOrigin: 'top center' }}
        ></div>
        {/* 右手 */}
        <div 
          className={`absolute right-[${s.armX.match(/\d+/)?.[0]}%] top-1 ${s.limb} ${limbColor} rounded-full animate-hand-right border-2 border-white sticker-shadow z-[25]`}
          style={{ right: s.armX, transformOrigin: 'top center' }}
        ></div>

        {/* 2b. 身體軀幹 (z-20) */}
        <div className={`${s.body} ${limbColor} rounded-b-[2rem] border-x-2 border-b-2 border-white sticker-shadow relative overflow-hidden z-20 mx-auto`}>
           <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20"></div>
        </div>

        {/* 2c. 雙腳 - 底層 (z-10) 模擬可愛踏步 */}
        <div className={`flex ${s.legGap} mt-[-6px] relative z-10`}>
          <div className={`${s.limb} ${limbColor} rounded-full animate-foot-left border-2 border-white sticker-shadow`}></div>
          <div className={`${s.limb} ${limbColor} rounded-full animate-foot-right border-2 border-white sticker-shadow`}></div>
        </div>
      </div>
    </div>
  );
};

const Members: React.FC<MembersProps> = ({ currentUser, members, onSwitch, onAdd, onDelete, lang, t }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TripMember | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('https://picsum.photos/seed/stitch/200');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarOptions = [
    'https://picsum.photos/seed/stitch/200',
    'https://picsum.photos/seed/donald/200',
    'https://picsum.photos/seed/lilo/200',
    'https://picsum.photos/seed/daisy/200',
    'https://picsum.photos/seed/mickey/200',
    'https://picsum.photos/seed/minnie/200'
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setEditingMember(null);
    setNewName('');
    setSelectedAvatar(avatarOptions[0]);
    setIsModalOpen(true);
  };

  const openEditModal = (member: TripMember) => {
    setEditingMember(member);
    setNewName(member.name);
    setSelectedAvatar(member.avatar);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!newName.trim()) return;
    
    if (editingMember) {
      const updatedMembers = members.map(m => 
        m.id === editingMember.id ? { ...m, name: newName, avatar: selectedAvatar } : m
      );
      localStorage.setItem('trip_members', JSON.stringify(updatedMembers));
      window.location.reload(); 
    } else {
      onAdd(newName.trim(), selectedAvatar);
    }
    
    setIsModalOpen(false);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    setTimeout(() => setIsExporting(false), 1500);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 pt-8">
      {/* 目前使用者卡片 - 主視覺 */}
      <div className="text-center py-12 bg-paper rounded-3xl-sticker p-6 border-2 border-accent sticker-shadow relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-stitch/5 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-donald/5 rounded-full blur-2xl"></div>
        
        <div className="mb-14 transform transition-all hover:scale-[1.05]">
          <CharacterAvatar src={currentUser.avatar} size="lg" isStitchTheme={true} />
        </div>
        
        <div className="relative z-10 pt-4">
          <h2 className="text-3xl font-black text-navy">{currentUser.name}</h2>
          <div className="inline-block px-3 py-1 bg-stitch/10 rounded-full mt-2">
            <p className="text-[10px] font-black text-stitch uppercase tracking-[0.2em]">{t.members.active}</p>
          </div>
        </div>
      </div>

      {/* 成員列表 */}
      <div className="space-y-5">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-sm font-black text-navy uppercase tracking-[0.2em] flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-donald rounded-full"></div>
             {t.members.tripOhana}
          </h3>
          <button onClick={openAddModal} className="p-2.5 bg-stitch text-white rounded-full hover:bg-navy transition-all active:scale-90 shadow-md">
            <UserPlus size={18} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 gap-5">
          {members.map((member) => (
            <div key={member.id} className={`w-full p-4 rounded-xl-sticker sticker-shadow border-2 flex items-center gap-5 transition-all group ${currentUser.id === member.id ? 'bg-stitch/5 border-stitch shadow-[4px_4px_0px_#6EC1E4]' : 'bg-white border-accent'}`}>
              <button onClick={() => onSwitch(member)} className="flex flex-1 items-center gap-5 text-left">
                <div className="transform transition-transform">
                  <CharacterAvatar src={member.avatar} size="sm" isStitchTheme={currentUser.id === member.id} />
                </div>
                <div className="flex-1 ml-4">
                  <h4 className="font-black text-navy text-sm leading-tight">{member.name}</h4>
                  <p className="text-[8px] font-bold text-navy/20 uppercase tracking-widest mt-1">
                    {currentUser.id === member.id ? 'Active Planner' : 'Switch to Profile'}
                  </p>
                </div>
              </button>
              
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => openEditModal(member)} className="p-2 bg-cream text-navy/40 hover:text-stitch rounded-full transition-colors"><Edit2 size={14} /></button>
                {member.id !== currentUser.id && (
                  <button onClick={() => onDelete(member.id)} className="p-2 bg-cream text-navy/40 hover:text-red-400 rounded-full transition-colors"><Trash2 size={14} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PDF 導出與底部操作 */}
      <div className="pt-6 border-t border-accent/40 space-y-4">
        <button onClick={handleExportPDF} disabled={isExporting} className="w-full py-5 bg-navy text-white font-black rounded-2xl-sticker sticker-shadow flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl disabled:opacity-50">
          {isExporting ? <Loader2 size={24} className="animate-spin" /> : <FileDown size={24} />}
          <div className="text-left">
            <p className="text-xs uppercase tracking-widest leading-none">{t.members.export}</p>
            <p className="text-[9px] font-bold opacity-40 uppercase mt-1 tracking-tighter">生成專屬冒險紀錄手冊 (6 頁)</p>
          </div>
        </button>

        <button className="w-full py-4 text-red-300/40 font-black flex items-center justify-center gap-2 active:scale-95 transition-all text-[9px] tracking-[0.4em] uppercase hover:text-red-400">
          <LogOut size={14} />{t.members.leave}
        </button>
      </div>

      {/* 新增/編輯成員 Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-navy/20 backdrop-blur-sm animate-in fade-in" onClick={() => setIsModalOpen(false)}>
          <div className="bg-paper w-full max-w-sm rounded-3xl-sticker p-8 sticker-shadow border-4 border-stitch animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-lg font-black text-navy uppercase tracking-widest leading-none">{editingMember ? '編輯成員' : '新探險家'}</h3>
                <p className="text-[9px] font-bold text-navy/20 uppercase mt-2 tracking-widest">Ohana means family</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-cream rounded-full text-navy/40 hover:text-red-400 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="space-y-10">
              <div className="flex flex-col items-center">
                <div className="mb-14 transform transition-transform hover:rotate-3">
                  <CharacterAvatar src={selectedAvatar} size="md" isStitchTheme={true} />
                </div>
                
                <div className="flex gap-2 overflow-x-auto w-full pb-4 scrollbar-hide px-1">
                  <button onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-dashed border-accent flex items-center justify-center bg-cream text-navy/40 hover:text-stitch hover:border-stitch transition-all">
                    <Upload size={20} />
                  </button>
                  {avatarOptions.map((av, idx) => (
                    <button key={idx} onClick={() => setSelectedAvatar(av)} className={`flex-shrink-0 w-12 h-12 rounded-full border-2 transition-all ${selectedAvatar === av ? 'border-stitch scale-110 shadow-md ring-4 ring-stitch/10' : 'border-transparent opacity-40'}`}>
                      <img src={av} alt="option" className="w-full h-full rounded-full object-cover" />
                    </button>
                  ))}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </div>
              </div>

              <div className="bg-cream p-5 rounded-2xl border-2 border-accent focus-within:border-stitch transition-colors">
                <label className="text-[10px] font-black uppercase text-navy/20 mb-1 block tracking-[0.2em]">旅行者代號</label>
                <input autoFocus type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="輸入名字..." className="w-full bg-transparent border-none p-0 font-black text-navy text-2xl focus:ring-0 placeholder:text-navy/10" />
              </div>

              <button onClick={handleSave} disabled={!newName.trim()} className="w-full py-5 bg-stitch text-white font-black rounded-xl-sticker sticker-shadow active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none uppercase tracking-[0.2em] text-xs shadow-lg">
                {editingMember ? '更新成員資料' : '加入冒險隊伍'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
