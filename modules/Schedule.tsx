
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MapPin, 
  Clock, 
  Sun, 
  CloudRain,
  Settings, 
  Plus, 
  X, 
  ChevronRight, 
  Navigation,
  Trash2,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  Edit2,
  CloudSun,
  CloudLightning,
  Wind
} from 'lucide-react';
import { TripConfig, ScheduleItem, Category } from '../types';
import { COLORS } from '../constants';
import { GoogleGenAI } from "@google/genai";

interface WeatherData {
  temp: string;
  condition: string;
  humidity: string;
  rainProb: string;
  source: string;
  officialSource?: string;
}

interface ScheduleProps {
  config: TripConfig;
  lang: string;
  t: any;
}

const INITIAL_ITINERARY: ScheduleItem[] = [
  // Day 1: 2/4 (Arrival + Namba)
  { id: 'd1-1', dayIndex: 0, time: '10:00', title: '抵達', location: '關西機場 (KIX)', category: 'Transport', distanceInfo: '抵達一航廈' },
  { id: 'd1-2', dayIndex: 0, time: '12:00', title: '移動', location: '南海電鐵 (往難波)', category: 'Transport', distanceInfo: '約 45 分鐘' },
  { id: 'd1-3', dayIndex: 0, time: '15:00', title: '入住', location: 'HOTEL AMANEK', category: 'Stay', distanceInfo: '難波站附近' },
  { id: 'd1-4', dayIndex: 0, time: '18:30', title: '晚餐', location: '牛舌の檸檬 (檸檬牛舌)', category: 'Food', distanceInfo: '步行 5 分' },
  { id: 'd1-5', dayIndex: 0, time: '20:00', title: '逛街', location: '道頓堀 / 心齋橋 / 美國村', category: 'Attraction', distanceInfo: '自由活動' },
  
  // Day 2: 2/5 (Market Day)
  { id: 'd2-1', dayIndex: 1, time: '09:00', title: '早市', location: '木津市場 (海鮮丼)', category: 'Food', distanceInfo: '地鐵至北區' },
  { id: 'd2-2', dayIndex: 1, time: '13:00', title: '商店街', location: '天滿市場 + 天神橋筋商店街', category: 'Attraction', distanceInfo: '掃貨' },
  { id: 'd2-3', dayIndex: 1, time: '18:00', title: '壽司', location: '魚心壽司', category: 'Food', distanceInfo: '大件抵食' }
];

