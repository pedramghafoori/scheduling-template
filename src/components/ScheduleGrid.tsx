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
  endHour: 22,
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
  const [showAddPopup, setShowAddPopup] = useState<{ x: number; y: number; poolDayId: string } | null>(null);
  const [dragSession, setDragSession] = useState<{ session: Session; offsetY: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (event: React.DragEvent, session: Session) => {
    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    const offsetY = event.clientY - rect.top;
    
    setDragSession({ session, offsetY });
    event.dataTransfer.setData('text/plain', session.id); // Required for Firefox
    
    // Create a semi-transparent drag image
    const dragImage = element.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.5';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    event.dataTransfer.setDragImage(dragImage, 0, offsetY);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragOver = (event: React.DragEvent, poolDayId: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (event: React.DragEvent, poolDayId: string) => {
    event.preventDefault();
    
    if (!dragSession || !gridRef.current) return;
    
    const gridRect = gridRef.current.getBoundingClientRect();
    const relativeY = event.clientY - gridRect.top - dragSession.offsetY;
    
    // Calculate clicked time
    const totalGridHeight = gridRect.height;
    const hoursInGrid = defaultGridConfig.endHour - defaultGridConfig.startHour;
    const pixelsPerHour = totalGridHeight / hoursInGrid;
    
    // Calculate hours and minutes from drop position
    const clickedHours = relativeY / pixelsPerHour;
    const absoluteHour = defaultGridConfig.startHour + Math.floor(clickedHours);
    const minutes = Math.floor((clickedHours % 1) * 60 / defaultGridConfig.stepMinutes) * defaultGridConfig.stepMinutes;
    
    // Calculate session duration
    const [startHour, startMinute] = dragSession.session.start.split(':').map(Number);
    const [endHour, endMinute] = dragSession.session.end.split(':').map(Number);
    const sessionDuration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    
    // Calculate new start and end times
    const newStartMinutes = absoluteHour * 60 + minutes;
    const newEndMinutes = newStartMinutes + sessionDuration;
    
    // Ensure times are within grid bounds
    const finalStartMinutes = Math.max(
      defaultGridConfig.startHour * 60,
      Math.min(newStartMinutes, defaultGridConfig.endHour * 60 - sessionDuration)
    );
    const finalEndMinutes = finalStartMinutes + sessionDuration;
    
    // Convert to time format
    const newStart = minutesToTime(finalStartMinutes);
    const newEnd = minutesToTime(finalEndMinutes);

    // Move the session to the new pool day and position
    onSessionDragEnd(dragSession.session.id, poolDayId, newStart, newEnd);
    setDragSession(null);
  };

  const handleGridDoubleClick = (event: React.MouseEvent, poolDayId: string) => {
    if (!gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const relativeY = event.clientY - gridRect.top;
    
    // Calculate clicked time
    const totalGridHeight = gridRect.height;
    const hoursInGrid = defaultGridConfig.endHour - defaultGridConfig.startHour;
    const pixelsPerHour = totalGridHeight / hoursInGrid;
    
    // Calculate hours and minutes from click position
    const clickedHours = relativeY / pixelsPerHour;
    const absoluteHour = defaultGridConfig.startHour + Math.floor(clickedHours);
    const minutes = Math.floor((clickedHours % 1) * 60 / defaultGridConfig.stepMinutes) * defaultGridConfig.stepMinutes;
    
    // Show popup for course selection
    setShowAddPopup({
      x: event.clientX,
      y: event.clientY,
      poolDayId
    });
  };

  const handleAddCourse = (courseId: string) => {
    if (!showAddPopup || !gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const relativeY = showAddPopup.y - gridRect.top;
    
    // Calculate clicked time
    const totalGridHeight = gridRect.height;
    const hoursInGrid = defaultGridConfig.endHour - defaultGridConfig.startHour;
    const pixelsPerHour = totalGridHeight / hoursInGrid;
    
    // Calculate hours and minutes from click position
    const clickedHours = relativeY / pixelsPerHour;
    const absoluteHour = defaultGridConfig.startHour + Math.floor(clickedHours);
    const minutes = Math.floor((clickedHours % 1) * 60 / defaultGridConfig.stepMinutes) * defaultGridConfig.stepMinutes;
    
    const startTime = minutesToTime(absoluteHour * 60 + minutes);
    const endTime = minutesToTime((absoluteHour * 60 + minutes) + 60); // Default 1 hour duration

    onAddSession(courseId, showAddPopup.poolDayId, startTime, endTime);
    setShowAddPopup(null);
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
    <div className="relative">
      <div ref={gridRef} className="flex min-h-[840px]">
        <HourLabels gridConfig={defaultGridConfig} />
        <div className="flex-1 flex">
          {pools.map(pool => (
            <PoolColumn
              key={pool.id}
              pool={pool}
              sessions={sessions
                .filter(session => pool.days.some(day => day.id === session.poolDayId))
                .map(session => ({
                  ...session,
                  course: courses.find(c => c.id === session.courseId)!
                }))}
              courses={courses}
              gridConfig={defaultGridConfig}
              onDeleteSession={onDeleteSession}
              onResize={handleResize}
              onGridDoubleClick={handleGridDoubleClick}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </div>
      {showAddPopup && (
        <div
          className="absolute bg-white shadow-lg rounded-lg p-4 z-50"
          style={{
            left: showAddPopup.x,
            top: showAddPopup.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            {courses.map(course => (
              <button
                key={course.id}
                onClick={() => handleAddCourse(course.id)}
                className="px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 rounded"
                style={{ borderLeftColor: course.color || '#3B82F6' }}
              >
                {course.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 