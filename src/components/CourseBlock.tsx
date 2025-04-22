import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Course, Session, GridConfig } from '@/types/schedule';
import { cn, formatTime, isLightColor } from '@/lib/utils';
import { CourseMenu } from './CourseMenu';
import { useRef, useState, useEffect, useCallback } from 'react';

interface CourseBlockProps {
  session: Session;
  course: Course;
  style?: React.CSSProperties;
  onDelete?: () => void;
  isDragging?: boolean;
  onResize?: (newEnd: string) => void;
  gridConfig: GridConfig;
}

export function CourseBlock({ session, course, style, onDelete, isDragging, onResize, gridConfig }: CourseBlockProps) {
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform
  } = useDraggable({
    id: session.id,
    data: {
      type: 'session',
      session,
      course
    }
  });

  const backgroundColor = course.color || '#3B82F6';
  const isLight = isLightColor(backgroundColor);
  
  const courseStyles: React.CSSProperties = {
    ...style,
    backgroundColor,
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    touchAction: 'none'
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!onResize) return;

    const handleResizeMove = (e: MouseEvent) => {
      if (!isResizing || !resizeRef.current) return;

      const gridElement = resizeRef.current.closest('[data-schedule-grid]');
      if (!gridElement) {
        console.warn('No grid element found for resize operation');
        return;
      }

      const gridRect = gridElement.getBoundingClientRect();
      const y = e.clientY - gridRect.top;
      const hourHeight = gridConfig.stepMinutes * 60;
      const minuteHeight = hourHeight / 60;
      const stepMinutes = 15;

      // Calculate new end time
      const newEndMinutes = Math.floor(y / hourHeight * stepMinutes);
      const snappedMinutes = Math.ceil(newEndMinutes / stepMinutes) * stepMinutes;
      
      // Convert to time string
      const hours = Math.floor(snappedMinutes / 60);
      const minutes = snappedMinutes % 60;
      const newEnd = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      onResize(newEnd);
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, onResize, gridConfig.stepMinutes]);

  const hourHeight = gridConfig.stepMinutes * 60;
  const minuteHeight = hourHeight / 60;

  return (
    <div
      ref={setNodeRef}
      style={courseStyles}
      className={cn(
        'absolute rounded-lg p-2',
        'cursor-grab active:cursor-grabbing',
        isLight ? 'text-gray-800' : 'text-white',
        'hover:brightness-95 transition-all',
        isDragging && 'opacity-50 shadow-lg z-50',
        'select-none',
        isResizing && 'cursor-ns-resize'
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm truncate">{course.title}</div>
          <div className={cn(
            'text-xs',
            isLight ? 'text-gray-600' : 'text-white/90'
          )}>
            {formatTime(session.start)} - {formatTime(session.end)}
          </div>
        </div>
        {onDelete && (
          <div className="flex-shrink-0">
            <CourseMenu onDelete={onDelete} backgroundColor={backgroundColor} />
          </div>
        )}
      </div>
      {onResize && (
        <div
          ref={resizeRef}
          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize"
          onMouseDown={handleResizeStart}
        />
      )}
    </div>
  );
} 