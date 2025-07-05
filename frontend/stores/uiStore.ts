import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  currentView: string;
  loading: boolean;
  setSidebarOpen: (open: boolean) => void;
  setCurrentView: (view: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  currentView: 'home',
  loading: false,

  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  setCurrentView: (view: string) => set({ currentView: view }),
  setLoading: (loading: boolean) => set({ loading }),
}));