
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Document, Theme, Language, SyncStatus, Task, AppModule } from '../types';
import { Pin, Trash2, Edit3, Eye, Sparkles, BookOpen, RefreshCcw, Cloud, CloudOff, AlertCircle, ListTodo, Calendar, ChevronRight } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { marked } from 'marked';
import TurndownService from 'turndown';

interface KBViewProps {
  doc: Document | null;
  allDocs: Record<string, Document>;
  allTasks: Record<string, Task>;
  onUpdate: (id: string, updates: Partial<Document>) => void;
  onDelete: (id: string) => void;
  onDocSelect: (id: string | null) => void;
  onSetModule: (module: AppModule) => void;
  onNavigateDate: (date: string) => void;
  onTaskOpen?: (taskId: string) => void;
  theme: Theme;
  language: Language;
  syncStatus?: SyncStatus;
  lastSyncedAt?: string;
}

const KBView: React.FC<KBViewProps> = ({ 
  doc, allDocs, allTasks, onUpdate, onDelete, onDocSelect, onSetModule, onNavigateDate, onTaskOpen,
  theme, language, syncStatus = 'offline', lastSyncedAt 
}) => {
  const [isVisualMode, setIsVisualMode] = useState(true);
  const [isAiRefining, setIsAiRefining] = useState(false);
  const editableRef = useRef<HTMLDivElement>(null);
  const lastContentRef = useRef<string>('');
  
  useMemo(() => {
    marked.setOptions({ gfm: true, breaks: true });
  }, []);

  const turndown = useMemo(() => {
    const service = new TurndownService({ headingStyle: 'atx', hr: '---', bulletListMarker: '-', codeBlockStyle: 'fenced', emDelimiter: '*' });
    service.addRule('keepImages', { 
      filter: ['img'], 
      replacement: (_content: string, node: Node) => `![Image](${(node as HTMLImageElement).src})` 
    });
    service.addRule('taskList', { 
      filter: (node: Node) => node.nodeName === 'INPUT' && (node as HTMLInputElement).type === 'checkbox', 
      replacement: (_content: string, node: Node) => (node as HTMLInputElement).checked ? '[x] ' : '[ ] ' 
    });
    return service;
  }, []);

  const linkedTasks = useMemo(() => {
    return (doc?.linkedTaskIds || []).map(id => allTasks[id]).filter(Boolean);
  }, [doc?.linkedTaskIds, allTasks]);

  const t = {
    en: {
      empty: 'Select or create a document to start writing',
      title: 'Document Title',
      refine: 'AI Rewrite',
      refining: 'Refining...',
      visual: 'Preview',
      raw: 'Editor',
      pin: 'Pin',
      unpin: 'Unpin',
      delete: 'Delete',
      placeholder: 'Click here to write something amazing...',
      syncing: 'Saving to cloud...',
      synced: 'Cloud Backup Active',
      offline: 'Local storage only',
      error: 'Cloud Error',
      relatedTasks: 'Connected Execution Tasks',
      jumpToTask: 'Open Details'
    },
    zh: {
      empty: '选择或创建一个文档开始记录',
      title: '文档标题',
      refine: 'AI 优化',
      refining: '正在优化...',
      visual: '预览',
      raw: '编辑',
      pin: '置顶',
      unpin: '取消置顶',
      delete: '删除',
      placeholder: '点击这里，开始书写伟大的构思...',
      syncing: '正在同步云端...',
      synced: '云端同步正常',
      offline: '本地离线模式',
      error: '云端同步异常',
      relatedTasks: '已关联的执行任务',
      jumpToTask: '查看详情'
    }
  }[language];

  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'syncing': return <RefreshCcw size={12} className="animate-spin text-blue-500" />;
      case 'synced': return <Cloud size={12} className="text-emerald-500 animate-pulse" />;
      case 'error': return <AlertCircle size={12} className="text-red-500" />;
      default: return <CloudOff size={12} className="text-gray-400" />;
    }
  };

  const getSyncText = () => {
    switch (syncStatus) {
      case 'syncing': return t.syncing;
      case 'synced': return t.synced;
      case 'error': return t.error;
      default: return t.offline;
    }
  };

  useEffect(() => {
    if (isVisualMode && editableRef.current && doc) {
      if (doc.content !== lastContentRef.current) {
        const html = marked.parse(doc.content);
        if (typeof html === 'string') {
          editableRef.current.innerHTML = html;
          lastContentRef.current = doc.content;
        }
      }
    }
  }, [isVisualMode, doc?.id, doc?.content]);

  if (!doc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 opacity-20">
        <BookOpen size={64} className="mb-4" />
        <p className="text-sm font-bold">{t.empty}</p>
      </div>
    );
  }

  const handleAiRefine = async () => {
    if (!doc.content.trim()) return;
    setIsAiRefining(true);
    try {
      const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
      const ai = new GoogleGenAI({ apiKey: apiKey as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Please refine and improve the following markdown text, making it more professional and organized: \n\n${doc.content}`,
        config: {
          systemInstruction: `You are an expert editor. Improve the content while preserving the markdown structure. Language: ${language === 'zh' ? 'Chinese' : 'English'}.`,
          temperature: 0.7,
        },
      });
      if (response.text) onUpdate(doc.id, { content: response.text });
    } catch (e) { console.error('AI refinement error:', e); } finally { setIsAiRefining(false); }
  };

  const handleInput = () => {
    if (editableRef.current) {
      const html = editableRef.current.innerHTML;
      const markdown = turndown.turndown(html);
      lastContentRef.current = markdown;
      onUpdate(doc.id, { content: markdown });
    }
  };

  return (
    <div className={`flex-1 flex flex-col h-full w-full overflow-hidden ${theme === 'dark' ? 'dark text-gray-200' : 'bg-white text-gray-800'}`}>
      <div className="max-w-5xl mx-auto w-full px-6 lg:px-12 py-10 h-full flex flex-col">
        <header className="flex items-center justify-between mb-10 gap-6 shrink-0">
          <div className="flex-1 min-w-0">
            <input 
              type="text" 
              value={doc.title}
              onChange={(e) => onUpdate(doc.id, { title: e.target.value })}
              placeholder={t.title}
              className={`w-full bg-transparent text-4xl font-black outline-none border-none tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
            />
            <div className="flex items-center gap-6 mt-3">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-30">
                Update {new Date(doc.updatedAt).toLocaleTimeString()}
              </span>
              <button onClick={() => onUpdate(doc.id, { isPinned: !doc.isPinned })} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${doc.isPinned ? 'text-blue-500' : 'opacity-40 hover:opacity-100'}`}>
                <Pin size={12} fill={doc.isPinned ? 'currentColor' : 'none'} /> {doc.isPinned ? 'Unpin' : 'Pin'}
              </button>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-tighter ${syncStatus === 'synced' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-gray-500/10 border-gray-500/20 text-gray-500'}`}>
                {getSyncIcon()} <span>{getSyncText()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleAiRefine} disabled={isAiRefining} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'dark' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
               {isAiRefining ? <RefreshCcw size={16} className="animate-spin" /> : <Sparkles size={16} />} {isAiRefining ? t.refining : t.refine}
            </button>
            <button onClick={() => onDelete(doc.id)} className="p-3 rounded-2xl text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={20} /></button>
          </div>
        </header>

        {/* Linked Tasks Section - Moved to top */}
        {linkedTasks.length > 0 && (
          <div className="mb-8 p-6 rounded-[2.5rem] border bg-blue-500/5 border-blue-500/10 animate-in fade-in slide-in-from-top-2 duration-500">
             <div className="flex items-center gap-3 mb-4">
                <ListTodo size={16} className="text-blue-500" />
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-500/60">{t.relatedTasks}</h4>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {linkedTasks.map(task => (
                  <button 
                    key={task.id} 
                    onClick={() => onTaskOpen?.(task.id)}
                    className={`group flex items-center justify-between p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-95 shadow-sm
                      ${theme === 'dark' ? 'bg-[#1E1E1E] border-white/5 hover:border-blue-500/40' : 'bg-white border-gray-100 hover:border-blue-500/30'}`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-black truncate group-hover:text-blue-500 transition-colors">{task.name}</div>
                      <div className="flex items-center gap-2 text-[9px] font-bold opacity-30 mt-1 uppercase">
                        <Calendar size={10} /> {task.listDate}
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-blue-500 shrink-0 opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                ))}
             </div>
          </div>
        )}

        <div className={`flex items-center p-1 rounded-2xl mb-8 self-start shrink-0 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
          <button onClick={() => setIsVisualMode(true)} className={`flex items-center gap-2 px-8 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all ${isVisualMode ? 'bg-blue-600 text-white shadow-xl' : 'text-gray-500'}`}><Eye size={16} /> {t.visual}</button>
          <button onClick={() => setIsVisualMode(false)} className={`flex items-center gap-2 px-8 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all ${!isVisualMode ? 'bg-blue-600 text-white shadow-xl' : 'text-gray-500'}`}><Edit3 size={16} /> {t.raw}</button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
          {isVisualMode ? (
            <div 
              ref={editableRef} 
              contentEditable 
              onInput={handleInput} 
              onBlur={handleInput} 
              className="markdown-body focus:outline-none min-h-[400px]" 
            />
          ) : (
            <textarea value={doc.content} onChange={(e) => onUpdate(doc.id, { content: e.target.value })} className={`w-full h-full min-h-[400px] bg-transparent resize-none outline-none font-mono text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} placeholder="# Start writing markdown..." />
          )}
        </div>
      </div>
    </div>
  );
};

export default KBView;
