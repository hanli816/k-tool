
import React, { useRef, useState, useMemo } from 'react';
import { X, Sun, Moon, LogOut, BookOpen, ListTodo, Plus, Pin, FileText, ChevronRight, ChevronDown, Edit2, Lock, Unlock } from 'lucide-react';
import { addDays } from 'date-fns';
import { formatDateKey, formatDisplayDate } from '../utils/dateUtils';
import { Theme, Language, AppState, AppModule, Document } from '../types';

interface SidebarProps {
  state: AppState;
  onDateSelect: (date: string) => void;
  onDocSelect: (id: string) => void;
  onAddDoc: (parentId?: string | null) => void;
  onSetModule: (module: AppModule) => void;
  onMoveDoc: (docId: string, parentId: string | null, order: number) => void;
  onSetCustomLogo?: (logo: string) => void;
  onToggleLogoLock?: () => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  toggleLanguage: () => void;
  onLogout: () => void;
  onOpenAuth: () => void;
}

const ADMIN_EMAIL = 'kei.han0916@gmail.com';

const KingIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4 8L12 3L20 8L18 13H6L4 8Z" fill="currentColor" />
    <path d="M12 13L16 11L18 13V21H6V13L8 11L12 13Z" fill="currentColor" fillOpacity="0.2" />
    <path d="M12 3L16 7H8L12 3Z" fill="currentColor" />
    <path d="M4 8V21H20V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 13V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M8 17H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M6 13L9 11M18 13L15 11" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="7" r="1" fill="currentColor" />
  </svg>
);

