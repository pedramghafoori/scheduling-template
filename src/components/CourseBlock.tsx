import { Course, Session, GridConfig } from '@/types/schedule';
import { cn, formatTime, isLightColor } from '@/lib/utils';
import { CourseMenu } from './CourseMenu';
import { useRef, useState, useEffect } from 'react';

interface CourseBlockProps {
  session: Session & { course: Course };
  style?: React.CSSProperties;
  onDelete: (id: string) => void;
  onResize?: (newEnd: string) => void;
  gridConfig: GridConfig;
  isActive?: boolean;
  onClick?: (session: Session) => void;
}

export const CourseBlock = ({
  session,
  style,
  onDelete,
  onResize,
  gridConfig,
  isActive,
  onClick
}: CourseBlockProps) => {
  const [isResizing, setIsResizing] = useState(false);
  const course = session.course || { title: 'Unknown Course', color: '#3B82F6' };
  const blockRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(session);
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    if (!onResize) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(session.id);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!onResize) return;
      const rect = blockRef.current?.getBoundingClientRect();
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
  }, [isResizing, onResize, gridConfig]);

  const backgroundColor = course.color || '#3B82F6';
  const isLight = isLightColor(backgroundColor);
  
  const finalStyle: React.CSSProperties = {
    ...style,
    backgroundColor,
    cursor: isResizing ? 'ns-resize' : 'pointer',
    userSelect: 'none',
    opacity: isActive ? 0.7 : 1,
    transition: 'opacity 0.2s ease-in-out, transform 0.2s ease-in-out',
    transform: isActive ? 'scale(0.98)' : undefined
  };

  return (
    <div
      ref={blockRef}
      onClick={handleClick}
      className={cn(
        'relative group rounded-lg shadow-sm',
        isActive && 'ring-2 ring-blue-500'
      )}
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
      {!isActive && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize bg-black bg-opacity-20 hover:bg-opacity-30"
          onMouseDown={handleResizeStart}
        />
      )}
    </div>
  );
}; 