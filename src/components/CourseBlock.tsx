import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Course, Session, GridConfig } from '@/types/schedule';
import { cn, formatTime, isLightColor } from '@/lib/utils';
import { CourseMenu } from './CourseMenu';
import { useRef, useState, useEffect, useCallback, forwardRef } from 'react';

interface CourseBlockProps {
  session: Session & { course: Course };
  style?: React.CSSProperties;
  onDelete: (id: string) => void;
  isDragging?: boolean;
  onResize?: (newEnd: string) => void;
  gridConfig: GridConfig;
}

export const CourseBlock = forwardRef<HTMLDivElement, CourseBlockProps>(
  ({ session, style, onDelete, isDragging, onResize, gridConfig }, ref) => {
    const [isResizing, setIsResizing] = useState(false);
    const course = session.course || { title: 'Unknown Course', color: '#3B82F6' };

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      isDragging: isDraggingNow
    } = useDraggable({
      id: session.id,
      data: {
        type: 'session',
        session: { ...session, course }
      }
    });

    const handleResizeStart = (e: React.MouseEvent) => {
      if (!onResize) return;
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
    };

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent drag from starting
      onDelete(session.id);
    };

    useEffect(() => {
      if (!isResizing) return;

      const handleMouseMove = (e: MouseEvent) => {
        if (!onResize) return;
        const rect = (ref as React.RefObject<HTMLDivElement>).current?.getBoundingClientRect();
        if (!rect) return;

        const gridHeight = rect.height;
        const mouseY = e.clientY - rect.top;
        const hourHeight = gridHeight / (gridConfig.endHour - gridConfig.startHour);
        const totalHours = mouseY / hourHeight;
        const hours = Math.floor(totalHours);
        const minutes = Math.round((totalHours - hours) * 60);

        const newEnd = `${(gridConfig.startHour + hours).toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        onResize(newEnd);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isResizing, onResize, gridConfig, ref]);

    const backgroundColor = course.color || '#3B82F6';
    const isLight = isLightColor(backgroundColor);
    
    const finalStyle: React.CSSProperties = {
      ...style,
      backgroundColor,
      cursor: isResizing ? 'ns-resize' : 'move',
      userSelect: 'none',
      touchAction: 'none',
      transform: isDragging ? undefined : CSS.Transform.toString(transform),
      transition: isDragging ? 'none' : 'transform 0.2s ease-in-out'
    };

    const isCurrentlyDragging = isDragging || isDraggingNow;

    return (
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className={`relative group ${isCurrentlyDragging ? 'opacity-70' : ''}`}
        style={finalStyle}
      >
        <div className="p-2">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-sm">{course.title}</h3>
              <p className="text-xs opacity-80">{`${session.start} - ${session.end}`}</p>
            </div>
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 text-white hover:text-red-200 transition-opacity"
              aria-label="Delete course"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        {!isCurrentlyDragging && (
          <div
            className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize bg-black bg-opacity-20 hover:bg-opacity-30"
            onMouseDown={handleResizeStart}
          />
        )}
      </div>
    );
  }
); 