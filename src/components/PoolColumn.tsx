import { Course, Pool, Session, GridConfig } from '@/types/schedule';
import { CourseBlock } from './CourseBlock';
import { calculateHeight, calculateTop } from '@/lib/utils';

interface PoolColumnProps {
  pool: Pool;
  sessions: (Session & { course: Course })[];
  courses: Course[];
  gridConfig: GridConfig;
  onDeleteSession: (sessionId: string) => void;
  onResize: (sessionId: string, newEnd: string) => void;
  onGridDoubleClick: (event: React.MouseEvent, poolDayId: string) => void;
  onDragStart: (event: React.DragEvent, session: Session) => void;
  onDragOver: (event: React.DragEvent, poolDayId: string) => void;
  onDrop: (event: React.DragEvent, poolDayId: string) => void;
}

export function PoolColumn({
  pool,
  sessions,
  courses,
  gridConfig,
  onDeleteSession,
  onResize,
  onGridDoubleClick,
  onDragStart,
  onDragOver,
  onDrop
}: PoolColumnProps) {
  // Generate array of hours for grid lines
  const hours = Array.from(
    { length: gridConfig.endHour - gridConfig.startHour + 1 },
    (_, i) => gridConfig.startHour + i
  );

  const handleDragOver = (e: React.DragEvent, poolDayId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    onDragOver(e, poolDayId);
  };

  const handleDrop = (e: React.DragEvent, poolDayId: string) => {
    e.preventDefault();
    e.stopPropagation();
    onDrop(e, poolDayId);
  };

  return (
    <div className="flex-1 flex h-full">
      {pool.days.map(day => (
        <div
          key={day.id}
          onDoubleClick={(e) => onGridDoubleClick(e, day.id)}
          onDragOver={(e) => handleDragOver(e, day.id)}
          onDrop={(e) => handleDrop(e, day.id)}
          className="flex-1 relative border-r last:border-r-0 h-full"
        >
          {/* Hour grid lines */}
          {hours.map(hour => (
            <div
              key={hour}
              className="absolute w-full border-t border-dotted border-gray-200"
              style={{
                top: `${(hour - gridConfig.startHour) * 60}px`,
                left: 0,
                right: 0,
                pointerEvents: 'none'
              }}
            />
          ))}
          
          {sessions
            .filter(session => session.poolDayId === day.id)
            .map(session => {
              const course = courses.find(c => c.id === session.courseId);
              if (!course) return null;

              const height = calculateHeight(session.start, session.end);
              const top = calculateTop(session.start, gridConfig.startHour);

              return (
                <CourseBlock
                  key={session.id}
                  session={{...session, course}}
                  style={{
                    height: `${height}px`,
                    top: `${top}px`,
                    position: 'absolute',
                    width: 'calc(100% - 8px)',
                    left: '4px',
                    zIndex: 1,
                    cursor: 'move'
                  }}
                  onDelete={() => onDeleteSession(session.id)}
                  gridConfig={gridConfig}
                  onResize={(newEnd) => onResize(session.id, newEnd)}
                  onDragStart={(e) => onDragStart(e, session)}
                  draggable={true}
                />
              );
            })}
        </div>
      ))}
    </div>
  );
}