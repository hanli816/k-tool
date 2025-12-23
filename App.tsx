
import React, { useState } from 'react';
import { useTaskSync } from './hooks/useTaskSync';
import Sidebar from './components/Sidebar';
import TaskView from './components/TaskView';
import KBView from './components/KBView';
import TaskModal from './components/TaskModal';
import AuthModal from './components/AuthModal';
import { formatDateKey, parseDate } from './utils/dateUtils';
import { addDays } from 'date-fns';
import { Priority } from './types';
import { CornerDownLeft } from 'lucide-react';

const App: React.FC = () => {
  const { 
    state, setModule,
    setCurrentDate, addTask, updateTask, deleteTask, reorderTasks,
    addDoc, updateDoc, deleteDoc, setActiveDocId, moveDoc, generateAiSolution,
    saveSolutionToKB, linkTaskToDoc,
    toggleTheme, toggleLanguage, login, logout, setCustomLogo, updateCloudConfig,
    toggleTaskViewMode, toggleLogoLock
  } = useTaskSync();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [quickTaskName, setQuickTaskName] = useState('');
  const [quickPriority, setQuickPriority] = useState<Priority>('P1');
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleOpenEditModal = (id: string) => {
    setEditingTaskId(id);
    setIsModalOpen(true);
  };

  const handleJumpToDoc = (docId: string) => {
    setActiveDocId(docId);
    setModule('kb');
    setIsModalOpen(false);
  };

  const handleSaveTask = (name: string, description: string, images: string[], priority: Priority) => {
    if (editingTaskId) {
      updateTask(editingTaskId, { name, description, images, priority });
    } else {
      addTask(name, description, images, priority);
    }
    setIsModalOpen(false);
  };

  const currentList = state.lists[state.currentDate] || { date: state.currentDate, tasks: [] };
  const tasksForCurrentList = currentList.tasks.map(id => state.tasks[id]).filter(Boolean);
  const currentDoc = state.activeDocId ? state.docs[state.activeDocId] : null;

  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  return (
    <div className={`flex h-screen w-full transition-colors duration-500 overflow-hidden ${state.theme === 'dark' ? 'bg-[#121212] text-[#F5F5F5]' : 'bg-[#FAFAFA] text-gray-900'}`}>
      <Sidebar 
        state={state} 
        onDateSelect={setCurrentDate} 
        onDocSelect={(id) => { setActiveDocId(id); if(window.innerWidth < 1024) setIsSidebarOpen(false); }}
        onAddDoc={addDoc}
        onSetModule={setModule}
        onMoveDoc={moveDoc}
        onSetCustomLogo={setCustomLogo}
        onToggleLogoLock={toggleLogoLock}
        isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        theme={state.theme} toggleTheme={toggleTheme} language={state.language} toggleLanguage={toggleLanguage}
        onLogout={logout}
        onOpenAuth={() => setShowAuth(true)}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {state.activeModule === 'tasks' ? (
          <>
            <TaskView 
              date={state.currentDate} tasks={tasksForCurrentList}
              onStatusChange={(id, status) => updateTask(id, { status })}
              onPriorityChange={(id, priority) => updateTask(id, { priority })}
              onEditTask={handleOpenEditModal} onDeleteTask={(id) => setTaskToDeleteId(id)}
              onReorder={reorderTasks}
              onOpenSidebar={() => setIsSidebarOpen(true)} isSidebarOpen={isSidebarOpen}
              onNavigateDay={(dir) => {
                const cur = parseDate(state.currentDate);
                setCurrentDate(formatDateKey(addDays(cur, dir === 'prev' ? -1 : 1)));
              }} 
              theme={state.theme} language={state.language} onImageClick={setPreviewImage}
              syncStatus={state.syncStatus} lastSyncedAt={state.lastSyncedAt}
              viewMode={state.taskViewMode} onToggleViewMode={toggleTaskViewMode}
            />

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-6xl px-6 lg:px-10 z-30 pointer-events-none">
              <div className="flex flex-col gap-3 pointer-events-auto group">
                <div className={`flex items-center border rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-3xl h-24 px-8 gap-6 transition-all duration-300 ${state.theme === 'dark' ? 'bg-[#1E1E1E]/90 border-white/10 group-focus-within:border-blue-500/50' : 'bg-white/95 border-gray-200 group-focus-within:border-blue-500/30'}`}>
                  <div className="flex items-center gap-2.5 shrink-0">
                    {(['P0', 'P1', 'P2'] as Priority[]).map(p => (
                      <button 
                        key={p} 
                        onClick={() => setQuickPriority(p)} 
                        className={`w-10 h-10 flex items-center justify-center text-[11px] font-black rounded-xl border transition-all ${quickPriority === p ? (p === 'P0' ? 'bg-red-500 text-white border-red-500' : p === 'P1' ? 'bg-amber-500 text-white border-amber-500' : 'bg-blue-600 text-white border-blue-600') : 'text-gray-500 opacity-30 hover:opacity-100 border-transparent'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 flex items-center gap-4">
                    <input 
                      type="text" 
                      placeholder={state.language === 'zh' ? '添加新的任务目标...' : 'Define new objective...'} 
                      value={quickTaskName} 
                      onChange={e => setQuickTaskName(e.target.value)} 
                      onKeyDown={e => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          if (quickTaskName.trim()) { addTask(quickTaskName, '', [], quickPriority); setQuickTaskName(''); }
                        }
                      }}
                      className="flex-1 h-full bg-transparent text-xl font-black outline-none placeholder:opacity-20" 
                    />
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black tracking-widest opacity-20 group-focus-within:opacity-60 transition-all ${state.theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                      <span className="text-xs">{isMac ? '⌘' : 'Ctrl'}</span>
                      <span className="opacity-40">+</span>
                      <span>ENTER</span>
                      <CornerDownLeft size={12} className="ml-1 opacity-60" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <KBView 
            doc={currentDoc} 
            allDocs={state.docs}
            allTasks={state.tasks}
            onUpdate={updateDoc} 
            onDelete={deleteDoc} 
            onDocSelect={setActiveDocId}
            onSetModule={setModule}
            onNavigateDate={setCurrentDate}
            onTaskOpen={handleOpenEditModal}
            theme={state.theme} 
            language={state.language}
            syncStatus={state.syncStatus}
            lastSyncedAt={state.lastSyncedAt}
          />
        )}

        <AuthModal 
          isOpen={showAuth} onClose={() => setShowAuth(false)} onSuccess={login} 
          theme={state.theme} language={state.language} 
          supabaseUrl={state.cloudConfig?.supabaseUrl || ''} 
          supabaseKey={state.cloudConfig?.supabaseKey || ''} 
        />
      </main>

      {taskToDeleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setTaskToDeleteId(null)}>
          <div className={`w-full max-w-xs rounded-2xl border shadow-2xl p-6 ${state.theme === 'dark' ? 'bg-[#1A1A1A] border-[#333]' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-4">{state.language === 'zh' ? '确定删除？' : 'Delete Task?'}</h3>
            <div className="flex gap-2">
              <button onClick={() => setTaskToDeleteId(null)} className="flex-1 py-2 bg-gray-500/10 rounded-xl text-xs font-bold">Cancel</button>
              <button onClick={() => { deleteTask(taskToDeleteId!); setTaskToDeleteId(null); }} className="flex-1 py-2 bg-red-500 text-white rounded-xl text-xs font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md p-8" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}

      {isModalOpen && (
        <TaskModal 
          isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
          onSave={handleSaveTask} 
          task={editingTaskId ? state.tasks[editingTaskId] : undefined}
          allDocs={state.docs}
          theme={state.theme} language={state.language}
          onGenerateAiSolution={generateAiSolution}
          onSaveSolutionToKB={saveSolutionToKB}
          onLinkDoc={linkTaskToDoc}
          onJumpToDoc={handleJumpToDoc}
        />
      )}
    </div>
  );
};

export default App;
