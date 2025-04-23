import { Course, Pool, Session, GridConfig } from '@/types/schedule';
import { CourseBlock } from './CourseBlock';
import { calculateHeight, calculateTop } from '@/lib/utils';

interface PoolColumnProps {
  pool: Pool;
  courses: Course[];
  sessions: Session[];
  gridConfig: GridConfig;
  onDeleteSession: (id: string) => void;
  onResize: (sessionId: string, newEnd: string) => void;
  onSessionClick: (session: Session) => void;
  onGridClick: (event: React.MouseEvent, poolDayId: string) => void;
  activeSessionId?: string;
}

export function PoolColumn({
  pool,
  courses,
  sessions,
  gridConfig,
  onDeleteSession,
  onResize,
  onSessionClick,
  onGridClick,
  activeSessionId
}: PoolColumnProps) {
  return (
    <div className="flex-1 flex">
      {pool.days.map(day => (
        <div
          key={day.id}
          onClick={(e) => onGridClick(e, day.id)}
          className="flex-1 relative border-r last:border-r-0"
        >
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
                    left: '4px'
                  }}
                  onDelete={() => onDeleteSession(session.id)}
                  gridConfig={gridConfig}
                  onResize={(newEnd) => onResize(session.id, newEnd)}
                  onClick={onSessionClick}
                  isActive={session.id === activeSessionId}
                />
              );
            })}
        </div>
      ))}
    </div>
  );
}