const DocItem: React.FC<{ 
  doc: Document, 
  depth: number, 
  docTree: Record<string, Document[]>,
  expandedDocs: Set<string>,
  toggleExpand: (e: React.MouseEvent, id: string) => void,
  draggedDocId: string | null,
  dragOverTarget: { id: string | null, position: 'top' | 'middle' | 'bottom' } | null,
  activeDocId: string | null,
  language: Language,
  theme: Theme,
  onDocSelect: (id: string) => void,
  onAddDoc: (parentId?: string | null) => void,
  handleDragStart: (id: string) => void,
  handleDragOver: (e: React.DragEvent, id: string) => void,
  handleDrop: (e: React.DragEvent, id: string) => void,
  handleDragEnd: () => void
}> = ({ 
  doc, depth, docTree, expandedDocs, toggleExpand, draggedDocId, dragOverTarget, 
  activeDocId, language, theme, onDocSelect, onAddDoc, 
  handleDragStart, handleDragOver, handleDrop, handleDragEnd 
}) => {
  const children = docTree[doc.id] || [];
  const isExpanded = expandedDocs.has(doc.id);
  const isActive = activeDocId === doc.id;
  const isOver = dragOverTarget?.id === doc.id;

  return (
    <div className="space-y-0.5">
      <div 
        draggable
        onDragStart={(e) => { e.stopPropagation(); handleDragStart(doc.id); }}
        onDragOver={(e) => { e.stopPropagation(); handleDragOver(e, doc.id); }}
        onDrop={(e) => { e.stopPropagation(); handleDrop(e, doc.id); }}
        onDragEnd={handleDragEnd}
        onClick={() => onDocSelect(doc.id)}
        className={`group flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer relative
          ${isActive ? 'bg-blue-600/10 text-blue-500' : 'text-gray-500 hover:bg-white/5'}
          ${isOver && dragOverTarget?.position === 'middle' ? 'bg-blue-500/20 shadow-inner' : ''}`}
        style={{ paddingLeft: `${depth * 14 + 12}px` }}
      >
        {isOver && dragOverTarget?.position === 'top' && (
          <div className="absolute top-0 left-2 right-2 h-0.5 bg-blue-500 rounded-full z-10 animate-pulse" />
        )}
        {isOver && dragOverTarget?.position === 'bottom' && (
          <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-500 rounded-full z-10 animate-pulse" />
        )}

        <div className="flex items-center shrink-0 w-4 h-4 justify-center">
          {children.length > 0 ? (
            <button 
              onClick={(e) => toggleExpand(e, doc.id)} 
              className={`hover:text-blue-500 transition-colors ${isExpanded ? 'text-blue-500/50' : ''}`}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-10" />
          )}
        </div>
        
        <FileText size={14} className={`shrink-0 transition-transform ${isActive ? 'text-blue-500 scale-110' : 'opacity-40'}`} />
        
        <span className={`text-xs truncate flex-1 ${isActive ? 'font-black' : 'font-bold'}`}>
          {doc.title || (language === 'zh' ? '无标题' : 'Untitled')}
        </span>

        {doc.isPinned && <Pin size={10} className="text-blue-500" fill="currentColor" />}
        
        <button 
          onClick={(e) => { e.stopPropagation(); onAddDoc(doc.id); }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:text-blue-500 transition-all"
        >
          <Plus size={12} />
        </button>
      </div>

      {isExpanded && children.length > 0 && (
        <div className={`ml-[19px] border-l ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
          {children.map(child => (
            <DocItem 
              key={child.id} 
              doc={child} 
              depth={depth + 1} 
              docTree={docTree}
              expandedDocs={expandedDocs}
              toggleExpand={toggleExpand}
              draggedDocId={draggedDocId}
              dragOverTarget={dragOverTarget}
              activeDocId={activeDocId}
              language={language}
              theme={theme}
              onDocSelect={onDocSelect}
              onAddDoc={onAddDoc}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDrop={handleDrop}
              handleDragEnd={handleDragEnd}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ 
  state, onDateSelect, onDocSelect, onAddDoc, onSetModule, onMoveDoc, onSetCustomLogo, onToggleLogoLock, isOpen, toggleSidebar, 
  theme, toggleTheme, language, toggleLanguage, onLogout, onOpenAuth
}) => {
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());
  const [draggedDocId, setDraggedDocId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{ id: string | null, position: 'top' | 'middle' | 'bottom' } | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = state.user?.email === ADMIN_EMAIL;
  // 管理员可控锁，普通用户强行锁定
  const isLogoLocked = isAdmin ? (state.isLogoLocked ?? true) : true;

  // 渲染逻辑：管理员看自己的 customLogo（即时预览），普通用户强制看 systemLogo（云端全局同步）
  const displayLogo = isAdmin ? state.customLogo : (state.systemLogo || state.customLogo);

  const t = {
    en: { tasks: 'Tasks', knowledge: 'Knowledge', nav: 'Navigation', today: 'Today', login: 'Login / Sign Up', docs: 'Docs', emptyDocs: 'Empty', todayBadge: 'TODAY', lock: 'Lock Logo', unlock: 'Unlock Logo' },
    zh: { tasks: '任务', knowledge: '知识库', nav: '导航', today: '今天', login: '登录/注册', docs: '我的文档', emptyDocs: '暂无文档', todayBadge: '今日', lock: '锁定 Logo', unlock: '解锁 Logo' }
  }[language];

  const todayKey = useMemo(() => formatDateKey(new Date()), []);

  const docTree = useMemo(() => {
    const docs = Object.values(state.docs) as Document[];
    const map: Record<string, Document[]> = { 'root': [] };
    docs.sort((a, b) => (a.order || 0) - (b.order || 0)).forEach(doc => {
      const pId = doc.parentId || 'root';
      if (!map[pId]) map[pId] = [];
      map[pId].push(doc);
    });
    return map;
  }, [state.docs]);

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const next = new Set(expandedDocs);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedDocs(next);
  };

  // FIX: Line 190, renamed setDraggedId to setDraggedDocId to match the state setter name defined on line 175.
  const handleDragStart = (id: string) => setDraggedDocId(id);
  const handleDragEnd = () => {
    setDraggedDocId(null);
    setDragOverTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, id: string | null) => {
    e.preventDefault();
    if (!draggedDocId || draggedDocId === id) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const height = rect.height;
    let position: 'top' | 'middle' | 'bottom' = 'middle';
    if (relY < height * 0.25) position = 'top';
    else if (relY > height * 0.75) position = 'bottom';
    setDragOverTarget({ id, position });
  };

  const handleDrop = (e: React.DragEvent, targetId: string | null) => {
    e.preventDefault();
    if (!draggedDocId || draggedDocId === targetId) return;
    const dragDoc = state.docs[draggedDocId];
    if (!dragDoc) return;
    if (targetId === null) {
      const rootDocs = docTree['root'] || [];
      const lastOrder = rootDocs.length > 0 ? rootDocs[rootDocs.length - 1].order : Date.now();
      onMoveDoc(draggedDocId, null, lastOrder + 1000);
      handleDragEnd();
      return;
    }
    const targetDoc = state.docs[targetId];
    const siblings = docTree[targetDoc.parentId || 'root'] || [];
    const index = siblings.findIndex(s => s.id === targetId);
    if (dragOverTarget?.position === 'middle') {
      const children = docTree[targetId] || [];
      const lastOrder = children.length > 0 ? children[children.length - 1].order : Date.now();
      onMoveDoc(draggedDocId, targetId, lastOrder + 1000);
      setExpandedDocs(prev => new Set(prev).add(targetId));
    } else {
      let newOrder: number;
      if (dragOverTarget?.position === 'top') {
        const prevDoc = siblings[index - 1];
        newOrder = prevDoc ? (prevDoc.order + targetDoc.order) / 2 : targetDoc.order - 1000;
      } else {
        const nextDoc = siblings[index + 1];
        newOrder = nextDoc ? (targetDoc.order + nextDoc.order) / 2 : targetDoc.order + 1000;
      }
      onMoveDoc(draggedDocId, targetDoc.parentId || null, newOrder);
    }
    handleDragEnd();
  };

  const handleLogoClick = () => {
    if (isLogoLocked) return;
    logoInputRef.current?.click();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onSetCustomLogo) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onSetCustomLogo(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <aside className={`fixed lg:relative z-40 h-full transition-all duration-300 border-r ${theme === 'dark' ? 'bg-[#121212] border-[#2A2A2A]' : 'bg-white border-gray-100'} ${isOpen ? 'w-72' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-0'}`}>
      <div className="flex flex-col h-full overflow-hidden w-72">
        {/* Header Section (Brand Area) */}
        <div className="px-6 py-8 flex flex-col gap-8 shrink-0">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-4 group relative ${isLogoLocked ? 'cursor-default' : 'cursor-pointer'}`}>
              <div 
                className="logo-3d-container"
                onClick={handleLogoClick}
              >
                <div className={`logo-3d-card w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl relative transition-all duration-700 overflow-hidden aurora-shine group
                  ${theme === 'dark' ? 'logo-aurora-bg text-yellow-500' : 'bg-blue-600 shadow-blue-500/30 text-white'}`}>
                  
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none z-10" />
                  
                  {displayLogo ? (
                    <img src={displayLogo} className="w-full h-full object-cover relative z-0" alt="Logo" />
                  ) : (
                    <KingIcon className="w-7 h-7 drop-shadow-lg" />
                  )}

                  {!displayLogo && (
                    <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white] opacity-60 z-20" />
                  )}

                  {!isLogoLocked && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-30 backdrop-blur-[2px]">
                      <Edit2 size={16} className="text-white" />
                    </div>
                  )}
                </div>
              </div>
              
              <input 
                type="file" 
                ref={logoInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleLogoUpload} 
              />

              <div className="flex flex-col">
                <h1 
                  style={{ fontFamily: "'Roboto', sans-serif" }} 
                  className={`text-[22px] font-black tracking-[-0.02em] leading-none ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                >
                  K <span className="text-blue-500">-</span> Tool
                </h1>
                <div className="flex items-center gap-1.5 mt-1.5 pl-0.5">
                   <span className="text-[8px] font-black uppercase tracking-[0.5em] opacity-30">Developed by 老K</span>
                   {isLogoLocked && <Lock size={8} className="opacity-20" />}
                </div>
              </div>
            </div>
            <button onClick={toggleSidebar} className="lg:hidden p-2 opacity-50"><X size={18} /></button>
          </div>
          
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

          <div className={`flex p-1.5 rounded-2xl ${theme === 'dark' ? 'bg-white/5 border border-white/5' : 'bg-gray-100'}`}>
             {(['tasks', 'kb'] as AppModule[]).map(mod => (
               <button 
                key={mod}
                onClick={() => onSetModule(mod)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all
                  ${state.activeModule === mod ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-gray-500 hover:text-gray-300'}`}
               >
                {mod === 'tasks' ? <ListTodo size={15} /> : <BookOpen size={15} />}
                {mod === 'tasks' ? t.tasks : t.knowledge}
               </button>
             ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar">
          {state.activeModule === 'tasks' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{t.nav}</span>
                <button onClick={() => onDateSelect(todayKey)} className="text-[9px] font-black text-blue-500 uppercase">{t.today}</button>
              </div>
              <div className="space-y-1">
                {[-3, -2, -1, 0, 1, 2, 3].map(i => {
                  const d = formatDateKey(addDays(new Date(), i));
                  const isToday = d === todayKey;
                  return (
                    <button 
                      key={d} onClick={() => onDateSelect(d)}
                      className={`w-full px-4 py-3.5 rounded-xl flex items-center justify-between transition-all
                        ${state.currentDate === d ? 'bg-blue-500 text-white shadow-lg scale-[1.02]' : 'text-gray-500 hover:bg-white/5'}`}
                    >
                      <span className="text-xs font-bold">{formatDisplayDate(d, language, true)}</span>
                      {isToday && (
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter
                          ${state.currentDate === d ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-500'}`}>
                          {t.todayBadge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-20">
              <div className="flex items-center justify-between px-2">
                <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{t.docs}</span>
                <button onClick={() => onAddDoc(null)} className="p-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 active:scale-90 transition-all shadow-lg shadow-blue-600/20">
                  <Plus size={14} />
                </button>
              </div>
              <div className="space-y-1">
                {docTree['root']?.map(doc => (
                  <DocItem 
                    key={doc.id} doc={doc} depth={0} docTree={docTree} expandedDocs={expandedDocs}
                    toggleExpand={toggleExpand} draggedDocId={draggedDocId} dragOverTarget={dragOverTarget}
                    activeDocId={state.activeDocId} language={language} theme={theme}
                    onDocSelect={id => onDocSelect(id)} onAddDoc={onAddDoc} handleDragStart={handleDragStart}
                    handleDragOver={handleDragOver} handleDrop={handleDrop} handleDragEnd={handleDragEnd}
                  />
                ))}
                <div onDragOver={(e) => handleDragOver(e, null)} onDrop={(e) => handleDrop(e, null)} className={`h-12 border-2 border-dashed rounded-xl flex items-center justify-center transition-all mt-4 ${dragOverTarget?.id === null ? 'border-blue-500 bg-blue-500/10 opacity-100 scale-100' : 'border-transparent opacity-0 scale-95 pointer-events-none'}`}>
                   <span className="text-[10px] font-black text-blue-500 uppercase">Drop to root</span>
                </div>
                {Object.keys(state.docs).length === 0 && (
                  <div className="py-12 text-center opacity-20">
                    <BookOpen size={32} className="mx-auto mb-2"/>
                    <p className="text-[10px] uppercase font-black">{t.emptyDocs}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/5 space-y-4 bg-transparent shrink-0">
           {state.user ? (
             <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3 px-2">
                   <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[11px] font-black text-white shadow-lg shadow-blue-500/20">
                     {state.user.email[0].toUpperCase()}
                   </div>
                   <span className="text-[10px] font-black text-gray-400 truncate max-w-[110px]">{state.user.email}</span>
                </div>
                <button onClick={onLogout} className="p-2 text-red-400/50 hover:text-red-400 transition-colors"><LogOut size={16} /></button>
             </div>
           ) : (
             <button onClick={onOpenAuth} className="w-full py-3.5 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all active:scale-[0.98]">
               {t.login}
             </button>
           )}
           
           <div className="flex flex-col gap-2">
             {/* 权限硬核校验：仅管理员可见锁定按钮 */}
             {isAdmin && (
               <button 
                  onClick={onToggleLogoLock} 
                  className={`w-full py-2.5 rounded-2xl border flex items-center justify-center gap-2 transition-all text-[10px] font-black uppercase tracking-widest
                    ${isLogoLocked 
                      ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20' 
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20'}`}
                >
                 {isLogoLocked ? <Lock size={12} /> : <Unlock size={12} />}
                 {isLogoLocked ? t.lock : t.unlock}
               </button>
             )}
             <div className="flex gap-2">
               <button onClick={toggleTheme} className="flex-1 py-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all">{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}</button>
               <button onClick={toggleLanguage} className="flex-1 py-3.5 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black text-gray-500 hover:text-white transition-all uppercase tracking-[0.2em]">{language === 'en' ? 'ZH' : 'EN'}</button>
             </div>
           </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
