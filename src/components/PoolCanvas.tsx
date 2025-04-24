import { useRef, useEffect, useCallback } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Pool, DayOfWeek } from "@/lib/types";
import { useScheduleStore } from "@/stores/scheduleStore";
import { useDragStore } from "@/stores/dragStore";
import CourseBlock from "./CourseBlock";

interface PoolCanvasProps {
  pool: Pool;
}

const PoolCanvas = ({ pool }: PoolCanvasProps) => {
  const { dragSession } = useDragStore();

  return (
    <div className="flex-1 flex overflow-x-auto">
      {pool.days.map((poolDay) => (
        <PoolDayColumn 
          key={poolDay.id} 
          poolId={pool.id}
          day={poolDay.day}
        />
      ))}
    </div>
  );
};

interface PoolDayColumnProps {
  poolId: string;
  day: DayOfWeek;
}

const PoolDayColumn = ({ poolId, day }: PoolDayColumnProps) => {
  const { getSessionsForPoolDay } = useScheduleStore();
  const { dragSession } = useDragStore();
  const sessions = getSessionsForPoolDay(poolId, day);
  const blockAreaRef = useRef<HTMLDivElement>(null);
  
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
        console.log("mousemove – relativeY:", relativeY);
        useDragStore.getState().movePointer(relativeY);
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
