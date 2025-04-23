import { Course, GridConfig, Pool, Session } from '@/types/schedule';
import { HourLabels } from './HourLabels';
import { PoolColumn } from './PoolColumn';
import { CourseBlock } from './CourseBlock';
import { calculateHeight, minutesToTime } from '@/lib/utils';
import { useState, useRef } from 'react';

interface ScheduleGridProps {
  pools: Pool[];
  courses: Course[];
  sessions: Session[];
  onSessionDragEnd: (sessionId: string, newPoolDayId: string, newStart: string, newEnd: string) => void;
  onAddSession: (courseId: string, poolDayId: string, start: string, end: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

const defaultGridConfig: GridConfig = {
  startHour: 8,
  endHour: 21,
  stepMinutes: 15
};

export function ScheduleGrid({
  pools,
  courses,
  sessions,
  onSessionDragEnd,
  onAddSession,
  onDeleteSession
}: ScheduleGridProps) {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const handleSessionClick = (session: Session) => {
    setActiveSession(activeSession?.id === session.id ? null : session);
  };

  const handleGridClick = (event: React.MouseEvent, poolDayId: string) => {
    if (!activeSession || !gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const relativeY = event.clientY - gridRect.top;
    
    console.log('Click Position:', {
      clientY: event.clientY,
      gridTop: gridRect.top,
      relativeY,
      gridHeight: gridRect.height
    });
    
    // Calculate clicked time
    const totalGridHeight = gridRect.height;
    const hoursInGrid = defaultGridConfig.endHour - defaultGridConfig.startHour;
    const pixelsPerHour = totalGridHeight / hoursInGrid;
    
    // Calculate hours and minutes from click position
    const clickedHours = relativeY / pixelsPerHour;
    const absoluteHour = defaultGridConfig.startHour + Math.floor(clickedHours);
    const minutes = Math.floor((clickedHours % 1) * 60 / defaultGridConfig.stepMinutes) * defaultGridConfig.stepMinutes;
    
    console.log('Time Calculations:', {
      totalGridHeight,
      hoursInGrid,
      pixelsPerHour,
      clickedHours,
      absoluteHour,
      minutes,
      adjustedRelativeY: relativeY
    });
    
    // Calculate session duration
    const [startHour, startMinute] = activeSession.start.split(':').map(Number);
    const [endHour, endMinute] = activeSession.end.split(':').map(Number);
    const sessionDuration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    
    // Calculate new start and end times
    const newStartMinutes = absoluteHour * 60 + minutes;
    const newEndMinutes = newStartMinutes + sessionDuration;
    
    console.log('Session Times:', {
      originalStart: `${startHour}:${startMinute}`,
      originalEnd: `${endHour}:${endMinute}`,
      sessionDuration,
      newStartMinutes,
      newEndMinutes
    });
    
    // Ensure times are within grid bounds
    const finalStartMinutes = Math.max(
      defaultGridConfig.startHour * 60,
      Math.min(newStartMinutes, defaultGridConfig.endHour * 60 - sessionDuration)
    );
    const finalEndMinutes = finalStartMinutes + sessionDuration;
    
    // Convert to time format
    const newStart = minutesToTime(finalStartMinutes);
    const newEnd = minutesToTime(finalEndMinutes);
    
    console.log('Final Times:', {
      newStart,
      newEnd,
      boundedStartMinutes: finalStartMinutes,
      boundedEndMinutes: finalEndMinutes
    });
    
    // Update session position
    onSessionDragEnd(activeSession.id, poolDayId, newStart, newEnd);
    setActiveSession(null);
  };

  const handleResize = (sessionId: string, newEnd: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const [endHours, endMinutes] = newEnd.split(':').map(Number);
    const endTimeInMinutes = endHours * 60 + endMinutes;
    const startTimeInMinutes = parseInt(session.start.split(':')[0]) * 60 + parseInt(session.start.split(':')[1]);

    if (endTimeInMinutes > startTimeInMinutes) {
      onSessionDragEnd(sessionId, session.poolDayId, session.start, newEnd);
    }
  };

  return (
    <div className="flex flex-col border rounded-lg bg-white shadow-sm">
      {/* Pool title */}
      <div className="font-bold p-2 text-center bg-gray-50 border-b">
        {pools[0]?.title}
      </div>

      {/* Day headers */}
      <div className="flex border-b">
        <div className="w-12" /> {/* Spacer for hour labels */}
        {pools[0]?.days.map(day => (
          <div key={day.id} className="flex-1 font-medium p-2 text-center">
            {day.day.charAt(0).toUpperCase() + day.day.slice(1)}
          </div>
        ))}
      </div>

      {/* Grid content */}
      <div
        ref={gridRef}
        className="flex"
        style={{
          height: `${(defaultGridConfig.endHour - defaultGridConfig.startHour) * 60}px`,
        }}
      >
        <HourLabels gridConfig={defaultGridConfig} />
        
        {pools.map(pool => {
          const poolSessions = sessions.filter(s => {
            if (!pool.days.some(d => d.id === s.poolDayId)) return false;
            return courses.some(c => c.id === s.courseId);
          }).map(s => ({
            ...s,
            course: courses.find(c => c.id === s.courseId)!
          }));

          return (
            <PoolColumn
              key={pool.id}
              pool={pool}
              sessions={poolSessions}
              courses={courses}
              gridConfig={defaultGridConfig}
              onDeleteSession={onDeleteSession}
              onResize={handleResize}
              onSessionClick={handleSessionClick}
              onGridClick={handleGridClick}
              activeSessionId={activeSession?.id}
            />
          );
        })}
      </div>
    </div>
  );
} 