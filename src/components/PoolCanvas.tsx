import { useRef, useEffect, useState, useCallback } from "react";
import { useDroppable, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { Pool, DayOfWeek } from "@/lib/types";
import { useScheduleStore } from "@/stores/scheduleStore";
import { useDragStore } from "@/stores/dragStore";
import CourseBlock from "./CourseBlock";
import { snapToGrid, yPosToTime } from "@/lib/utils";
import { DEFAULT_SESSION_DURATION } from "@/lib/constants";

interface PoolCanvasProps {
  pool: Pool;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

const PoolCanvas = ({ pool, onDragStart, onDragEnd }: PoolCanvasProps) => {
  const { updateSession, createSession } = useScheduleStore();
  const { dragSession } = useDragStore();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!active || !over || !dragSession) {
      onDragEnd(event);
      return;
    }

    const { type, session, courseId } = active.data.current || {};
    const { poolId, day } = over.data.current || {};

    if ((type === "grid-block" || type === "bank-block") && poolId && day) {
      console.log("Handling drop in PoolCanvas:", {
        type,
        sessionId: session?.id,
        courseId,
        newPoolId: poolId,
        newDay: day,
        oldPoolId: session?.poolId,
        oldDay: session?.day,
        offsetY: dragSession.offsetY
      });

      // Use live pointer position captured during drag
      const { pointerY } = useDragStore.getState();
      const yInsideCalc = (pointerY ?? 0) - (dragSession?.offsetY ?? 0);
      console.log("dragEnd – pointerY:", pointerY, "offsetY:", dragSession?.offsetY, "yInside:", yInsideCalc);
      if (pointerY == null) {
        onDragEnd(event);          // fallback – no valid pointer info
        return;
      }
      const dropTimeMinutes = Math.max(
        0,
        Math.min(
          900,
          yPosToTime(pointerY - (dragSession?.offsetY ?? 0))
        )
      ); // Ensure within bounds (0-900 minutes)
      console.log("dragEnd – dropTimeMinutes:", dropTimeMinutes);

      if (type === "bank-block") {
        // Creating new session from bank
        const newSessionId = createSession(
          courseId,
          poolId,
          day,
          dropTimeMinutes,
          dropTimeMinutes + DEFAULT_SESSION_DURATION
        );
        console.log("Created new session from bank:", newSessionId);
      } else if (session) {
        // Moving existing session
        updateSession(session.id, {
          poolId,
          day,
          start: dropTimeMinutes,
          end: dropTimeMinutes + (session.end - session.start),
        });
        console.log("Updated existing session:", session.id);
      }
    }

    onDragEnd(event);
  };

  return (
    <div className="flex-1 flex overflow-x-auto">
      {pool.days.map((poolDay) => (
        <PoolDayColumn 
          key={poolDay.id} 
          poolId={pool.id}
          day={poolDay.day}
          onDragEnd={handleDragEnd}
        />
      ))}
    </div>
  );
};

interface PoolDayColumnProps {
  poolId: string;
  day: DayOfWeek;
  onDragEnd: (event: DragEndEvent) => void;
}

const PoolDayColumn = ({ poolId, day, onDragEnd }: PoolDayColumnProps) => {
  const { getSessionsForPoolDay } = useScheduleStore();
  const { dragSession, endDrag } = useDragStore();
  const sessions = getSessionsForPoolDay(poolId, day);
  const blockAreaRef = useRef<HTMLDivElement>(null);
  const [mouseY, setMouseY] = useState<number | null>(null);
  
  const { setNodeRef, isOver } = useDroppable({
    id: `${poolId}-${day}`,
    data: {
      type: "pool-day",
      poolId,
      day,
    },
  });

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (blockAreaRef.current && dragSession) {
        const rect = blockAreaRef.current.getBoundingClientRect();
        const relativeY = e.clientY - rect.top;
        setMouseY(relativeY);
        console.log("mousemove – relativeY:", relativeY);
        // keep global drag state in sync
        useDragStore.getState().setPointerY(relativeY);
      }
    },
    [dragSession]
  );

  useEffect(() => {
    if (isOver && dragSession) {
      window.addEventListener("mousemove", handleMouseMove);
      return () => window.removeEventListener("mousemove", handleMouseMove);
    }
  }, [isOver, dragSession, handleMouseMove]);

  useEffect(() => {
    if (!isOver) {
      setMouseY(null);
    }
  }, [isOver]);

  const handleDragEnd = (event: DragEndEvent) => {
    onDragEnd(event);
    endDrag();
  };

  return (
    <div 
      ref={setNodeRef}
      className={`pool-day relative border-r last:border-r-0 w-48 min-w-48 ${isOver ? 'bg-gray-50' : ''}`}
    >
      <div className="pool-header sticky top-0 bg-gray-100 p-2 text-center font-medium">
        {day}
      </div>
      <div className="relative h-full" style={{ minHeight: '900px'}} ref={blockAreaRef}>
        {sessions.map((session) => (
          <CourseBlock
            key={session.id}
            courseId={session.courseId}
            session={session}
            isGrid={true}
          />
        ))}
      </div>
    </div>
  );
};

export default PoolCanvas;
