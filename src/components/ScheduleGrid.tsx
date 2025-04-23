import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
  DragOverEvent,
  Modifier,
} from '@dnd-kit/core';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { Course, GridConfig, Pool, Session } from '@/types/schedule';
import { HourLabels } from './HourLabels';
import { PoolColumn } from './PoolColumn';
import { CourseBlock } from './CourseBlock';
import { calculateHeight, minutesToTime, snapToGrid } from '@/lib/utils';
import { useState, useRef } from 'react';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';

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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<(Session & { course: Course }) | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5,
      delay: 0,
      tolerance: 5
    }
  });
  
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 100,
      tolerance: 5,
    },
  });
  
  const sensors = useSensors(mouseSensor, touchSensor);

  // Custom modifier to restrict movement to the grid area
  const restrictToGrid: Modifier = ({transform, draggingNodeRect, containerNodeRect}) => {
    if (!draggingNodeRect || !containerNodeRect) return transform;

    const gridElement = gridRef.current;
    if (!gridElement) return transform;

    const gridRect = gridElement.getBoundingClientRect();
    const maxY = gridElement.scrollHeight - draggingNodeRect.height;
    
    return {
      ...transform,
      y: Math.min(Math.max(0, transform.y), maxY)
    };
  };

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const sessionId = active.id as string;
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const course = courses.find(c => c.id === session.courseId);
    if (!course) return;

    console.log('Drag start:', {
      sessionId,
      session,
      course
    });

    setActiveId(sessionId);
    setActiveSession({ ...session, course });
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || !active.data.current) return;

    console.log('Drag over:', {
      activeId: active.id,
      overId: over.id,
      activeData: active.data.current
    });

    const gridElement = document.querySelector(`[data-day-id="${over.id}"]`);
    if (!gridElement) return;

    const gridRect = gridElement.getBoundingClientRect();
    const dropPoint = event.activatorEvent as PointerEvent;

    // Calculate position relative to the grid
    const pointerX = dropPoint.clientX - gridRect.left;
    const pointerY = dropPoint.clientY - gridRect.top;

    // Calculate the new time slot based on the drop position
    const timeSlotWidth = gridRect.width / 24;
    const timeSlotHeight = gridRect.height / 12;
    const newTimeSlot = Math.floor(pointerX / timeSlotWidth);
    const newDaySlot = Math.floor(pointerY / timeSlotHeight);

    // Convert to time format
    const newStart = `${newTimeSlot.toString().padStart(2, '0')}:00`;
    const newEnd = `${(newTimeSlot + 1).toString().padStart(2, '0')}:00`;

    // Get the session and calculate duration
    const session = sessions.find(s => s.id === active.id);
    if (!session) return;

    const sessionDuration = calculateHeight(session.start, session.end);
    
    // Ensure the session stays within grid bounds
    const maxStartMinutes = (defaultGridConfig.endHour * 60) - sessionDuration;
    const finalStartMinutes = Math.min(Math.max(defaultGridConfig.startHour * 60, newTimeSlot * 60), maxStartMinutes);
    const finalEndMinutes = finalStartMinutes + sessionDuration;

    // Only update if the position is valid
    if (finalStartMinutes >= defaultGridConfig.startHour * 60 && 
        finalEndMinutes <= defaultGridConfig.endHour * 60) {
      const newStart = minutesToTime(finalStartMinutes);
      const newEnd = minutesToTime(finalEndMinutes);
      
      const course = courses.find(c => c.id === session.courseId);
      if (!course) return;

      const updatedSession = { ...session, course, poolDayId: over.id as string, start: newStart, end: newEnd };
      console.log('Updating active session:', updatedSession);
      setActiveSession(prev => prev ? { ...prev, ...updatedSession } : null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (!over) {
      // If dropped outside the grid, delete the session
      onDeleteSession(active.id as string);
      setActiveSession(null);
      return;
    }

    if (over && active.data.current) {
      const session = sessions.find(s => s.id === active.id);
      if (!session) return;
      
      const gridElement = document.querySelector(`[data-day-id="${over.id}"]`);
      if (!gridElement) return;
      
      const gridRect = gridElement.getBoundingClientRect();
      const dropPoint = event.activatorEvent as PointerEvent;
      
      // Calculate relative position within grid
      let relativeY = dropPoint.clientY - gridRect.top;
      relativeY = Math.max(0, Math.min(relativeY, gridRect.height));
      
      // Convert to grid time
      const hourHeight = gridRect.height / (defaultGridConfig.endHour - defaultGridConfig.startHour);
      const totalHours = relativeY / hourHeight;
      const hours = Math.floor(totalHours);
      const minutes = Math.round((totalHours - hours) * 60);
      
      const dropTimeInMinutes = (defaultGridConfig.startHour + hours) * 60 + minutes;
      
      // Calculate session duration
      const sessionDuration = calculateHeight(session.start, session.end);
      
      // Ensure new position stays within grid bounds
      const finalStartMinutes = Math.max(
        defaultGridConfig.startHour * 60,
        Math.min(
          dropTimeInMinutes,
          defaultGridConfig.endHour * 60 - sessionDuration
        )
      );
      const finalEndMinutes = finalStartMinutes + sessionDuration;
      
      // Convert to time format
      const newStart = minutesToTime(finalStartMinutes);
      const newEnd = minutesToTime(finalEndMinutes);
      
      // Update session position
      onSessionDragEnd(session.id, over.id as string, newStart, newEnd);
    }
    
    setActiveSession(null);
  }

  const handleResize = (sessionId: string, newEnd: string) => {
    console.log('Resize request:', {
      sessionId,
      newEnd
    });

    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
      console.warn('No session found for resize:', sessionId);
      return;
    }

    const [endHours, endMinutes] = newEnd.split(':').map(Number);
    const endTimeInMinutes = endHours * 60 + endMinutes;
    const startTimeInMinutes = parseInt(session.start.split(':')[0]) * 60 + parseInt(session.start.split(':')[1]);

    console.log('Resize time calculations:', {
      sessionId,
      currentStart: session.start,
      currentEnd: session.end,
      newEnd,
      startTimeInMinutes,
      endTimeInMinutes,
      duration: endTimeInMinutes - startTimeInMinutes
    });

    if (endTimeInMinutes > startTimeInMinutes) {
      console.log('Applying resize:', {
        sessionId,
        newEnd
      });
      onSessionDragEnd(sessionId, session.poolDayId, session.start, newEnd);
    } else {
      console.warn('Invalid resize - end time before start time:', {
        sessionId,
        startTime: session.start,
        newEnd
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={gridRef}
        className="flex flex-col border rounded-lg bg-white shadow-sm"
        style={{
          height: `${(defaultGridConfig.endHour - defaultGridConfig.startHour) * 60 + 40}px`,
          position: 'relative',
          contain: 'strict',
          overflow: 'hidden'
        }}
      >
        <div className="flex h-full">
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
                onAddSession={onAddSession}
                onDeleteSession={onDeleteSession}
                onResize={handleResize}
              />
            );
          })}
        </div>

        <DragOverlay
          dropAnimation={null}
          modifiers={[restrictToVerticalAxis, restrictToGrid]}
        >
          {activeSession ? (
            <CourseBlock
              session={activeSession}
              style={{
                width: '200px',
                height: `${calculateHeight(activeSession.start, activeSession.end)}px`,
                position: 'absolute',
                zIndex: 50,
                pointerEvents: 'none'
              }}
              isDragging={true}
              gridConfig={defaultGridConfig}
              onDelete={onDeleteSession}
            />
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
} 