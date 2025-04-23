
import { create } from "zustand";
import { DragSession, Session } from "@/lib/types";

interface DragState {
  dragSession: DragSession | null;
  isDragging: boolean;
  startDrag: (session: Session, offsetY: number) => void;
  endDrag: () => void;
}

export const useDragStore = create<DragState>((set) => ({
  dragSession: null,
  isDragging: false,
  
  startDrag: (session: Session, offsetY: number) => {
    set({ 
      dragSession: { session, offsetY },
      isDragging: true 
    });
  },
  
  endDrag: () => {
    set({ 
      dragSession: null,
      isDragging: false 
    });
  },
}));
