
import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, TaskStatus, AppState, Theme, Language, Priority, CloudConfig, SyncStatus, User, AppModule, Document, TaskViewMode } from '../types';
import { formatDateKey, getNowTimestamp } from '../utils/dateUtils';
import { GoogleGenAI } from "@google/genai";

const CURRENT_STORAGE_KEY = 'k_task_persistent_v4'; 
const SYNC_DEBOUNCE_MS = 2000;

const DEFAULT_CLOUD_CONFIG: CloudConfig = {
  supabaseUrl: 'https://varbsuhixqbzlzkdlnmy.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhcmJzdWhpeHFiemx6a2Rsbm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MTMzODcsImV4cCI6MjA4MTk4OTM4N30.TMUFeIREQGcd6znytjvV4dDuXPqZ0kbGsjeoBuSa8Lk',
  enabled: true
};

export const useTaskSync = () => {
  const [state, setState] = useState<AppState>(() => {
    const initialDate = formatDateKey(new Date());
    try {
      const savedData = localStorage.getItem(CURRENT_STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        return { 
          ...parsed, 
          currentDate: initialDate, 
          syncStatus: 'offline' as SyncStatus,
          activeModule: parsed.activeModule || 'tasks',
          taskViewMode: parsed.taskViewMode || 'list',
          docs: parsed.docs || {},
          activeDocId: parsed.activeDocId || null,
          isLogoLocked: parsed.isLogoLocked ?? true
        };
      }
    } catch (e) {}
    
    return {
      tasks: {},
      docs: {},
      lists: {},
      activeModule: 'tasks' as AppModule,
      taskViewMode: 'list' as TaskViewMode,
      activeDocId: null,
      currentDate: initialDate,
      theme: 'dark' as Theme,
      language: 'zh' as Language,
      isLogoLocked: true,
      cloudConfig: DEFAULT_CLOUD_CONFIG,
      syncStatus: 'offline' as SyncStatus,
      user: null
    };
  });

  const hasInitialFetched = useRef(false);
  const hasRolledOver = useRef(false);

  useEffect(() => {
    if (hasRolledOver.current || (state.cloudConfig?.enabled && !hasInitialFetched.current)) return;

    const todayKey = formatDateKey(new Date());
    const unfinishedToMigrate: string[] = [];
    const updatedLists = { ...state.lists };
    const updatedTasks = { ...state.tasks };
    let changed = false;

    Object.keys(state.lists).forEach(dateKey => {
      if (dateKey < todayKey) {
        const taskIds = state.lists[dateKey]?.tasks || [];
        const unfinished = taskIds.filter(id => {
          const task = state.tasks[id];
          return task && task.status !== TaskStatus.DONE;
        });

        if (unfinished.length > 0) {
          changed = true;
          unfinishedToMigrate.push(...unfinished);
          updatedLists[dateKey] = {
            ...updatedLists[dateKey],
            tasks: taskIds.filter(id => !unfinished.includes(id))
          };
          unfinished.forEach(id => {
            updatedTasks[id] = { ...updatedTasks[id], listDate: todayKey };
          });
        }
      }
    });

    if (changed) {
      const todayList = updatedLists[todayKey] || { date: todayKey, tasks: [] };
      updatedLists[todayKey] = {
        ...todayList,
        tasks: [...unfinishedToMigrate, ...todayList.tasks]
      };

      setState(prev => ({
        ...prev,
        tasks: updatedTasks,
        lists: updatedLists
      }));
    }

    hasRolledOver.current = true;
  }, [state.syncStatus, state.user]);

  useEffect(() => {
    localStorage.setItem(CURRENT_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!state.cloudConfig?.enabled || !state.cloudConfig.supabaseUrl || !state.cloudConfig.supabaseKey || !state.user) {
      if (state.syncStatus !== 'offline') setState(prev => ({ ...prev, syncStatus: 'offline' }));
      return;
    }

    const { supabaseUrl, supabaseKey } = state.cloudConfig;
    const userId = state.user.id;
    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${state.user.token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    const performSync = async () => {
      if (!hasInitialFetched.current) {
        setState(prev => ({ ...prev, syncStatus: 'syncing' }));
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/user_data?id=eq.${userId}`, {
            method: 'GET',
            headers
          });
          if (response.ok) {
            const result = await response.json();
            if (result && result.length > 0) {
              const cloudData = result[0].data;
              setState(prev => ({
                ...prev,
                tasks: cloudData.tasks || prev.tasks,
                lists: cloudData.lists || prev.lists,
                docs: cloudData.docs || prev.docs,
                customLogo: cloudData.customLogo || prev.customLogo,
                isLogoLocked: cloudData.isLogoLocked ?? prev.isLogoLocked,
                syncStatus: 'synced',
                lastSyncedAt: new Date().toTimeString().split(' ')[0]
              }));
            }
          }
          hasInitialFetched.current = true;
        } catch (err) {
          setState(prev => ({ ...prev, syncStatus: 'error' }));
          return;
        }
      }

      const pushToCloud = async () => {
        if (!hasInitialFetched.current) return;
        setState(prev => ({ ...prev, syncStatus: 'syncing' }));
        try {
          const payload = { 
            id: userId, 
            data: { 
              tasks: state.tasks, 
              lists: state.lists,
              docs: state.docs,
              customLogo: state.customLogo,
              isLogoLocked: state.isLogoLocked
            } 
          };
          const res = await fetch(`${supabaseUrl}/rest/v1/user_data`, {
            method: 'POST',
            headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
            body: JSON.stringify(payload)
          });
          if (res.ok) setState(prev => ({ ...prev, syncStatus: 'synced', lastSyncedAt: new Date().toTimeString().split(' ')[0] }));
        } catch (err) {
          setState(prev => ({ ...prev, syncStatus: 'error' }));
        }
      };

      const timer = setTimeout(pushToCloud, SYNC_DEBOUNCE_MS);
      return () => clearTimeout(timer);
    };

    performSync();
  }, [state.tasks, state.lists, state.docs, state.customLogo, state.isLogoLocked, state.user, state.cloudConfig?.enabled]);

  const addDoc = (parentId: string | null = null, initial?: Partial<Document>) => {
    const id = crypto.randomUUID();
    const newDoc: Document = {
      id,
      title: initial?.title || '',
      content: initial?.content || '',
      updatedAt: Date.now(),
      isPinned: false,
      images: [],
      parentId: parentId,
      order: Date.now(),
      linkedTaskIds: initial?.linkedTaskIds || []
    };
    setState(prev => ({
      ...prev,
      docs: { ...prev.docs, [id]: newDoc },
      activeDocId: id
    }));
    return id;
  };

  const updateDoc = (id: string, updates: Partial<Document>) => setState(prev => {
    const doc = prev.docs[id];
    if (!doc) return prev;
    return {
      ...prev,
      docs: { ...prev.docs, [id]: { ...doc, ...updates, updatedAt: Date.now() } }
    };
  });

  const deleteDoc = (id: string) => setState(prev => {
    const newDocs = { ...prev.docs };
    (Object.values(newDocs) as Document[]).forEach(d => {
      if (d.parentId === id) d.parentId = null;
    });
    delete newDocs[id];
    return {
      ...prev,
      docs: newDocs,
      activeDocId: prev.activeDocId === id ? null : prev.activeDocId
    };
  });

  const moveDoc = (docId: string, newParentId: string | null, newOrder: number) => setState(prev => {
    const doc = prev.docs[docId];
    if (!doc) return prev;
    const normalizedParentId = newParentId || null;
    if (normalizedParentId) {
      if (normalizedParentId === docId) return prev;
      let checkId: string | null = normalizedParentId;
      while (checkId) {
        if (checkId === docId) return prev;
        checkId = prev.docs[checkId]?.parentId || null;
      }
    }
    return {
      ...prev,
      docs: { 
        ...prev.docs, 
        [docId]: { 
          ...doc, 
          parentId: normalizedParentId, 
          order: newOrder,
          updatedAt: Date.now()
        } 
      }
    };
  });

  const generateAiSolution = async (taskId: string) => {
    const task = state.tasks[taskId];
    if (!task) return;
    const keywords = task.name.split(' ').filter(k => k.length > 1);
    const relevantDocs = (Object.values(state.docs) as Document[]).filter(doc => {
      const matchInTitle = keywords.some(k => doc.title.toLowerCase().includes(k.toLowerCase()));
      const matchInContent = keywords.some(k => doc.content.toLowerCase().includes(k.toLowerCase()));
      return matchInTitle || matchInContent;
    }).slice(0, 5);
    const context = relevantDocs.map(d => `Document: ${d.title}\nContent: ${d.content}`).join('\n\n---\n\n');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Task: "${task.name}"\nDescription: "${task.description}"\n\nBased on these relevant documents from my Knowledge Base:\n${context}\n\nProvide a concise solution or actionable steps for this task.`,
        config: {
          systemInstruction: `You are a professional strategist. If relevant knowledge exists, use it. If not, provide general best practices. Language: ${state.language === 'zh' ? 'Chinese' : 'English'}. Format as markdown.`,
          temperature: 0.7,
        },
      });
      if (response.text) updateTask(taskId, { aiSolution: response.text });
    } catch (e) {
      console.error('Failed to generate AI solution:', e);
    }
  };

  const linkTaskToDoc = (taskId: string, docId: string) => setState(prev => {
    const task = prev.tasks[taskId];
    const doc = prev.docs[docId];
    if (!task || !doc) return prev;
    const taskDocs = new Set(task.linkedDocIds || []);
    const docTasks = new Set(doc.linkedTaskIds || []);
    taskDocs.add(docId);
    docTasks.add(taskId);
    return {
      ...prev,
      tasks: { ...prev.tasks, [taskId]: { ...task, linkedDocIds: Array.from(taskDocs) } },
      docs: { ...prev.docs, [docId]: { ...doc, linkedTaskIds: Array.from(docTasks) } }
    };
  });

  const saveSolutionToKB = async (taskId: string, targetDocId?: string) => {
    const task = state.tasks[taskId];
    if (!task || !task.aiSolution) return;
    if (targetDocId) {
      const doc = state.docs[targetDocId];
      if (doc) {
        const newContent = doc.content + `\n\n---\n### AI Solution for Task: ${task.name}\n` + task.aiSolution;
        updateDoc(targetDocId, { content: newContent });
        linkTaskToDoc(taskId, targetDocId);
      }
    } else {
      const newDocId = addDoc(null, {
        title: `Solution: ${task.name}`,
        content: `# AI Solution for ${task.name}\n\n${task.aiSolution}`,
        linkedTaskIds: [taskId]
      });
      linkTaskToDoc(taskId, newDocId);
    }
  };

  const setActiveDocId = (id: string | null) => setState(prev => ({ ...prev, activeDocId: id }));
  const setModule = (module: AppModule) => setState(prev => ({ ...prev, activeModule: module }));
  const setCurrentDate = (date: string) => setState(prev => ({ ...prev, currentDate: date }));

  const addTask = (name: string, description: string, images: string[], priority: Priority = 'P1') => {
    const id = crypto.randomUUID();
    const newTask: Task = { id, name, description, status: TaskStatus.TODO, priority, createdAt: Date.now(), images, listDate: state.currentDate };
    setState(prev => ({ ...prev, tasks: { ...prev.tasks, [id]: newTask }, lists: { ...prev.lists, [prev.currentDate]: { ...prev.lists[prev.currentDate], tasks: [id, ...(prev.lists[prev.currentDate]?.tasks || [])] } } }));
  };

  const updateTask = (id: string, updates: Partial<Task>) => setState(prev => {
    const task = prev.tasks[id];
    if (!task) return prev;
    let completedAt = task.completedAt;
    if (updates.status === TaskStatus.DONE && task.status !== TaskStatus.DONE) completedAt = getNowTimestamp();
    return { ...prev, tasks: { ...prev.tasks, [id]: { ...task, ...updates, completedAt } } };
  });

  const deleteTask = (id: string) => setState(prev => {
    const newTasks = { ...prev.tasks }; delete newTasks[id];
    const newLists = { ...prev.lists };
    Object.keys(newLists).forEach(d => { if(newLists[d]) newLists[d].tasks = newLists[d].tasks.filter(tid => tid !== id); });
    return { ...prev, tasks: newTasks, lists: newLists };
  });

  return { 
    state, setModule,
    setCurrentDate, addTask, updateTask, deleteTask, reorderTasks: (date: string, ids: string[]) => setState(prev => ({ ...prev, lists: { ...prev.lists, [date]: { ...prev.lists[date], tasks: ids } } })),
    addDoc, updateDoc, deleteDoc, setActiveDocId, moveDoc, generateAiSolution,
    linkTaskToDoc, saveSolutionToKB,
    toggleTheme: () => setState(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' })),
    toggleLanguage: () => setState(prev => ({ ...prev, language: prev.language === 'en' ? 'zh' : 'en' })),
    toggleTaskViewMode: () => setState(prev => ({ ...prev, taskViewMode: prev.taskViewMode === 'list' ? 'kanban' : 'list' })),
    toggleLogoLock: () => setState(prev => ({ ...prev, isLogoLocked: !prev.isLogoLocked })),
    setState, updateCloudConfig: (config: any) => setState(prev => ({ ...prev, cloudConfig: { ...prev.cloudConfig!, ...config } })),
    login: (user: User) => setState(prev => ({ ...prev, user })),
    logout: () => setState(prev => ({ ...prev, user: null, tasks: {}, lists: {}, docs: {}, syncStatus: 'offline' })),
    setCustomLogo: (logo: string) => setState(prev => ({ ...prev, customLogo: logo }))
  };
};
