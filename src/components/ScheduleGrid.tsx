import { useScheduleStore } from "@/stores/scheduleStore";
import { useDragStore } from "@/stores/dragStore";
import { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import HourLabels from "./HourLabels";
import PoolCanvas from "./PoolCanvas";
import { DEFAULT_SESSION_DURATION } from "@/lib/constants";
import { createDragImage } from "@/lib/utils";
import { DayOfWeek } from "@/lib/types";

const ScheduleGrid = () => {
  const { pools, updateSession, deleteSession } = useScheduleStore();
  const { startDrag, endDrag } = useDragStore();

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { session, courseId, type } = active.data.current || {};
    
    console.log("Grid drag start:", { type, courseId, session });
    
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
      
      startDrag(tempSession, 30); // Assume middle of the block (60px/2)
    } else if (type === "grid-block" && session) {
      startDrag(session, 30); // This can be refined to get actual offset
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log("Grid drag end:", { 
      activeId: active?.id,
      activeType: active?.data.current?.type,
      overId: over?.id,
      overType: over?.data.current?.type
    });
    
    if (!active || !over) {
      endDrag();
      return;
    }
    
    const dragData = active.data.current;
    
    // If dropped onto the bank, delete the session
    if (over.id === "course-bank" && dragData?.type === "grid-block") {
      const session = dragData.session;
      if (session?.id) {
        console.log("Deleting session:", session.id);
        deleteSession(session.id);
        endDrag();
      }
    } else if (over.data.current?.type === "pool-day") {
      // Let the PoolDayColumn handle the drop
      console.log("Grid: Letting PoolDayColumn handle the drop");
    } else {
      endDrag();
    }
  };

  return (
    <div className="flex-1 flex overflow-x-auto schedule-grid">
      <HourLabels />
      {pools.map((pool) => (
        <PoolCanvas
          key={pool.id}
          pool={pool}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      ))}
    </div>
  );
};

export default ScheduleGrid;
