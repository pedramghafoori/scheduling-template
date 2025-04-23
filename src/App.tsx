import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DndContext, DragEndEvent, DragStartEvent, pointerWithin } from "@dnd-kit/core";
import Index from "./pages/Index";
import Manage from "./pages/Manage";
import NotFound from "./pages/NotFound";
import { useDragStore } from "./stores/dragStore";
import { useScheduleStore } from "./stores/scheduleStore";
import { DEFAULT_SESSION_DURATION } from "./lib/constants";
import { DayOfWeek } from "./lib/types";
import { yPosToTime, snapToGrid } from "./lib/utils";

const COLUMN_HEADER_HEIGHT = 32; // px height of .pool-header

const queryClient = new QueryClient();

const AppContent = () => {
  const { startDrag, endDrag } = useDragStore();
  const { deleteSession, createSession, updateSession } = useScheduleStore();

  const handleDragStart = (event: DragStartEvent) => {
    console.log('App handleDragStart - Full event:', {
      activeId: event.active.id,
      activeData: event.active.data.current,
      type: event.active.data.current?.type
    });

    const { active } = event;
    const { session, courseId, type } = active.data.current || {};
    
    if (type === "bank-block" && courseId) {
      // Create a temporary session for dragging from bank
      const tempSession = {
        id: `temp-${courseId}-${Date.now()}`,
        courseId,
        poolId: "", // Empty string means it's in the bank
        day: "Monday" as DayOfWeek, // Default day
        start: 0,
        end: DEFAULT_SESSION_DURATION,
      };
      
      console.log("Creating temp session for bank block:", tempSession);
      const activatorY = (event.activatorEvent as MouseEvent).clientY;
      const blockTop = active.rect.current?.initial?.top ?? 0;
      const offsetY = activatorY - blockTop;
      startDrag(tempSession, offsetY);
    } else if (type === "grid-block" && session) {
      console.log("Starting drag for grid block:", session);
      const activatorY = (event.activatorEvent as MouseEvent).clientY;
      const blockTop = active.rect.current?.initial?.top ?? 0;
      const offsetY = activatorY - blockTop;
      startDrag(session, offsetY);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    console.log('App handleDragEnd - Full event:', {
      activeId: event.active?.id,
      activeData: event.active?.data.current,
      overId: event.over?.id,
      overData: event.over?.data.current
    });
    
    const { active, over } = event;
    
    if (!active || !over) {
      console.log('No active or over element, ending drag');
      endDrag();
      return;
    }
    
    const dragData = active.data.current;
    console.log('Processing drag end with data:', dragData);
    
    // If dropped onto the bank, delete the session
    if (over.id === "course-bank" && dragData?.type === "grid-block") {
      const session = dragData.session;
      if (session?.id) {
        console.log("Deleting session from bank:", session);
        deleteSession(session.id);
        endDrag();
      }
    } else if (over.data.current?.type === "pool-day") {
      // Handle drop on pool day
      const { poolId, day } = over.data.current;
      const { session, type } = dragData || {};
      
      if (session) {
        console.log("Dropping session on pool day:", {
          sessionId: session.id,
          newPoolId: poolId,
          newDay: day,
          oldPoolId: session.poolId,
          oldDay: session.day
        });

        const { pointerY, dragSession } = useDragStore.getState();

        if (type === "bank-block") {
          // Determine drop time from live pointer
          const yInside =
            (pointerY ?? 0) - (dragSession?.offsetY ?? 0) - COLUMN_HEADER_HEIGHT;
          const snappedY = snapToGrid(yInside);
          const startMinutes = yPosToTime(snappedY);
          const endMinutes   = startMinutes + DEFAULT_SESSION_DURATION;
        
          createSession(
            session.courseId,
            poolId,
            day,
            startMinutes,
            endMinutes
          );
        }
        else if (type === "grid-block") {
          // Move or reschedule an existing session
          const yInside =
            (pointerY ?? 0) - (dragSession?.offsetY ?? 0) - COLUMN_HEADER_HEIGHT;
          const snappedY = snapToGrid(yInside);
          const newStart = yPosToTime(snappedY);
          const duration  = session.end - session.start;
          const newEnd   = newStart + duration;

          updateSession(session.id, {
            poolId,
            day,
            start: newStart,
            end: newEnd,
          });
        }
      }
    }
    
    endDrag();
  };

  return (
    <DndContext 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
      collisionDetection={pointerWithin}
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/manage" element={<Manage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </DndContext>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppContent />
  </QueryClientProvider>
);

export default App;
