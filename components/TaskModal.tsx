
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Trash2, Sparkles, Loader2, Link2, Lightbulb, RefreshCw, FileText, ChevronDown, Check, FolderPlus, FileUp, Layers } from 'lucide-react';
import { Task, Theme, Language, Priority, Document } from '../types';
import { GoogleGenAI } from "@google/genai";
import { marked } from 'marked';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string, images: string[], priority: Priority) => void;
  task?: Task;
  allDocs: Record<string, Document>;
  theme: Theme;
  language: Language;
  onGenerateAiSolution?: (id: string) => Promise<void>;
  onSaveSolutionToKB?: (taskId: string, targetDocId?: string) => Promise<void>;
  onLinkDoc?: (taskId: string, docId: string) => void;
  onJumpToDoc?: (docId: string) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen, onClose, onSave, task, allDocs, theme, language, 
  onGenerateAiSolution, onSaveSolutionToKB, onLinkDoc, onJumpToDoc
}) => {
  const [name, setName] = useState(task?.name || '');
  const [description, setDescription] = useState(task?.description || '');
  const [images, setImages] = useState<string[]>(task?.images || []);
  const [priority, setPriority] = useState<Priority>(task?.priority || 'P1');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isRagLoading, setIsRagLoading] = useState(false);
  const [isSavingToKB, setIsSavingToKB] = useState(false);
  const [showDocPicker, setShowDocPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      setName(task.name);
      setDescription(task.description);
      setImages(task.images);
      setPriority(task.priority);
    }
  }, [task, isOpen]);

  const linkedDocs = useMemo(() => {
    return (task?.linkedDocIds || []).map(id => allDocs[id]).filter(Boolean);
  }, [task?.linkedDocIds, allDocs]);

  const t = {
    en: {
      title: 'Task Intelligence',
      name: 'Task Objective',
      desc: 'Context & Details',
      priority: 'Priority',
      ai: 'Refine',
      files: 'Attachments',
      cancel: 'Discard',
      save: 'Apply Changes',
      placeholder: 'What is the goal?',
      descPlaceholder: 'Add background info...',
      aiSolution: 'AI Solution Engine',
      generateSolution: 'Generate Strategy',
      generating: 'Processing Knowledge...',
      linked: 'Connected Docs',
      saveNew: 'To Knowledge Base',
      saveExist: 'Append to...',
      selectDoc: 'Choose target',
      noDocs: 'No docs available'
    },
    zh: {
      title: '任务详情',
      name: '任务目标',
      desc: '内容背景',
      priority: '紧急程度',
      ai: '智能改写',
      files: '相关附件',
      cancel: '取消',
      save: '应用更改',
      placeholder: '输入任务目标...',
      descPlaceholder: '补充背景细节...',
      aiSolution: 'AI 解决方案引擎',
      generateSolution: '启动 AI 构思',
      generating: '正在扫描知识库...',
      linked: '关联的知识库',
      saveNew: '转为新文档',
      saveExist: '追加至现有...',
      selectDoc: '选择目标文档',
      noDocs: '暂无文档'
    }
  }[language];

  const handleAiRefine = async () => {
    if (!name.trim()) return;
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Task: "${name}". Suggest a concise implementation description.`,
        config: {
          systemInstruction: `You are a productivity expert. Clarify in ${language === 'zh' ? 'Chinese' : 'English'}. Max 30 words.`,
          temperature: 0.5,
        },
      });
      if (response.text) setDescription(response.text);
    } catch (e) { console.error('AI refinement error:', e); } finally { setIsAiLoading(false); }
  };

  const handleRagGenerate = async () => {
    if (!task?.id || !onGenerateAiSolution) return;
    setIsRagLoading(true);
    await onGenerateAiSolution(task.id);
    setIsRagLoading(false);
  };

  const handleToKB = async (docId?: string) => {
    if (!task?.id || !onSaveSolutionToKB) return;
    setIsSavingToKB(true);
    await onSaveSolutionToKB(task.id, docId);
    setIsSavingToKB(false);
    setShowDocPicker(false);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-5xl rounded-[3rem] border shadow-[0_40px_100px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col transition-all duration-500 max-h-[94vh]
          ${theme === 'dark' ? 'bg-[#151515] border-[#333]' : 'bg-white border-gray-100'}`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header (Fixed) */}
        <div className={`px-10 py-6 flex items-center justify-between border-b shrink-0 ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-gray-50 bg-gray-50/50'}`}>
          <div className="flex items-center gap-4">
             <div className="p-2.5 bg-blue-600/10 rounded-2xl text-blue-500 shadow-inner"><Layers size={20} /></div>
             <span className={`text-[12px] font-black uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
               {t.title}
             </span>
          </div>
          <button onClick={onClose} className={`p-2.5 rounded-full transition-all ${theme === 'dark' ? 'hover:bg-white/10 text-gray-500 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-900'}`}>
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-0">
          
          {/* Top Section: Task Metadata */}
          <div className="p-10 space-y-10">
             {/* Title & Priority Grid */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">{t.name}</label>
                        <button onClick={handleAiRefine} disabled={!name} className="text-[10px] font-black text-blue-500 flex items-center gap-1.5 hover:opacity-70 transition-opacity">
                            {isAiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} {t.ai}
                        </button>
                    </div>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder={t.placeholder} 
                        className={`w-full border rounded-2xl px-5 py-4 text-xl font-black outline-none transition-all ${theme === 'dark' ? 'bg-black/40 border-white/5 text-white focus:border-blue-500/50 focus:bg-black/60' : 'bg-gray-50 border-gray-100 text-gray-900 focus:border-blue-500/30'}`} 
                    />
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-1">{t.priority}</label>
                    <div className="flex gap-2 h-[60px]">
                        {(['P0', 'P1', 'P2'] as Priority[]).map(p => (
                            <button 
                                key={p} 
                                onClick={() => setPriority(p)} 
                                className={`flex-1 flex items-center justify-center text-[11px] font-black rounded-2xl border transition-all ${priority === p ? (p === 'P0' ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20' : p === 'P1' ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20') : (theme === 'dark' ? 'bg-white/5 border-white/5 text-gray-500 hover:text-white hover:bg-white/10' : 'bg-gray-50 border-gray-100 text-gray-400')}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
             </div>

             {/* Description & Links Grid */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-1">{t.desc}</label>
                    <textarea 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        placeholder={t.descPlaceholder} 
                        rows={6} 
                        className={`w-full border rounded-2xl px-5 py-4 text-[13px] outline-none transition-all resize-none leading-relaxed ${theme === 'dark' ? 'bg-black/40 border-white/5 text-gray-300 focus:border-blue-500/50 focus:bg-black/60' : 'bg-gray-50 border-gray-100 text-gray-600 focus:border-blue-500/30'}`} 
                    />
                </div>
                <div className="space-y-8">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40">{t.files}</label>
                            <span className="text-[10px] font-bold text-gray-500">{images.length}/10</span>
                        </div>
                        <button 
                            onClick={() => fileInputRef.current?.click()} 
                            className={`w-full py-4 border rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 text-gray-400 hover:text-blue-400 hover:bg-white/10' : 'bg-gray-50 border-gray-100 text-gray-500 hover:text-blue-600 hover:bg-blue-50'}`}
                        >
                            <Link2 size={16} /> Attach Files
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={(e) => {
                            const files = e.target.files;
                            if (!files) return;
                            Array.from(files).forEach((f: File) => {
                                const r = new FileReader();
                                r.onload = () => { if(typeof r.result === 'string') setImages(p => [...p, r.result as string].slice(0, 10)); };
                                r.readAsDataURL(f);
                            });
                        }} />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-blue-500 px-1">{t.linked}</label>
                        <div className="space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar pr-2">
                            {linkedDocs.map(d => (
                                <button 
                                    key={d.id} 
                                    onClick={() => onJumpToDoc?.(d.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 ${theme === 'dark' ? 'bg-white/5 border-white/5 text-gray-300 hover:border-blue-500/50' : 'bg-gray-50 border-gray-100 text-gray-600 hover:border-blue-500/30'}`}
                                >
                                    <FileText size={14} className="text-blue-500 shrink-0" />
                                    <span className="text-[11px] font-bold truncate">{d.title || 'Untitled'}</span>
                                </button>
                            ))}
                            {linkedDocs.length === 0 && <div className="text-[11px] opacity-20 font-bold italic px-1">No active links...</div>}
                        </div>
                    </div>
                </div>
             </div>
          </div>

          {/* Separator / AI Trigger */}
          <div className="px-10 py-8">
            <div className={`rounded-[3rem] p-12 border transition-all duration-500 min-h-[400px] flex flex-col relative
              ${theme === 'dark' ? 'bg-[#0F0F0F] border-white/5 shadow-2xl' : 'bg-blue-50/20 border-gray-100 shadow-sm'}`}>
                
                {/* AI Header (Inline) */}
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-blue-600 rounded-[1.25rem] text-white shadow-[0_10px_30px_rgba(37,99,235,0.4)]"><Sparkles size={20} /></div>
                        <div>
                            <h3 className={`text-xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t.aiSolution}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">RAG Engine V2.5</span>
                                <div className="w-1 h-1 rounded-full bg-blue-500/40" />
                                <span className="text-[9px] font-black opacity-30 uppercase tracking-widest">Knowledge Contextualized</span>
                            </div>
                        </div>
                    </div>
                    {task?.id && (
                        <button 
                            onClick={handleRagGenerate}
                            disabled={isRagLoading}
                            className={`flex items-center gap-2 px-7 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all
                                ${theme === 'dark' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 hover:bg-blue-500' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-500/10'}`}
                        >
                            {isRagLoading ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                            {isRagLoading ? t.generating : (task.aiSolution ? 'Regenerate' : t.generateSolution)}
                        </button>
                    )}
                </div>

                {/* AI Content Area */}
                <div className="flex-1 relative">
                    {isRagLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 py-20">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full border-[4px] border-t-blue-500 border-blue-500/10 animate-spin" />
                                <Sparkles size={28} className="absolute inset-0 m-auto text-blue-500 animate-pulse" />
                            </div>
                            <span className="text-[12px] font-black uppercase tracking-[0.5em] opacity-30 animate-pulse">{t.generating}</span>
                        </div>
                    ) : task?.aiSolution ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <div 
                                className={`markdown-body text-[16px] leading-[2] ${theme === 'dark' ? 'dark' : ''}`}
                                dangerouslySetInnerHTML={{ __html: marked.parse(task.aiSolution) }}
                            />
                            
                            {/* KB Actions */}
                            <div className="pt-16 flex items-center gap-6 mt-16 border-t border-dashed border-white/10">
                                <button 
                                    onClick={() => handleToKB()}
                                    disabled={isSavingToKB}
                                    className={`flex-1 flex items-center justify-center gap-3 py-6 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all
                                        ${theme === 'dark' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100'}`}
                                >
                                    {isSavingToKB ? <Loader2 size={18} className="animate-spin" /> : <FolderPlus size={18} />}
                                    {t.saveNew}
                                </button>
                                
                                <div className="relative flex-1">
                                    <button 
                                        onClick={() => setShowDocPicker(!showDocPicker)}
                                        disabled={isSavingToKB}
                                        className={`w-full flex items-center justify-center gap-3 py-6 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all
                                            ${theme === 'dark' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20' : 'bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100'}`}
                                    >
                                        {isSavingToKB ? <Loader2 size={18} className="animate-spin" /> : <FileUp size={18} />}
                                        {t.saveExist}
                                    </button>
                                    
                                    {showDocPicker && (
                                        <div className={`absolute bottom-full mb-6 left-0 right-0 z-[60] max-h-72 overflow-y-auto rounded-[2rem] border shadow-[0_32px_64px_rgba(0,0,0,0.6)] p-4 animate-in fade-in slide-in-from-bottom-4
                                            ${theme === 'dark' ? 'bg-[#222] border-white/10' : 'bg-white border-gray-200'}`}>
                                            <div className="px-4 py-2 text-[10px] font-black opacity-30 uppercase tracking-widest border-b border-white/5 mb-3">{t.selectDoc}</div>
                                            {(Object.values(allDocs) as Document[]).length === 0 && <div className="px-4 py-12 text-center text-xs opacity-20 font-bold uppercase tracking-widest">{t.noDocs}</div>}
                                            {(Object.values(allDocs) as Document[]).map(doc => (
                                                <button 
                                                key={doc.id}
                                                onClick={() => handleToKB(doc.id)}
                                                className={`w-full text-left px-5 py-4 rounded-2xl text-[13px] font-bold transition-all truncate hover:bg-blue-600 hover:text-white
                                                    ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                                                >
                                                    {doc.title || 'Untitled'}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full min-h-[300px] opacity-5 pointer-events-none">
                            <Sparkles size={100} className="mb-8" />
                            <p className="text-[16px] font-black uppercase tracking-[0.6em] text-center max-w-sm leading-relaxed">
                                {language === 'zh' ? '激活 AI 智慧引擎' : 'Engage Tactical Advisor'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>

        {/* Footer (Fixed) */}
        <div className={`px-12 py-8 flex items-center justify-between border-t shrink-0 ${theme === 'dark' ? 'bg-white/[0.01] border-white/5' : 'bg-gray-50/50 border-gray-100'}`}>
          <button onClick={onClose} className={`text-[12px] font-black uppercase tracking-[0.2em] transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>{t.cancel}</button>
          
          <div className="flex items-center gap-10">
            <div className="flex -space-x-3 items-center group cursor-help">
               {images.map((img, i) => (
                 <div key={i} className="w-12 h-12 rounded-2xl border-[3px] border-[#151515] overflow-hidden transition-transform hover:scale-110 hover:z-10 shadow-2xl"><img src={img} className="w-full h-full object-cover" /></div>
               ))}
               {images.length > 0 && <span className="ml-6 text-[11px] font-black opacity-30 uppercase tracking-widest">{images.length} Files</span>}
            </div>
            
            <button 
              onClick={() => name.trim() && onSave(name, description, images, priority)} 
              className="px-20 py-5 bg-blue-600 text-white text-[13px] font-black uppercase tracking-[0.3em] rounded-[1.25rem] hover:bg-blue-500 shadow-[0_24px_48px_rgba(37,99,235,0.4)] active:scale-95 transition-all"
            >
              {t.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
