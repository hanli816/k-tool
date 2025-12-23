
import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, Theme, Language, Priority, SyncStatus, TaskViewMode } from '../types';
import TaskItem from './TaskItem';
import { ChevronLeft, ChevronRight, Menu, Inbox, Cloud, CloudOff, RefreshCcw, AlertCircle, Clock, Trophy, LayoutList, LayoutGrid, Edit2, Trash2, ArrowUpNarrowWide, ArrowDownWideNarrow, ListFilter } from 'lucide-react';
import { formatDisplayDate } from '../utils/dateUtils';

interface TaskViewProps {
  date: string;
  tasks: Task[];
  onStatusChange: (id: string, status: TaskStatus) => void;
  onPriorityChange: (id: string, priority: Priority) => void;
  onEditTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onReorder: (date: string, newIds: string[]) => void;
  onOpenSidebar: () => void;
  isSidebarOpen: boolean;
  onNavigateDay: (direction: 'prev' | 'next') => void;
  theme: Theme;
  language: Language;
  onImageClick: (url: string) => void;
  syncStatus?: SyncStatus;
  lastSyncedAt?: string;
  viewMode: TaskViewMode;
  onToggleViewMode: () => void;
}

type SortOrder = 'none' | 'asc' | 'desc';

const TaskView: React.FC<TaskViewProps> = ({ 
  date, tasks, onStatusChange, onPriorityChange, onEditTask, onDeleteTask,
  onReorder, onOpenSidebar, isSidebarOpen, onNavigateDay,
  theme, language, onImageClick, syncStatus = 'offline', lastSyncedAt,
  viewMode, onToggleViewMode
}) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [prioritySort, setPrioritySort] = useState<SortOrder>('none');

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === TaskStatus.DONE).length;
    const progress = total === 0 ? 0 : (done / total) * 100;
    return { total, done, progress };
  }, [tasks]);

  const priorityWeights = { 'P0': 0, 'P1': 1, 'P2': 2 };

  const displayTasks = useMemo(() => {
    if (prioritySort === 'none') return tasks;
    return [...tasks].sort((a, b) => {
      const weightA = priorityWeights[a.priority];
      const weightB = priorityWeights[b.priority];
      return prioritySort === 'asc' ? weightA - weightB : weightB - weightA;
    });
  }, [tasks, prioritySort]);

  const tasksByStatus = useMemo(() => {
    return {
      [TaskStatus.TODO]: displayTasks.filter(t => t.status === TaskStatus.TODO),
      [TaskStatus.DOING]: displayTasks.filter(t => t.status === TaskStatus.DOING),
      [TaskStatus.DONE]: displayTasks.filter(t => t.status === TaskStatus.DONE),
    };
  }, [displayTasks]);

  const t = {
    en: {
      records: (n: number) => `${n} tasks today`,
      syncing: 'Saving...',
      synced: 'Cloud Backup',
      offline: 'Local Only',
      error: 'Error',
      empty: 'No tasks. Start typing below.',
      hPriority: 'PRIORITY',
      hStatus: 'STATUS',
      hContent: 'CONTENT',
      hCreated: 'TIME',
      hFiles: 'FILES',
      hActions: 'ACTIONS',
      completed: 'Completion',
      todo: 'Todo',
      doing: 'Doing',
      done: 'Done',
      sortTip: 'Manual reorder disabled while sorting'
    },
    zh: {
      records: (n: number) => `今日记录 ${n} 条任务`,
      syncing: '同步中...',
      synced: '云端同步',
      offline: '离线模式',
      error: '同步异常',
      empty: '今日暂无任务，直接输入开始',
      hPriority: '优先级',
      hStatus: '状态',
      hContent: '内容',
      hCreated: '创建时间',
      hFiles: '附件',
      hActions: '操作',
      completed: '今日完成进度',
      todo: '待办',
      doing: '进行中',
      done: '已完成',
      sortTip: '排序开启时已锁定手动拖拽'
    }
  }[language];

  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'syncing': return <RefreshCcw size={12} className="animate-spin text-blue-500" />;
      case 'synced': return <Cloud size={12} className="text-emerald-500" />;
      case 'error': return <AlertCircle size={12} className="text-red-500" />;
      default: return <CloudOff size={12} className="text-gray-400" />;
    }
  };

  const toggleSort = () => {
    setPrioritySort(prev => {
      if (prev === 'none') return 'asc';
      if (prev === 'asc') return 'desc';
      return 'none';
    });
  };

  const handleDragStart = (id: string) => {
    if (prioritySort !== 'none') return;
    setDraggedId(id);
  };

  const handleDragOverStatus = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (!draggedId) return;
    const task = tasks.find(t => t.id === draggedId);
    if (task && task.status !== status) onStatusChange(draggedId, status);
  };

  const handleDragOverReorder = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (viewMode !== 'list' || prioritySort !== 'none' || !draggedId || draggedId === targetId) return;
    const currentOrder = tasks.map(t => t.id);
    const draggedIndex = currentOrder.indexOf(draggedId);
    const targetIndex = currentOrder.indexOf(targetId);
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const newOrder = [...currentOrder];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedId);
      onReorder(date, newOrder);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full max-w-7xl mx-auto w-full px-4 lg:px-10 py-6 overflow-hidden">
      <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
         <div className="flex justify-between items-end mb-2">
           <div className="flex items-center gap-2">
             <Trophy size={14} className="text-yellow-500" />
             <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>{t.completed}</span>
           </div>
           <span className="text-xs font-black text-yellow-500">{Math.round(stats.progress)}%</span>
         </div>
         <div className={`h-1 w-full rounded-full overflow-hidden ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
           <div className="h-full bg-yellow-500 rounded-full transition-all duration-1000 ease-out progress-bar-flow" style={{ width: `${stats.progress}%` }} />
         </div>
      </div>

      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {!isSidebarOpen && (
            <button onClick={onOpenSidebar} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-[#2A2A2A] text-[#E0E0E0]' : 'hover:bg-gray-100 text-gray-500'}`}>
              <Menu size={22} />
            </button>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h2 className={`text-2xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatDisplayDate(date, language)}</h2>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-tighter ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                {getSyncIcon()} <span>{lastSyncedAt || 'Local'}</span>
              </div>
            </div>
            <p className={`text-[10px] font-bold mt-1 uppercase tracking-widest ${theme === 'dark' ? 'text-[#B0B0B0]' : 'text-gray-400'}`}>{t.records(tasks.length)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {prioritySort !== 'none' && viewMode === 'list' && (
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-xl border border-blue-500/20 text-[9px] font-black text-blue-500 uppercase tracking-widest animate-in fade-in slide-in-from-right-4">
              <ListFilter size={12} />
              {t.sortTip}
            </div>
          )}

          <div className={`flex p-1 rounded-xl border shadow-sm ${theme === 'dark' ? 'bg-[#1E1E1E] border-[#4D4D4D]' : 'bg-white border-gray-200'}`}>
             <button onClick={onToggleViewMode} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}><LayoutList size={18} /></button>
             <button onClick={onToggleViewMode} className={`p-1.5 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}><LayoutGrid size={18} /></button>
          </div>

          <div className={`flex items-center rounded-xl p-1 border shadow-sm ${theme === 'dark' ? 'bg-[#1E1E1E] border-[#4D4D4D]' : 'bg-white border-gray-200'}`}>
             <button onClick={() => onNavigateDay('prev')} className="p-1.5 rounded-lg text-gray-400 hover:text-white transition-all"><ChevronLeft size={18} /></button>
             <div className="w-px h-4 bg-white/10 mx-1" />
             <button onClick={() => onNavigateDay('next')} className="p-1.5 rounded-lg text-gray-400 hover:text-white transition-all"><ChevronRight size={18} /></button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] opacity-20">
            <Inbox size={64} strokeWidth={1} className="mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest">{t.empty}</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="flex flex-col h-full">
            {/* 表头调整为 6 列布局 */}
            <div className={`grid grid-cols-[100px_160px_1fr_140px_100px_80px] gap-4 px-6 py-3 mb-2 text-[10px] font-black uppercase tracking-[0.2em] border-b ${theme === 'dark' ? 'text-[#B0B0B0] border-[#4D4D4D]' : 'text-gray-400 border-gray-100'}`}>
              <button onClick={toggleSort} className={`flex items-center gap-1.5 hover:text-blue-500 transition-colors text-left group ${prioritySort !== 'none' ? 'text-blue-500' : ''}`}>
                {t.hPriority}
                {prioritySort === 'asc' && <ArrowUpNarrowWide size={12} className="animate-in fade-in zoom-in" />}
                {prioritySort === 'desc' && <ArrowDownWideNarrow size={12} className="animate-in fade-in zoom-in" />}
                {prioritySort === 'none' && <ArrowUpNarrowWide size={12} className="opacity-0 group-hover:opacity-40" />}
              </button>
              <div>{t.hStatus}</div>
              <div>{t.hContent}</div>
              <div className="text-center">{t.hCreated}</div>
              <div className="text-center">{t.hFiles}</div>
              <div className="text-right">{t.hActions}</div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-32 space-y-3">
              {displayTasks.map(task => (
                <div key={task.id} draggable={prioritySort === 'none'} onDragStart={() => handleDragStart(task.id)} onDragOver={(e) => handleDragOverReorder(e, task.id)} onDragEnd={() => setDraggedId(null)} className={`task-entrance ${draggedId === task.id ? 'opacity-30' : ''} ${prioritySort !== 'none' ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}>
                  <TaskItem task={task} onStatusChange={onStatusChange} onPriorityChange={onPriorityChange} onEdit={() => onEditTask(task.id)} onDelete={() => onDeleteTask(task.id)} theme={theme} language={language} onImageClick={onImageClick} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full pb-32">
            {(Object.values(TaskStatus) as TaskStatus[]).map(status => (
              <div key={status} onDragOver={(e) => handleDragOverStatus(e, status)} className={`flex flex-col rounded-[2.5rem] p-4 transition-all duration-300 ${theme === 'dark' ? 'bg-[#181818]/60 border border-white/5' : 'bg-gray-100/50 border border-gray-100'}`}>
                <div className="flex items-center justify-between mb-6 px-4 pt-2">
                  <h3 className={`text-[12px] font-black uppercase tracking-[0.3em] ${status === 'done' ? 'text-emerald-500' : status === 'doing' ? 'text-blue-500' : 'opacity-40'}`}>
                    {status === 'todo' ? t.todo : status === 'doing' ? t.doing : t.done}
                  </h3>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${theme === 'dark' ? 'bg-white/5 text-gray-500' : 'bg-gray-200 text-gray-500'}`}>{tasksByStatus[status].length}</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                  {tasksByStatus[status].map(task => (
                    <div key={task.id} draggable onDragStart={() => handleDragStart(task.id)} onDragEnd={() => setDraggedId(null)} className={`group rounded-3xl p-5 border transition-all duration-300 cursor-grab active:cursor-grabbing ${draggedId === task.id ? 'opacity-30 scale-95' : 'scale-100'} ${theme === 'dark' ? 'bg-[#1E1E1E] border-white/5 hover:border-blue-500/30' : 'bg-white border-transparent hover:shadow-xl'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg border ${task.priority === 'P0' ? 'bg-red-500/10 text-red-500 border-red-500/40 p0-glow' : task.priority === 'P1' ? 'bg-amber-500/10 text-amber-500 border-amber-500/40' : 'bg-blue-500/10 text-blue-500 border-blue-500/40'}`}>
                          {task.priority}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onEditTask(task.id)} className="p-1.5 hover:text-blue-500"><Edit2 size={12} /></button>
                          <button onClick={() => onDeleteTask(task.id)} className="p-1.5 hover:text-red-500"><Trash2 size={12} /></button>
                        </div>
                      </div>
                      <h4 className={`text-sm font-bold leading-relaxed mb-3 ${task.status === 'done' ? 'line-through opacity-40' : (theme === 'dark' ? 'text-white' : 'text-gray-900')}`}>{task.name}</h4>
                      {task.images.length > 0 && (
                        <div className="flex gap-2 overflow-hidden rounded-xl h-10">
                          {task.images.slice(0, 3).map((img, i) => (
                            <img key={i} src={img} className="w-10 h-10 object-cover rounded-lg border border-white/5 cursor-pointer" onClick={() => onImageClick(img)} />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {tasksByStatus[status].length === 0 && (
                    <div className="h-20 border-2 border-dashed border-white/5 rounded-3xl flex items-center justify-center opacity-10">
                      <Clock size={16} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskView;
