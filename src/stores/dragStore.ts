import { create } from "zustand";
import { DragSession, Session } from "@/lib/types";

interface DragState {
  dragSession: DragSession | null;
  isDragging: boolean;
  pointerY: number | null;
  setPointerY: (y: number) => void;
  startDrag: (session: Session, offsetY: number) => void;
  endDrag: () => void;
}

export const useDragStore = create<DragState>((set) => ({
  dragSession: null,
  isDragging: false,
  pointerY: null,

  startDrag: (session: Session, offsetY: number) => {
    set({ 
      dragSession: { session, offsetY },
      pointerY: offsetY,
      isDragging: true 
    });
  },

  setPointerY: (y) => set((s) => ({ ...s, pointerY: y })),

  endDrag: () => {
    set({ 
      dragSession: null,
      pointerY: null,
      isDragging: false 
    });
  },
}));
