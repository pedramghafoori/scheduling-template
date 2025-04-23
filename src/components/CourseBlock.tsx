import { Course, Session, GridConfig } from '@/types/schedule';
import { cn, formatTime, isLightColor } from '@/lib/utils';
import { CourseMenu } from './CourseMenu';
import { useRef, useState, useEffect } from 'react';

interface CourseBlockProps {
  session: Session & { course: Course };
  style?: React.CSSProperties;
  onDelete: () => void;
  gridConfig: GridConfig;
  onResize: (newEnd: string) => void;
  onDragStart: (event: React.DragEvent<HTMLDivElement>, session: Session) => void;
  onDragEnd: () => void;
  draggable?: boolean;
}

export function CourseBlock({
  session,
  style,
  onDelete,
  gridConfig,
  onResize,
  onDragStart,
  onDragEnd,
  draggable
}: CourseBlockProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [startResizeY, setStartResizeY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const [initialEndTime, setInitialEndTime] = useState('');
  const blockRef = useRef<HTMLDivElement>(null);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onDragStart(e, session);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    if (!onResize || !blockRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    
    setStartResizeY(e.clientY);
    setStartHeight(blockRef.current.offsetHeight);
    setInitialEndTime(session.end);
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!onResize || !blockRef.current) return;

      // Calculate the change in height
      const deltaY = e.clientY - startResizeY;
      const hourHeight = 60; // 1 hour = 60px
      
      // Calculate new height ensuring it doesn't go below minimum
      const minHeight = 30; // Minimum 30px height (30 minutes)
      const newHeight = Math.max(minHeight, startHeight + deltaY);
      
      // Convert height change to minutes
      const heightDiffInMinutes = Math.round((newHeight - startHeight) / hourHeight * 60);
      
      // Parse initial end time
      const [endHour, endMinute] = initialEndTime.split(':').map(Number);
      const initialEndMinutes = endHour * 60 + endMinute;
      
      // Calculate new end time in minutes
      const newEndMinutes = initialEndMinutes + heightDiffInMinutes;
      
      // Ensure new end time doesn't exceed grid bounds
      const maxEndMinutes = gridConfig.endHour * 60;
      const [startHour, startMinute] = session.start.split(':').map(Number);
      const startMinutes = startHour * 60 + startMinute;
      
      // Bound the end time between start time + 15 minutes and grid end
      const boundedEndMinutes = Math.min(
        maxEndMinutes,
        Math.max(
          startMinutes + gridConfig.stepMinutes,
          newEndMinutes
        )
      );
      
      // Convert back to HH:mm format
      const finalHours = Math.floor(boundedEndMinutes / 60);
      const finalMinutes = boundedEndMinutes % 60;
      const newEnd = `${finalHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
      
      onResize(newEnd);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setStartResizeY(0);
      setStartHeight(0);
      setInitialEndTime('');
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, startResizeY, startHeight, initialEndTime, onResize, gridConfig, session]);

  const backgroundColor = session.course.color || '#3B82F6';
  const isLight = isLightColor(backgroundColor);
  
  const finalStyle: React.CSSProperties = {
    ...style,
    backgroundColor,
    cursor: isResizing ? 'ns-resize' : 'move',
    userSelect: 'none',
    transition: isResizing ? 'none' : 'opacity 0.2s ease-in-out',
    color: isLight ? '#000000' : '#FFFFFF'
  };

  return (
    <div
      ref={blockRef}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      draggable={draggable}
      className="relative group rounded-lg shadow-sm"
      style={finalStyle}
    >
      <div className="p-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-sm">{session.course.title}</h3>
            <p className={`text-xs ${isLight ? 'text-black/70' : 'text-white/70'}`}>
              {`${session.start} - ${session.end}`}
            </p>
          </div>
          <button
            onClick={handleDelete}
            className={cn(
              "opacity-0 group-hover:opacity-100 transition-opacity",
              isLight ? "text-black/60 hover:text-red-600" : "text-white/60 hover:text-red-200"
            )}
            aria-label="Delete course"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-opacity-30",
          isLight ? "bg-black/10 hover:bg-black/20" : "bg-white/10 hover:bg-white/20"
        )}
        onMouseDown={handleResizeStart}
      />
    </div>
  );
} 