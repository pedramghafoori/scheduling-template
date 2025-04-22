import { useDroppable } from '@dnd-kit/core';
import { Course, Pool, PoolDay, Session } from '@/types/schedule';
import { CourseBlock } from './CourseBlock';
import { calculateHeight, calculateTop, cn, minutesToTime } from '@/lib/utils';
import { GridConfig } from '@/types/schedule';
import { useState } from 'react';
import { AddCoursePopup } from './AddCoursePopup';

interface PoolColumnProps {
  pool: Pool;
  courses: Course[];
  sessions: Session[];
  gridConfig: GridConfig;
  onAddSession: (courseId: string, poolDayId: string, start: string, end: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onResize: (sessionId: string, newEnd: string) => void;
}

interface PoolDayColumnProps {
  pool: Pool;
  day: PoolDay;
  courses: Course[];
  sessions: Session[];
  gridConfig: GridConfig;
  onAddSession: (courseId: string, poolDayId: string, start: string, end: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onResize: (sessionId: string, newEnd: string) => void;
}

function PoolDayColumn({ pool, day, courses, sessions, gridConfig, onAddSession, onDeleteSession, onResize }: PoolDayColumnProps) {
  const [popupState, setPopupState] = useState<{ x: number; y: number } | null>(null);
  const { setNodeRef, isOver } = useDroppable({
    id: day.id,
    data: {
      type: 'pool-day',
      pool,
      day
    }
  });

  const daySessions = sessions.filter(session => session.poolDayId === day.id);
  const { startHour, stepMinutes } = gridConfig;
  const totalMinutes = (gridConfig.endHour - gridConfig.startHour) * 60;
  const pixelsPerMinute = 780 / totalMinutes; // 780px total height / total minutes

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // Calculate time based on click position
    const clickedMinutes = Math.floor(y / pixelsPerMinute);
    const snappedMinutes = Math.floor(clickedMinutes / stepMinutes) * stepMinutes;
    const totalMinutes = startHour * 60 + snappedMinutes;
    
    setPopupState({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleCourseSelect = (courseId: string) => {
    if (!popupState) return;

    const rect = document.querySelector(`[data-day-id="${day.id}"]`)?.getBoundingClientRect();
    if (!rect) return;

    const y = popupState.y - rect.top;
    const clickedMinutes = Math.floor(y / pixelsPerMinute);
    const snappedMinutes = Math.floor(clickedMinutes / stepMinutes) * stepMinutes;
    const totalMinutes = startHour * 60 + snappedMinutes;

    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const defaultDuration = course.minDuration || 1; // Default to 1 hour if no minimum duration
    const startTime = minutesToTime(totalMinutes);
    const endTime = minutesToTime(totalMinutes + defaultDuration * 60);

    onAddSession(courseId, day.id, startTime, endTime);
    setPopupState(null);
  };

  return (
    <div className="flex-1 min-w-[200px] h-full">
      <div className="font-medium p-2 text-center border-b bg-gray-100">
        {day.day.charAt(0).toUpperCase() + day.day.slice(1)}
      </div>
      <div
        ref={setNodeRef}
        data-schedule-grid
        data-day-id={day.id}
        onDoubleClick={handleDoubleClick}
        className={cn(
          'relative',
          'border-r last:border-r-0',
          'overflow-hidden',
          isOver && 'bg-blue-50',
          'transition-colors'
        )}
        style={{
          height: '780px',
          position: 'relative',
          contain: 'strict'
        }}
      >
        {daySessions.map(session => {
          const course = courses.find(c => c.id === session.courseId);
          if (!course) return null;

          const height = calculateHeight(session.start, session.end) * pixelsPerMinute;
          const top = calculateTop(session.start, startHour) * pixelsPerMinute;

          return (
            <CourseBlock
              key={session.id}
              session={session}
              course={course}
              style={{
                height: `${height}px`,
                top: `${top}px`,
                position: 'absolute',
                width: 'calc(100% - 8px)',
                left: '4px',
                maxHeight: '100%'
              }}
              onDelete={() => onDeleteSession(session.id)}
              onResize={(newEnd) => onResize(session.id, newEnd)}
              gridConfig={gridConfig}
            />
          );
        })}

        {popupState && (
          <AddCoursePopup
            courses={courses}
            position={popupState}
            onSelect={handleCourseSelect}
            onClose={() => setPopupState(null)}
          />
        )}
      </div>
    </div>
  );
}

export function PoolColumn({ pool, courses, sessions, gridConfig, onAddSession, onDeleteSession, onResize }: PoolColumnProps) {
  return (
    <div className="w-full mb-8">
      <div className="font-bold p-2 text-center border-b bg-gray-50">
        {pool.title}
      </div>
      <div className="flex flex-row">
        {pool.days.map((day) => (
          <PoolDayColumn
            key={day.id}
            pool={pool}
            day={day}
            courses={courses}
            sessions={sessions}
            gridConfig={gridConfig}
            onAddSession={onAddSession}
            onDeleteSession={onDeleteSession}
            onResize={onResize}
          />
        ))}
      </div>
    </div>
  );
} 