const Schedule: React.FC<ScheduleProps> = ({ config: initialConfig, lang, t }) => {
  const [config, setConfig] = useState<TripConfig>(() => {
    const saved = localStorage.getItem('tripConfig');
    return saved ? JSON.parse(saved) : initialConfig;
  });

  const [itinerary, setItinerary] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem('itinerary');
    return saved ? JSON.parse(saved) : INITIAL_ITINERARY;
  });

  const [selectedDay, setSelectedDay] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  useEffect(() => {
    localStorage.setItem('tripConfig', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('itinerary', JSON.stringify(itinerary));
  }, [itinerary]);

  const countdown = useMemo(() => {
    const start = new Date(config.startDate).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [config.startDate]);

  const days = useMemo(() => {
    return Array.from({ length: config.duration }, (_, i) => {
      const d = new Date(config.startDate);
      d.setDate(d.getDate() + i);
      return {
        index: i,
        date: d.toLocaleDateString(lang === 'zh' ? 'zh-TW' : 'en-US', { month: 'short', day: 'numeric' }),
        weekday: d.toLocaleDateString(lang === 'zh' ? 'zh-TW' : 'en-US', { weekday: 'short' })
      };
    });
  }, [config.startDate, config.duration, lang]);

  const fetchWeather = async () => {
    if (!config.region) return;
    setLoadingWeather(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Search for the latest real-time current weather in ${config.region} using official local meteorological agency sources (e.g., JMA if in Japan). Provide temperature, condition, humidity, and precipitation probability. Translate results to ${lang === 'zh' ? '繁體中文' : 'English'}. Also specify the official agency name used as a source.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
      });
      
      const text = response.text || "";
      const temp = (text.match(/(\d+°C)/) || ["--°C"])[0];
      const condition = (text.match(/(Sunny|Cloudy|Rain|Overcast|Clear|晴|陰|雨|多雲|雷雨|陣雨)/i) || ["Sunny"])[0];
      const humidity = (text.match(/(\d+%\s*(humidity|濕度))/i) || ["--% 濕度"])[0].split(' ')[0];
      const rain = (text.match(/(\d+%\s*(rain|降雨))/i) || ["--% 降雨"])[0].split(' ')[0];
      const official = (text.match(/(JMA|Meteorological|氣象廳|氣象局|Observatory)/i) || ["Local Agency"])[0];

      setWeather({ 
        temp, 
        condition, 
        humidity, 
        rainProb: rain, 
        source: "Real-time",
        officialSource: official
      });
    } catch (e) {
      console.error("Weather fetch failed", e);
      setWeather({ temp: "--°C", condition: "Sunny", humidity: "--%", rainProb: "--%", source: "Offline" });
    } finally {
      setLoadingWeather(false);
    }
  };

  useEffect(() => { fetchWeather(); }, [config.region, lang]);

  const dayItems = useMemo(() => 
    itinerary
      .filter(item => item.dayIndex === selectedDay)
      .sort((a, b) => a.time.localeCompare(b.time)),
  [itinerary, selectedDay]);

  const deleteItem = (id: string) => {
    if (confirm(t.common.delete + '?')) {
      setItinerary(itinerary.filter(i => i.id !== id));
    }
  };

  const handleSaveItem = (itemData: Omit<ScheduleItem, 'id' | 'dayIndex'>) => {
    if (editingItem) {
      setItinerary(itinerary.map(i => i.id === editingItem.id ? { ...itemData, id: editingItem.id, dayIndex: selectedDay } : i));
    } else {
      const newItem: ScheduleItem = { ...itemData, id: Date.now().toString(), dayIndex: selectedDay };
      setItinerary([...itinerary, newItem]);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const renderWeatherIcon = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes('rain') || c.includes('雨')) return <CloudRain size={32} />;
    if (c.includes('cloud') || c.includes('陰') || c.includes('多雲')) return <CloudSun size={32} />;
    if (c.includes('storm') || c.includes('雷')) return <CloudLightning size={32} />;
    return <Sun size={32} />;
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="bg-stitch text-white p-6 rounded-2xl-sticker sticker-shadow flex justify-between items-center relative overflow-hidden border-2 border-white/20">
        <div className="z-10">
          <p className="text-[10px] font-black opacity-70 uppercase tracking-[0.3em] mb-1">{t.schedule.startsIn}</p>
          <h2 className="text-4xl font-black">{countdown} {t.schedule.days}</h2>
        </div>
        <div className="text-6xl opacity-20 absolute -right-2 -bottom-2 transform rotate-12">🏝️</div>
      </div>

      {/* 官方即時天氣卡片 */}
      <div className="bg-white p-5 rounded-2xl-sticker sticker-shadow border border-accent flex items-center justify-between relative overflow-hidden group">
        <div className="z-10 flex items-center gap-4">
          <div className="w-16 h-16 bg-donald/20 rounded-full flex items-center justify-center text-donald sticker-shadow border-2 border-white">
            {weather ? renderWeatherIcon(weather.condition) : <RefreshCw size={32} className="animate-spin" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black text-navy/40 uppercase tracking-widest">{config.region}</p>
              <span className="text-[8px] px-1.5 py-0.5 bg-green-100 text-green-600 rounded-md font-black uppercase">{weather?.source || 'LIVE'}</span>
            </div>
            <h2 className="text-3xl font-black text-navy">{weather?.temp || '--'}</h2>
            <p className="text-xs font-bold text-navy/60">{weather?.condition || '同步中...'}</p>
          </div>
        </div>
        <div className="text-right z-10 border-l border-accent pl-4 flex flex-col justify-between h-full">
          <div>
            <div className="mb-1">
              <p className="text-[8px] font-black opacity-30 uppercase">{t.schedule.humidity}</p>
              <p className="text-xs font-bold text-stitch">{weather?.humidity || '--'}</p>
            </div>
            <div>
              <p className="text-[8px] font-black opacity-30 uppercase">{t.schedule.rainProb}</p>
              <p className="text-xs font-bold text-stitch">{weather?.rainProb || '--'}</p>
            </div>
          </div>
          {weather?.officialSource && (
            <div className="mt-2 text-[7px] font-black text-navy/20 uppercase">
              來源: {weather.officialSource}
            </div>
          )}
        </div>
        {loadingWeather && <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px] z-20"><RefreshCw className="animate-spin text-stitch" /></div>}
        <button onClick={fetchWeather} className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-navy/20"><RefreshCw size={12} /></button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide snap-x -mx-4 px-4">
        {days.map((day) => (
          <button
            key={day.index}
            onClick={() => setSelectedDay(day.index)}
            className={`flex-shrink-0 w-16 py-3 rounded-xl-sticker border-2 transition-all flex flex-col items-center snap-center ${
              selectedDay === day.index ? 'bg-donald border-white text-navy sticker-shadow scale-105' : 'bg-paper border-accent opacity-50 text-navy'
            }`}
          >
            <p className="text-[10px] font-black uppercase leading-none mb-1 opacity-60">{day.weekday}</p>
            <p className="text-xl font-black leading-none">{day.date.split('/')[1] || day.date.split(' ')[1]}</p>
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {dayItems.length > 0 ? dayItems.map((item, idx) => {
          const prevItem = idx > 0 ? dayItems[idx - 1] : null;

          return (
            <div key={item.id} className="relative z-10 transition-all duration-300">
              {prevItem && (
                <div className="flex justify-center -my-3 mb-4 relative z-0">
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(prevItem.location)}&destination=${encodeURIComponent(item.location)}`}
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2 bg-cream border border-accent rounded-full text-[10px] font-black text-navy/60 hover:bg-stitch hover:text-white transition-all sticker-shadow"
                  >
                    <Navigation size={12} className="text-stitch" />
                    <span>{item.distanceInfo || (lang === 'zh' ? '查看路線' : 'Routes')}</span>
                    <ArrowRight size={12} />
                  </a>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="flex-1 bg-paper p-5 rounded-xl-sticker sticker-shadow border border-accent relative group">
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                      className="p-2 bg-cream rounded-full text-navy/30 hover:text-stitch transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => deleteItem(item.id)}
                      className="p-2 bg-cream rounded-full text-navy/30 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-2xl font-black text-navy tracking-tight">{item.time}</div>
                    <span className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider text-white shadow-sm" style={{ backgroundColor: COLORS[item.category.toLowerCase() as keyof typeof COLORS] || COLORS.stitch }}>
                      {item.category}
                    </span>
                  </div>
                  
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin size={16} className="text-stitch flex-shrink-0" />
                        <h3 className="text-xl font-black text-navy leading-tight truncate">{item.location}</h3>
                      </div>
                    </div>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`} target="_blank" className="p-3 bg-stitch/5 text-stitch rounded-xl active:scale-90 transition-transform flex-shrink-0">
                      <Navigation size={18} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="py-20 text-center opacity-30 flex flex-col items-center bg-paper/50 rounded-2xl border-2 border-dashed border-accent">
            <Plus size={40} className="mb-2" />
            <p className="font-black text-lg">{t.schedule.emptyDay}</p>
            <p className="text-sm font-bold">{t.schedule.tapToAdd}</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-24 right-6 flex flex-col gap-3 z-50">
        <button onClick={() => setIsSettingsOpen(true)} className="w-12 h-12 bg-white text-navy rounded-full sticker-shadow border border-accent flex items-center justify-center active:scale-90 shadow-lg"><Settings size={20} /></button>
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="w-14 h-14 bg-donald text-navy rounded-full sticker-shadow border-2 border-paper flex items-center justify-center active:scale-95 shadow-xl"><Plus size={32} /></button>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-navy/20 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}>
          <div className="bg-paper w-full max-sm rounded-2xl-sticker p-6 sticker-shadow border-2 border-accent relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black text-navy mb-6">{t.schedule.settings}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-navy/40 block mb-1">{t.schedule.region}</label>
                <input type="text" value={config.region} onChange={e => setConfig({...config, region: e.target.value})} className="w-full p-3 bg-cream rounded-xl font-bold border border-accent" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-navy/40 block mb-1">{t.schedule.startDate}</label>
                  <input type="date" value={config.startDate} onChange={e => setConfig({...config, startDate: e.target.value})} className="w-full p-3 bg-cream rounded-xl font-bold border border-accent text-xs" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-navy/40 block mb-1">{t.schedule.days}</label>
                  <input type="number" value={config.duration} onChange={e => setConfig({...config, duration: parseInt(e.target.value) || 1})} className="w-full p-3 bg-cream rounded-xl font-bold border border-accent" />
                </div>
              </div>
            </div>
            <button onClick={() => setIsSettingsOpen(false)} className="w-full mt-8 py-4 bg-stitch text-white font-black rounded-xl-sticker sticker-shadow uppercase text-xs tracking-widest">{t.common.save}</button>
          </div>
        </div>
      )}

      {isModalOpen && <ScheduleItemModal initialItem={editingItem} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} onSave={handleSaveItem} t={t} />}
    </div>
  );
};

const ScheduleItemModal: React.FC<{ initialItem: ScheduleItem | null; onClose: () => void; onSave: (item: any) => void; t: any }> = ({ initialItem, onClose, onSave, t }) => {
  const [formData, setFormData] = useState({
    time: initialItem?.time || '12:00', 
    title: initialItem?.title || 'Stop', 
    location: initialItem?.location || '', 
    category: (initialItem?.category || 'Attraction') as Category, 
    notes: initialItem?.notes || '', 
    distanceInfo: initialItem?.distanceInfo || '' 
  });
  
  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-cream animate-in slide-in-from-bottom duration-300">
      <div className="p-4 flex justify-between items-center border-b border-accent bg-paper">
        <button onClick={onClose} className="text-navy/40"><X size={24} /></button>
        <h3 className="text-lg font-black text-navy uppercase tracking-widest">{initialItem ? t.schedule.editStop : t.schedule.addStop}</h3>
        <button onClick={() => onSave(formData)} className="text-stitch font-black" disabled={!formData.location}>{t.common.done}</button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="bg-paper p-4 rounded-xl border border-accent sticker-shadow">
          <label className="text-[10px] font-black uppercase text-navy/40 mb-1 block">{t.schedule.location}</label>
          <div className="flex items-center gap-2">
            <MapPin size={20} className="text-stitch" />
            <input autoFocus type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="..." className="w-full text-xl font-black bg-transparent border-none p-0 focus:ring-0" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-paper p-4 rounded-xl border border-accent sticker-shadow">
            <label className="text-[10px] font-black uppercase text-navy/40 mb-1 block">{t.schedule.time} (24H)</label>
            <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full font-black bg-transparent border-none p-0 focus:ring-0" />
          </div>
          <div className="bg-paper p-4 rounded-xl border border-accent sticker-shadow">
            <label className="text-[10px] font-black uppercase text-navy/40 mb-1 block">{t.schedule.category}</label>
            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as Category})} className="w-full font-black bg-transparent border-none p-0 focus:ring-0">
              {['Attraction', 'Food', 'Transport', 'Stay', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="bg-paper p-4 rounded-xl border border-accent sticker-shadow">
          <label className="text-[10px] font-black uppercase text-navy/40 mb-1 block">{t.schedule.travelInfo}</label>
          <input type="text" value={formData.distanceInfo} onChange={e => setFormData({...formData, distanceInfo: e.target.value})} placeholder="..." className="w-full font-bold bg-transparent border-none p-0 focus:ring-0" />
        </div>
      </div>
    </div>
  );
};

export default Schedule;
