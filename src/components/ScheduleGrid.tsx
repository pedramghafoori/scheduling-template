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
    
    console.log('Drag Start:', {
      sessionId: session.id,
      currentPoolDayId: session.poolDayId,
      offsetY,
      sessionTime: `${session.start}-${session.end}`
    });
    
    setDragSession({ session, offsetY });
    
    // Store drag session data in dataTransfer
    event.dataTransfer.setData('application/json', JSON.stringify({ 
      sessionId: session.id,
      offsetY,
      start: session.start,
      end: session.end
    }));
  };

  const handleDragOver = (event: React.DragEvent, poolDayId: string) => {
    event.preventDefault();
    console.log('Drag Over:', {
      poolDayId,
      clientY: event.clientY,
      dragSession: dragSession?.session.id
    });
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (event: React.DragEvent, poolDayId: string) => {
    event.preventDefault();
    
    // Try to get drag data from dataTransfer if dragSession is lost
    let activeDragSession = dragSession;
    if (!activeDragSession) {
      try {
        const dragData = JSON.parse(event.dataTransfer.getData('application/json'));
        const session = sessions.find(s => s.id === dragData.sessionId);
        if (session) {
          activeDragSession = { session, offsetY: dragData.offsetY };
        }
      } catch (e) {
        console.log('Drop failed:', { reason: 'Could not restore drag session' });
        return;
      }
    }
    
    if (!activeDragSession || !gridRef.current) {
      console.log('Drop failed:', { reason: !activeDragSession ? 'No drag session' : 'No grid ref' });
      return;
    }
    
    const gridRect = gridRef.current.getBoundingClientRect();
    const relativeY = event.clientY - gridRect.top - activeDragSession.offsetY;
    
    console.log('Drop Calculations:', {
      gridTop: gridRect.top,
      clientY: event.clientY,
      offsetY: activeDragSession.offsetY,
      relativeY,
      gridHeight: gridRect.height
    });
    
    // Calculate clicked time
    const totalGridHeight = gridRect.height;
    const hoursInGrid = defaultGridConfig.endHour - defaultGridConfig.startHour + 1;
    const pixelsPerHour = totalGridHeight / hoursInGrid;
    
    // Calculate hours and minutes from drop position
    const clickedHours = relativeY / pixelsPerHour;
    const absoluteHour = defaultGridConfig.startHour + Math.floor(clickedHours);
    const minutes = Math.floor((clickedHours % 1) * 60 / defaultGridConfig.stepMinutes) * defaultGridConfig.stepMinutes;
    
    console.log('Time Calculations:', {
      hoursInGrid,
      pixelsPerHour,
      clickedHours,
      absoluteHour,
      minutes
    });
    
    // Calculate session duration
    const [startHour, startMinute] = activeDragSession.session.start.split(':').map(Number);
    const [endHour, endMinute] = activeDragSession.session.end.split(':').map(Number);
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

    console.log('Final Position:', {
      oldPoolDayId: activeDragSession.session.poolDayId,
      newPoolDayId: poolDayId,
      oldTime: `${activeDragSession.session.start}-${activeDragSession.session.end}`,
      newTime: `${newStart}-${newEnd}`,
      sessionDuration
    });

    // Move the session to the new pool day and position
    onSessionDragEnd(activeDragSession.session.id, poolDayId, newStart, newEnd);
    setDragSession(null);
  };

  const handleGridDoubleClick = (event: React.MouseEvent, poolDayId: string) => {
    if (!gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const relativeY = event.clientY - gridRect.top;
    
    // Calculate clicked time
    const totalGridHeight = gridRect.height;
    const hoursInGrid = defaultGridConfig.endHour - defaultGridConfig.startHour + 1; // Add 1 to include the end hour
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
    const hoursInGrid = defaultGridConfig.endHour - defaultGridConfig.startHour + 1; // Add 1 to include the end hour
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
      {/* Headers */}
      <div className="flex border-b">
        <div className="w-12" /> {/* Spacer for hour labels */}
        <div className="flex-1 flex">
          {pools.map(pool => (
            <div key={pool.id} className="flex-1">
              {/* Pool title */}
              <div className="font-bold p-2 text-center bg-gray-50 border-b">
                {pool.title}
              </div>
              {/* Day headers */}
              <div className="flex">
                {pool.days.map(day => (
                  <div key={day.id} className="flex-1 font-medium p-2 text-center">
                    {day.day.charAt(0).toUpperCase() + day.day.slice(1)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div 
        ref={gridRef} 
        className="flex" 
        style={{ 
          height: `${(defaultGridConfig.endHour - defaultGridConfig.startHour + 1) * 60}px`,
          minHeight: `${(defaultGridConfig.endHour - defaultGridConfig.startHour + 1) * 60}px`
        }}
      >
        <HourLabels gridConfig={defaultGridConfig} />
        <div className="flex-1 flex h-full">
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