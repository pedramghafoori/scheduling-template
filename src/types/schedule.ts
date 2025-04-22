export type UserRole = 'admin' | 'instructor' | 'viewer';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface PoolDay {
  id: string;
  poolId: string;
  day: DayOfWeek;
  hoursOpen?: {
    start: string;
    end: string;
  };
  maxCourses?: number;
  capacity?: number;
  order?: number;
}

export interface Pool {
  id: string;
  title: string;
  location: string;
  days: PoolDay[];
}

export interface Session {
  id: string;
  courseId: string;
  poolDayId: string;
  start: string;
  end: string;
}

export interface Course {
  id: string;
  title: string;
  totalHours: number;
  instructorId?: string;
  minDuration?: number;
  requiredSpacing?: number;
  color?: string;
}

export interface ScheduleState {
  pools: Pool[];
  courses: Course[];
  sessions: Session[];
  currentUser: {
    id: string;
    role: UserRole;
  };
}

export interface GridConfig {
  startHour: number;
  endHour: number;
  stepMinutes: number;
} 