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
      distance: 8,
      delay: 0
    }
  });
  
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 100,
      tolerance: 8,
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
    
    // Log initial coordinates
    const startPoint = event.activatorEvent as PointerEvent;
    const gridElement = document.querySelector(`[data-day-id="${active.data.current?.poolDayId}"]`);
    const initialCoordinates = {
      clientX: startPoint.clientX,
      clientY: startPoint.clientY,
      pageX: startPoint.pageX,
      pageY: startPoint.pageY,
      scrollY: window.scrollY,
      gridBounds: gridElement?.getBoundingClientRect()
    };
    
    console.log('Drag started:', {
      sessionId,
      activeData: active.data.current,
      coordinates: initialCoordinates
    });
    
    setActiveId(sessionId);
    
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      const course = courses.find(c => c.id === session.courseId);
      if (course) {
        setActiveSession({ ...session, course });
      }
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || !active.data.current) return;

    const gridElement = document.querySelector(`[data-day-id="${over.id}"]`);
    if (!gridElement) return;

    const gridRect = gridElement.getBoundingClientRect();
    const scrollOffset = gridElement.scrollTop;
    const dropPoint = event.activatorEvent as PointerEvent;
    
    // Calculate position relative to the grid's viewport position
    const pointerY = dropPoint.clientY;
    const gridTop = gridRect.top;
    let relativeY = pointerY - gridTop + scrollOffset;
    
    // Strictly constrain to grid bounds
    relativeY = Math.max(0, Math.min(relativeY, gridRect.height));
    
    const hourHeight = gridRect.height / (defaultGridConfig.endHour - defaultGridConfig.startHour);
    
    // Convert to hours and minutes, ensuring we stay within grid bounds
    const totalHours = relativeY / hourHeight;
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    
    // Calculate time in minutes since start of day, ensuring we stay within bounds
    const dropTimeInMinutes = Math.min(
      defaultGridConfig.endHour * 60,
      Math.max(
        defaultGridConfig.startHour * 60,
        (defaultGridConfig.startHour + hours) * 60 + minutes
      )
    );
    
    const snappedMinutes = snapToGrid(
      dropTimeInMinutes - (defaultGridConfig.startHour * 60),
      defaultGridConfig.stepMinutes
    );
    const newStartMinutes = defaultGridConfig.startHour * 60 + snappedMinutes;
    
    // Get the session and calculate duration
    const session = sessions.find(s => s.id === active.id);
    if (!session) return;

    const sessionDuration = calculateHeight(session.start, session.end);
    
    // Ensure the session stays within grid bounds
    const maxStartMinutes = (defaultGridConfig.endHour * 60) - sessionDuration;
    const finalStartMinutes = Math.min(Math.max(defaultGridConfig.startHour * 60, newStartMinutes), maxStartMinutes);
    const finalEndMinutes = finalStartMinutes + sessionDuration;
    
    // Only update if the position is valid
    if (finalStartMinutes >= defaultGridConfig.startHour * 60 && 
        finalEndMinutes <= defaultGridConfig.endHour * 60) {
      const newStart = minutesToTime(finalStartMinutes);
      const newEnd = minutesToTime(finalEndMinutes);
      
      const updatedSession = { ...session, poolDayId: over.id as string, start: newStart, end: newEnd };
      setActiveSession(prev => prev ? { ...prev, ...updatedSession } : null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    console.log('Drag ended:', {
      activeId: active.id,
      overId: over?.id,
      activeData: active.data.current,
      overData: over?.data.current
    });
    
    if (over && active.data.current) {
      const session = sessions.find(s => s.id === active.id);
      if (!session) {
        console.warn('No session found for drag end:', active.id);
        return;
      }
      
      const gridElement = document.querySelector(`[data-day-id="${over.id}"]`);
      if (!gridElement) {
        console.warn('No grid element found for drag end:', over.id);
        return;
      }
      
      const gridRect = gridElement.getBoundingClientRect();
      const scrollOffset = gridElement.scrollTop;
      const dropPoint = event.activatorEvent as PointerEvent;
      
      console.log('Drop coordinates:', {
        clientY: dropPoint.clientY,
        gridTop: gridRect.top,
        scrollOffset,
        gridHeight: gridRect.height
      });
      
      // Calculate relative position within grid
      let relativeY = dropPoint.clientY - gridRect.top + scrollOffset;
      relativeY = Math.max(0, Math.min(relativeY, gridRect.height));
      
      console.log('Calculated position:', {
        relativeY,
        gridHeight: gridRect.height
      });
      
      // Convert to grid time
      const hourHeight = gridRect.height / (defaultGridConfig.endHour - defaultGridConfig.startHour);
      const totalHours = relativeY / hourHeight;
      const hours = Math.floor(totalHours);
      const minutes = Math.round((totalHours - hours) * 60);
      
      const dropTimeInMinutes = (defaultGridConfig.startHour + hours) * 60 + minutes;
      
      console.log('Time calculations:', {
        hourHeight,
        totalHours,
        hours,
        minutes,
        dropTimeInMinutes
      });
      
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
      
      console.log('Final position:', {
        finalStartMinutes,
        finalEndMinutes,
        sessionDuration
      });
      
      // Convert to time format
      const newStart = minutesToTime(finalStartMinutes);
      const newEnd = minutesToTime(finalEndMinutes);
      
      console.log('Updating session:', {
        sessionId: session.id,
        newPoolDayId: over.id,
        newStart,
        newEnd
      });
      
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
          
          {pools.map(pool => (
            <PoolColumn
              key={pool.id}
              pool={pool}
              sessions={sessions.filter(s => 
                pool.days.some(d => d.id === s.poolDayId)
              )}
              courses={courses}
              gridConfig={defaultGridConfig}
              onAddSession={onAddSession}
              onDeleteSession={onDeleteSession}
              onResize={handleResize}
            />
          ))}
        </div>

        <DragOverlay
          dropAnimation={null}
          modifiers={[restrictToVerticalAxis, restrictToGrid]}
        >
          {activeSession ? (
            <CourseBlock
              session={activeSession}
              course={activeSession.course}
              style={{
                width: '200px',
                height: `${calculateHeight(activeSession.start, activeSession.end) / defaultGridConfig.stepMinutes * 60}px`,
                position: 'relative',
                zIndex: 50
              }}
              isDragging={true}
              gridConfig={defaultGridConfig}
            />
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
} 