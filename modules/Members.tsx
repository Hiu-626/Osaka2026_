
import React, { useState, useRef } from 'react';
import { TripMember, ScheduleItem, Booking, Expense, JournalPost, TripConfig } from '../types';
import { 
  LogOut, 
  Settings, 
  Award, 
  Map as MapIcon, 
  Plus, 
  UserPlus, 
  X, 
  Trash2, 
  Check,
  Sparkles,
  FileDown,
  Loader2
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

const Members: React.FC<MembersProps> = ({ currentUser, members, onSwitch, onAdd, onDelete, lang, t }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('https://picsum.photos/seed/new_member/200');

  const avatarOptions = [
    'https://picsum.photos/seed/stitch/200',
    'https://picsum.photos/seed/donald/200',
    'https://picsum.photos/seed/lilo/200',
    'https://picsum.photos/seed/daisy/200',
    'https://picsum.photos/seed/mickey/200',
    'https://picsum.photos/seed/minnie/200',
    'https://picsum.photos/seed/goofy/200'
  ];

  const handleExportPDF = async () => {
    setIsExporting(true);
    
    // 獲取數據
    const itinerary: ScheduleItem[] = JSON.parse(localStorage.getItem('itinerary') || '[]');
    const expenses: Expense[] = JSON.parse(localStorage.getItem('expenses') || '[]');
    const journalPosts: JournalPost[] = JSON.parse(localStorage.getItem('journal_posts') || '[]');
    const tripConfig: TripConfig = JSON.parse(localStorage.getItem('tripConfig') || '{}');
    const baseCurrency = localStorage.getItem('baseCurrency') || 'JPY';

    const totalSpent = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

    // 過濾重複地點
    const seen = new Set();
    const uniqueStops = itinerary.filter(item => {
      if (seen.has(item.location)) return false;
      seen.add(item.location);
      return true;
    });

    // 建立臨時渲染容器
    const printContainer = document.createElement('div');
    printContainer.style.position = 'fixed';
    printContainer.style.left = '-9999px';
    printContainer.style.width = '800px';
    printContainer.style.backgroundColor = '#F8F9F5';
    printContainer.style.fontFamily = '"PingFang TC", "Microsoft JhengHei", "Heiti TC", sans-serif';
    document.body.appendChild(printContainer);

    const categoryIcons: any = {
      'Attraction': '🎡',
      'Food': '🍱',
      'Transport': '🚃',
      'Stay': '🏨',
      'Other': '✨'
    };

    const categoryNames: any = {
      'Attraction': '景點',
      'Food': '美食',
      'Transport': '交通',
      'Stay': '住宿',
      'Other': '其他'
    };

    // 分頁邏輯：地圖 2 頁，回憶 2 頁
    const mapStopsPage1 = uniqueStops.slice(0, 6);
    const mapStopsPage2 = uniqueStops.slice(6, 12);
    const memoriesPage1 = journalPosts.slice(0, 4);
    const memoriesPage2 = journalPosts.slice(4, 8);

    let htmlContent = `
      <style>
        .pdf-page { padding: 40px; background: #F8F9F5; width: 800px; height: 1131px; box-sizing: border-box; position: relative; overflow: hidden; }
        .stitch-blue { color: #6EC1E4; }
        .donald-yellow { color: #FFD966; }
        .navy-blue { color: #1F3C88; }
        .main-container { border: 12px solid #6EC1E4; border-radius: 60px; height: 100%; padding: 40px; background: white; position: relative; box-sizing: border-box; }
        .badge { background: #FFD966; padding: 10px 30px; border-radius: 20px; font-weight: 900; color: #1F3C88; display: inline-block; box-shadow: 4px 4px 0px #1F3C88; }
        
        /* 地圖樣式 */
        .map-path { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
        .map-stop { position: absolute; background: white; border: 4px solid #1F3C88; border-radius: 20px; padding: 12px 18px; box-shadow: 6px 6px 0px #FFD966; display: flex; align-items: center; gap: 10px; z-index: 5; max-width: 220px; }
        .map-stop-icon { font-size: 24px; }
        .map-stop-text { font-size: 16px; font-weight: 1000; color: #1F3C88; }
        .map-day-badge { position: absolute; top: -15px; left: -10px; background: #6EC1E4; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 1000; }

        /* 財務卡片 */
        .finance-card { background: #1F3C88; border-radius: 40px; padding: 50px; color: white; text-align: center; box-shadow: 12px 12px 0px #FFD966; margin-top: 40px; }
        
        /* 拍立得 */
        .polaroid-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 40px; }
        .polaroid { background: white; padding: 15px 15px 45px 15px; border-radius: 4px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #E0E5D5; transform: rotate(-2deg); }
        .polaroid img { width: 100%; aspect-ratio: 1/1; object-fit: cover; border: 1px solid #eee; margin-bottom: 15px; }
        .polaroid-caption { font-size: 14px; font-weight: 800; color: #1F3C88; text-align: center; }
        .polaroid-author { font-size: 10px; color: #6EC1E4; text-align: center; margin-top: 5px; font-weight: 900; }
      </style>

      <!-- 第 1 頁：封面 (Cover) -->
      <div class="pdf-page">
        <div class="main-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
          <div style="font-size: 150px; margin-bottom: 40px;">🚢</div>
          <h1 style="font-size: 64px; font-weight: 1000; color: #1F3C88; margin: 0;">${tripConfig.tripName || '我們的旅遊日誌'}</h1>
          <div class="badge" style="font-size: 24px; margin-top: 30px;">OHANA 冒險紀錄</div>
          <p style="font-size: 24px; color: #6EC1E4; font-weight: 800; margin-top: 40px;">${tripConfig.region} · ${tripConfig.startDate} 出發</p>
          
          <div style="margin-top: 80px;">
            <p style="font-weight: 1000; color: #1F3C88; opacity: 0.3; text-transform: uppercase; letter-spacing: 5px; margin-bottom: 30px;">冒險夥伴</p>
            <div style="display: flex; gap: 30px; justify-content: center;">
              ${members.map(m => `
                <div style="text-align: center;">
                  <img src="${m.avatar}" style="width: 80px; height: 80px; border-radius: 50%; border: 4px solid #FFD966; background: white;">
                  <p style="font-weight: 1000; color: #1F3C88; margin-top: 10px; font-size: 14px;">${m.name}</p>
                </div>
              `).join('')}
            </div>
          </div>
          <div style="position: absolute; bottom: 40px; right: 50px; font-size: 80px; opacity: 0.1;">💙🦆</div>
        </div>
      </div>

      <!-- 第 2 頁：冒險地圖 P1 -->
      <div class="pdf-page">
        <div class="main-container">
          <div style="display:flex; justify-content: space-between; align-items: center;">
            <h2 style="font-size: 36px; font-weight: 1000; color: #1F3C88; margin: 0;">冒險地圖 (I)</h2>
            <div style="font-size: 40px;">🗺️</div>
          </div>
          <div style="position: relative; height: 800px; margin-top: 40px;">
            <svg class="map-path" viewBox="0 0 700 800">
               <path d="M 100 100 C 400 100 600 300 350 400 S 100 700 500 750" fill="none" stroke="#6EC1E4" stroke-width="8" stroke-dasharray="15,15" opacity="0.4" />
            </svg>
            ${mapStopsPage1.map((stop, i) => {
              const positions = [
                { t: 50, l: 50 }, { t: 80, l: 400 }, { t: 250, l: 450 },
                { t: 400, l: 250 }, { t: 550, l: 50 }, { t: 700, l: 400 }
              ];
              const pos = positions[i];
              return `
                <div class="map-stop" style="top: ${pos.t}px; left: ${pos.l}px;">
                  <div class="map-day-badge">Day ${stop.dayIndex + 1}</div>
                  <span class="map-stop-icon">${categoryIcons[stop.category] || '📍'}</span>
                  <div>
                    <span class="map-stop-text">${stop.location}</span>
                    <p style="font-size: 10px; color: #6EC1E4; margin: 0; font-weight: 900;">${categoryNames[stop.category]}</p>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <div style="position: absolute; bottom: 40px; left: 40px; font-weight: 1000; color: #6EC1E4; font-style: italic;">Donald: "地圖看起來很專業耶！"</div>
        </div>
      </div>

      <!-- 第 3 頁：冒險地圖 P2 -->
      <div class="pdf-page">
        <div class="main-container">
          <div style="display:flex; justify-content: space-between; align-items: center;">
            <h2 style="font-size: 36px; font-weight: 1000; color: #1F3C88; margin: 0;">冒險地圖 (II)</h2>
            <div style="font-size: 40px;">🗺️</div>
          </div>
          <div style="position: relative; height: 800px; margin-top: 40px;">
            <svg class="map-path" viewBox="0 0 700 800">
               <path d="M 500 50 C 200 100 50 300 350 450 S 600 700 100 750" fill="none" stroke="#FFD966" stroke-width="8" stroke-dasharray="15,15" opacity="0.4" />
            </svg>
            ${mapStopsPage2.length > 0 ? mapStopsPage2.map((stop, i) => {
              const positions = [
                { t: 40, l: 400 }, { t: 150, l: 100 }, { t: 350, l: 200 },
                { t: 450, l: 450 }, { t: 650, l: 500 }, { t: 750, l: 150 }
              ];
              const pos = positions[i];
              return `
                <div class="map-stop" style="top: ${pos.t}px; left: ${pos.l}px;">
                  <div class="map-day-badge">Day ${stop.dayIndex + 1}</div>
                  <span class="map-stop-icon">${categoryIcons[stop.category] || '📍'}</span>
                  <div>
                    <span class="map-stop-text">${stop.location}</span>
                    <p style="font-size: 10px; color: #6EC1E4; margin: 0; font-weight: 900;">${categoryNames[stop.category]}</p>
                  </div>
                </div>
              `;
            }).join('') : `<div style="text-align:center; padding-top: 300px; opacity: 0.2; font-size: 24px; font-weight: 1000; color: #1F3C88;">更多的冒險...</div>`}
          </div>
          <div style="position: absolute; bottom: 40px; right: 40px; font-weight: 1000; color: #FFD966; font-style: italic;">Stitch: "Meega nala kweesta!" (我們要出發了！)</div>
        </div>
      </div>

      <!-- 第 4 頁：財務結算 (Finance) -->
      <div class="pdf-page">
        <div class="main-container">
          <h2 style="font-size: 36px; font-weight: 1000; color: #1F3C88; border-bottom: 6px solid #FFD966; display: inline-block;">財務結算報告</h2>
          
          <div class="finance-card">
            <p style="font-size: 18px; font-weight: 1000; opacity: 0.7; letter-spacing: 3px; margin-bottom: 10px;">旅程總支出估算</p>
            <h3 style="font-size: 72px; font-weight: 1000; margin: 0;">${baseCurrency} ${totalSpent.toLocaleString()}</h3>
            <div style="margin-top: 20px; font-size: 14px; opacity: 0.5;">平均每人支出：${baseCurrency} ${Math.round(totalSpent / (members.length || 1)).toLocaleString()}</div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px;">
            <div>
              <h4 style="font-size: 20px; font-weight: 1000; color: #1F3C88; margin-bottom: 20px;">💰 各項比例分析</h4>
              <div style="background: #F8F9F5; border-radius: 25px; padding: 25px; border: 2px solid #E0E5D5;">
                ${['Food', 'Attraction', 'Stay', 'Transport', 'Other'].map(cat => {
                  const amt = expenses.filter(e => e.category === cat).reduce((acc, e) => acc + e.amount, 0);
                  const perc = totalSpent > 0 ? (amt / totalSpent * 100).toFixed(0) : 0;
                  return `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px; align-items: center;">
                      <span style="font-weight: 1000; color: #1F3C88; font-size: 14px;">${categoryIcons[cat]} ${categoryNames[cat]}</span>
                      <span style="font-weight: 1000; color: #6EC1E4; font-size: 14px;">${perc}%</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
            <div>
              <h4 style="font-size: 20px; font-weight: 1000; color: #1F3C88; margin-bottom: 20px;">👪 成員預付統計</h4>
              <div style="background: #F8F9F5; border-radius: 25px; padding: 25px; border: 2px solid #E0E5D5;">
                ${members.map(m => {
                  const paid = expenses.filter(e => e.paidBy === m.id).reduce((acc, e) => acc + e.amount, 0);
                  return `
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
                      <img src="${m.avatar}" style="width: 32px; height: 32px; border-radius: 50%;">
                      <div style="flex:1; display:flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 1000; color: #1F3C88; font-size: 14px;">${m.name}</span>
                        <span style="font-weight: 1000; color: #1F3C88; font-size: 14px;">${paid.toLocaleString()}</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
          <div style="margin-top: 50px; text-align: center; font-weight: 900; color: #1F3C88; font-style: italic; opacity: 0.4;">"Ohana 代表家人，家人代表錢不會不見，只是變成喜歡的樣子。"</div>
        </div>
      </div>

      <!-- 第 5 頁：回憶牆 P1 (Memories) -->
      <div class="pdf-page">
        <div class="main-container">
          <h2 style="font-size: 36px; font-weight: 1000; color: #1F3C88; border-bottom: 6px solid #6EC1E4; display: inline-block;">回憶拍立得 (I)</h2>
          <div class="polaroid-grid">
            ${memoriesPage1.map(post => `
              <div class="polaroid">
                ${post.imageUrl ? `<img src="${post.imageUrl}">` : `<div style="width:100%; aspect-ratio:1/1; background:#F8F9F5; display:flex; align-items:center; justify-content:center; font-size:60px;">📸</div>`}
                <div class="polaroid-caption">${post.content.substring(0, 30)}...</div>
                <div class="polaroid-author">@${members.find(m => m.id === post.authorId)?.name || 'Ohana'} · ${post.date}</div>
              </div>
            `).join('')}
            ${memoriesPage1.length === 0 ? `<div style="grid-column: span 2; text-align:center; padding-top: 200px; opacity: 0.1; font-size: 32px; font-weight: 1000;">尚未紀錄任何冒險...</div>` : ''}
          </div>
        </div>
      </div>

      <!-- 第 6 頁：回憶牆 P2 (Memories) -->
      <div class="pdf-page">
        <div class="main-container">
          <h2 style="font-size: 36px; font-weight: 1000; color: #1F3C88; border-bottom: 6px solid #6EC1E4; display: inline-block;">回憶拍立得 (II)</h2>
          <div class="polaroid-grid" style="margin-top: 40px;">
            ${memoriesPage2.map(post => `
              <div class="polaroid" style="transform: rotate(2deg);">
                ${post.imageUrl ? `<img src="${post.imageUrl}">` : `<div style="width:100%; aspect-ratio:1/1; background:#F8F9F5; display:flex; align-items:center; justify-content:center; font-size:60px;">📸</div>`}
                <div class="polaroid-caption">${post.content.substring(0, 30)}...</div>
                <div class="polaroid-author">@${members.find(m => m.id === post.authorId)?.name || 'Ohana'} · ${post.date}</div>
              </div>
            `).join('')}
            ${memoriesPage2.length === 0 && memoriesPage1.length > 0 ? `<div style="grid-column: span 2; text-align:center; padding-top: 200px; opacity: 0.1; font-size: 32px; font-weight: 1000;">更多回憶等待填滿...</div>` : ''}
          </div>
          <div style="position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%); text-align: center; width: 80%;">
            <div style="font-size: 80px; margin-bottom: 20px;">🌺</div>
            <p style="font-size: 24px; font-weight: 1000; color: #1F3C88; margin: 0;">旅程雖然結束，Ohana 的冒險永不停止！</p>
            <p style="font-size: 14px; font-weight: 900; color: #6EC1E4; margin-top: 10px;">OHANA TRIP PLANNER © 2025</p>
          </div>
        </div>
      </div>
    `;

    printContainer.innerHTML = htmlContent;

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pages = printContainer.querySelectorAll('.pdf-page');

      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i] as HTMLElement, { 
          useCORS: true, 
          scale: 2,
          logging: false,
          backgroundColor: '#F8F9F5',
          fontFamily: '"PingFang TC", "Microsoft JhengHei", sans-serif'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }
      
      pdf.save(`Ohana_Trip_Report_${tripConfig.tripName || 'Memories'}.pdf`);
    } catch (e) {
      console.error("PDF Export failed", e);
      alert(lang === 'zh' ? "報告導出失敗，請檢查網路連接後再試一次。" : "Export failed. Please check your connection.");
    } finally {
      document.body.removeChild(printContainer);
      setIsExporting(false);
    }
  };

  const handleAddSubmit = () => {
    if (newName.trim()) {
      onAdd(newName.trim(), selectedAvatar);
      setNewName('');
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="text-center py-4 bg-white/40 rounded-3xl-sticker p-6 border border-white/60 sticker-shadow">
        <div className="relative inline-block">
          <div className="w-32 h-32 rounded-full border-4 border-donald sticker-shadow overflow-hidden mb-4 p-1 bg-white">
            <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full rounded-full object-cover" />
          </div>
          <div className="absolute bottom-4 right-0 w-10 h-10 bg-stitch text-white rounded-full flex items-center justify-center border-4 border-paper sticker-shadow animate-pulse">
            <Sparkles size={18} />
          </div>
        </div>
        <h2 className="text-3xl font-black text-navy">{currentUser.name}</h2>
        <p className="text-[10px] font-black text-navy/30 uppercase tracking-[0.2em] mt-1">{t.members.active}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div className="bg-white p-4 rounded-xl-sticker sticker-shadow border border-accent flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-stitch/10 text-stitch rounded-full flex items-center justify-center mb-2">
               <Award size={20} />
            </div>
            <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">Badges</p>
            <p className="text-sm font-black text-navy">12 Collected</p>
         </div>
         <div className="bg-white p-4 rounded-xl-sticker sticker-shadow border border-accent flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-donald/10 text-donald rounded-full flex items-center justify-center mb-2">
               <MapIcon size={20} />
            </div>
            <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">Visited</p>
            <p className="text-sm font-black text-navy">4 Spots</p>
         </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-sm font-black text-navy uppercase tracking-[0.2em]">{t.members.tripOhana}</h3>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="p-2 bg-stitch/10 text-stitch rounded-full hover:bg-stitch hover:text-white transition-all active:scale-90"
          >
            <UserPlus size={18} />
          </button>
        </div>
        
        <div className="space-y-3">
          {members.map((member) => (
            <div 
              key={member.id}
              className={`w-full p-4 rounded-xl-sticker sticker-shadow border-2 flex items-center gap-4 transition-all group ${
                currentUser.id === member.id ? 'bg-stitch/5 border-stitch' : 'bg-white border-accent'
              }`}
            >
              <button 
                onClick={() => onSwitch(member)}
                className="flex flex-1 items-center gap-4 text-left"
              >
                <div className={`relative w-12 h-12 rounded-full border-2 overflow-hidden flex-shrink-0 ${currentUser.id === member.id ? 'border-stitch' : 'border-accent'}`}>
                  <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                  {currentUser.id === member.id && (
                    <div className="absolute inset-0 bg-stitch/20 flex items-center justify-center">
                      <Check size={20} className="text-white drop-shadow-md" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-navy text-sm">{member.name}</h4>
                  <p className="text-[9px] font-bold text-navy/30 uppercase tracking-wider">
                    {currentUser.id === member.id ? (lang === 'zh' ? '正在使用' : 'Active Profile') : (lang === 'zh' ? '點擊切換身分' : 'Switch to Profile')}
                  </p>
                </div>
              </button>
              
              {member.id !== currentUser.id && (
                <button 
                  onClick={() => onDelete(member.id)}
                  className="p-2 text-navy/10 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-accent/40">
        <button 
          onClick={handleExportPDF}
          disabled={isExporting}
          className="w-full py-5 bg-navy text-white font-black rounded-2xl-sticker sticker-shadow flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl disabled:opacity-50"
        >
          {isExporting ? <Loader2 size={24} className="animate-spin" /> : <FileDown size={24} />}
          <div className="text-left">
            <p className="text-xs uppercase tracking-widest leading-none">導出冒險報告 (PDF)</p>
            <p className="text-[9px] font-bold opacity-40 uppercase mt-1">
              史迪奇與唐老鴨陪你紀錄回憶 (6 頁完整版)
            </p>
          </div>
        </button>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-navy/20 backdrop-blur-sm animate-in fade-in" onClick={() => setIsAddModalOpen(false)}>
          <div className="bg-paper w-full max-w-sm rounded-3xl-sticker p-6 sticker-shadow border-4 border-stitch animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-navy uppercase tracking-widest">{t.members.newTraveler}</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-cream rounded-full text-navy/40"><X size={20} /></button>
            </div>
            
            <div className="space-y-6">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full border-4 border-stitch overflow-hidden mb-4 p-1 bg-white sticker-shadow">
                  <img src={selectedAvatar} alt="preview" className="w-full h-full rounded-full object-cover" />
                </div>
                <div className="flex gap-2 overflow-x-auto w-full pb-2 scrollbar-hide">
                  {avatarOptions.map((av, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setSelectedAvatar(av)}
                      className={`flex-shrink-0 w-10 h-10 rounded-full border-2 transition-all ${selectedAvatar === av ? 'border-stitch scale-110' : 'border-transparent opacity-50'}`}
                    >
                      <img src={av} alt="option" className="w-full h-full rounded-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-cream p-4 rounded-2xl border border-accent">
                <label className="text-[10px] font-black uppercase text-navy/30 mb-1 block tracking-widest">{lang === 'zh' ? '成員姓名' : 'Member Name'}</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Lilo"
                  className="w-full bg-transparent border-none p-0 font-black text-navy text-lg focus:ring-0 placeholder:text-navy/10"
                />
              </div>

              <button 
                onClick={handleAddSubmit}
                disabled={!newName.trim()}
                className="w-full py-4 bg-stitch text-white font-black rounded-xl-sticker sticker-shadow active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                {t.members.join}
              </button>
            </div>
          </div>
        </div>
      )}

      <button className="w-full py-4 text-red-300 font-black flex items-center justify-center gap-2 mt-4 active:scale-95 transition-all text-xs tracking-widest uppercase">
        <LogOut size={16} />
        {t.members.leave}
      </button>
    </div>
  );
};

export default Members;
