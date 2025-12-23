
import React from 'react';
import { Task, TaskStatus, Theme, Language, Priority } from '../types';
import { Edit2, Trash2, CheckCircle2, Circle, Clock, History } from 'lucide-react';
import { calculateDuration, formatCreationDate } from '../utils/dateUtils';

interface TaskItemProps {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onPriorityChange: (id: string, priority: Priority) => void;
  onEdit: () => void;
  onDelete: () => void;
  theme: Theme;
  language: Language;
  onImageClick: (url: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, onStatusChange, onPriorityChange, onEdit, onDelete, theme, language, onImageClick 
}) => {
  const getStatusConfig = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO: return { 
        label: language === 'zh' ? '待办' : 'TODO', 
        color: theme === 'dark' ? 'text-[#E0E0E0]' : 'text-gray-400', 
        bg: theme === 'dark' ? 'bg-[#333]' : 'bg-gray-100', 
        border: theme === 'dark' ? 'border-[#555]' : 'border-gray-200',
        icon: <Circle size={14} />
      };
      case TaskStatus.DOING: return { label: language === 'zh' ? '进行' : 'DOING', color: 'text-[#2196F3]', bg: 'bg-[#1976D2]/20', border: 'border-[#1976D2]/40', icon: <Clock size={14} className="animate-pulse" /> };
      case TaskStatus.DONE: return { label: language === 'zh' ? '完成' : 'DONE', color: 'text-emerald-500', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', icon: <CheckCircle2 size={14} /> };
    }
  };

  const getPriorityConfig = (priority: Priority) => {
    switch (priority) {
      case 'P0': return { label: 'P0', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/40' };
      case 'P1': return { label: 'P1', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/40' };
      case 'P2': return { label: 'P2', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/40' };
    }
  };

  const isP0 = task.priority === 'P0';
  const duration = calculateDuration(task.createdAt, task.completedAt);
  const creationStr = formatCreationDate(task.createdAt, language);

  const t = {
    en: { elapsed: 'ELAPSED', total: 'TOTAL', past: 'Past' },
    zh: { elapsed: '已开始', total: '总耗时', past: '过去' }
  }[language];

  return (
    <div className="relative" style={{ zIndex: 1 }}>
      <div 
        className={`group grid grid-cols-[100px_160px_1fr_140px_100px_80px] gap-4 items-center px-6 py-5 border transition-all duration-300 rounded-2xl cursor-grab active:cursor-grabbing relative
          ${theme === 'dark' 
            ? 'bg-[#1E1E1E]/60 border-white/5 hover:bg-[#252525]/80 hover:shadow-2xl shadow-sm' 
            : 'bg-white border-transparent hover:border-gray-100 hover:shadow-2xl shadow-sm'}
          ${task.status === TaskStatus.DONE ? 'opacity-70' : ''}
          ${isP0 && task.status !== TaskStatus.DONE ? 'p0-glow' : ''}`}
      >
        {/* 列 0: 优先级 */}
        <div className="flex items-center gap-1.5">
          {(['P0', 'P1', 'P2'] as Priority[]).map((p) => {
            const config = getPriorityConfig(p);
            const isActive = task.priority === p;
            return (
              <button
                key={p}
                onClick={(e) => { e.stopPropagation(); onPriorityChange(task.id, p); }}
                className={`w-7 h-7 flex items-center justify-center text-[9px] font-black rounded-lg border transition-all
                  ${isActive 
                    ? `${config.bg} ${config.color} ${config.border} scale-110 shadow-lg` 
                    : `bg-transparent border-transparent ${theme === 'dark' ? 'text-[#444] hover:text-[#777]' : 'text-gray-300 hover:text-gray-400'}`
                  }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* 列 1: 状态切换 */}
        <div className="flex items-center gap-1">
          {(Object.values(TaskStatus)).map((status) => {
            const config = getStatusConfig(status);
            const isActive = task.status === status;
            return (
              <button
                key={status}
                onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, status); }}
                className={`flex items-center justify-center gap-1 px-1 py-1.5 text-[8px] font-black rounded-xl border transition-all flex-1 tracking-tighter whitespace-nowrap overflow-hidden
                  ${isActive 
                    ? `${config.bg} ${config.color} ${config.border} scale-105 shadow-sm` 
                    : `bg-transparent border-transparent ${theme === 'dark' ? 'text-[#555] hover:text-[#B0B0B0]' : 'text-gray-300 hover:text-gray-500'}`
                  }`}
              >
                {isActive && <div className="shrink-0">{config.icon}</div>}
                <span className="truncate">{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* 列 2: 任务内容 */}
        <div className="min-w-0 flex flex-col justify-center">
          <div className="flex items-baseline gap-3">
            <span 
              className={`text-[14px] font-bold truncate cursor-pointer transition-all hover:text-yellow-500
                ${task.status === TaskStatus.DONE 
                  ? 'line-through opacity-80' 
                  : (theme === 'dark' ? 'text-white' : 'text-gray-800')}`}
              onClick={onEdit}
            >
              {task.name}
            </span>
            {task.description && (
              <span className={`text-[11px] truncate font-medium opacity-40 ${theme === 'dark' ? 'text-[#B0B0B0]' : 'text-gray-500'}`}>
                {task.description.replace(/\n/g, ' ')}
              </span>
            )}
          </div>
        </div>

        {/* 新增列 3: 创建时间/经过时间 */}
        <div className="flex flex-col items-center justify-center text-center">
          <span className={`text-[10px] font-black whitespace-nowrap ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
            {creationStr}
          </span>
          <div className="flex items-center gap-1 mt-1 opacity-30">
            <History size={10} className={task.status === TaskStatus.DONE ? 'text-emerald-500' : 'text-blue-500'} />
            <span className={`text-[9px] font-black tracking-tighter uppercase ${theme === 'dark' ? 'text-[#B0B0B0]' : 'text-gray-500'}`}>
              {t.past} {duration}
            </span>
          </div>
        </div>

        {/* 列 4: 附件预览 */}
        <div className="flex items-center justify-center">
          {task.images.length > 0 ? (
            <div className="flex -space-x-3 hover:-space-x-1 transition-all duration-300">
              {task.images.slice(0, 3).map((img, i) => (
                <div 
                  key={i} 
                  onClick={(e) => { e.stopPropagation(); onImageClick(img); }}
                  className={`w-8 h-8 rounded-xl border-2 overflow-hidden cursor-pointer shadow-xl hover:scale-125 hover:z-20 transition-all ${theme === 'dark' ? 'border-[#333]' : 'border-white'}`}
                >
                  <img src={img} className="w-full h-full object-cover" alt="attachment" />
                </div>
              ))}
              {task.images.length > 3 && (
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black border-2 ${theme === 'dark' ? 'bg-[#333] border-[#444] text-gray-500' : 'bg-gray-100 border-white text-gray-400'}`}>
                  +{task.images.length - 3}
                </div>
              )}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl border border-dashed flex items-center justify-center opacity-10 border-current">
              <span className="text-[10px] font-black">∅</span>
            </div>
          )}
        </div>

        {/* 列 5: 操作 */}
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }} 
            className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'text-[#B0B0B0] hover:text-white hover:bg-[#333]' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'}`}
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }} 
            className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'text-red-400/70 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
