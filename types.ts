
export enum TaskStatus {
  TODO = 'todo',
  DOING = 'doing',
  DONE = 'done'
}

export type Priority = 'P0' | 'P1' | 'P2';
export type Theme = 'dark' | 'light';
export type Language = 'en' | 'zh';
export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';
export type AppModule = 'tasks' | 'kb';
export type TaskViewMode = 'list' | 'kanban';

export interface User {
  id: string;
  email: string;
  token: string;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  createdAt: number;
  completedAt?: string;
  images: string[];
  listDate: string;
  aiSolution?: string; 
  linkedDocIds?: string[]; // 关联的知识库文档
}

export interface Document {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  isPinned: boolean;
  images: string[];
  parentId: string | null;
  order: number;
  linkedTaskIds?: string[]; // 关联的任务
}

export interface DayList {
  date: string;
  tasks: string[];
}

export interface CloudConfig {
  supabaseUrl: string;
  supabaseKey: string;
  enabled: boolean;
}

export interface AppState {
  tasks: Record<string, Task>;
  docs: Record<string, Document>;
  lists: Record<string, DayList>;
  activeModule: AppModule;
  taskViewMode: TaskViewMode;
  activeDocId: string | null;
  currentDate: string;
  theme: Theme;
  language: Language;
  customLogo?: string;
  isLogoLocked?: boolean;
  cloudConfig?: CloudConfig;
  syncStatus?: SyncStatus;
  lastSyncedAt?: string;
  user?: User | null;
}
