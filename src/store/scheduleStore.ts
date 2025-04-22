import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Course, Pool, PoolDay, Session, ScheduleState, UserRole } from '@/types/schedule';

interface ScheduleActions {
  addPool: (pool: Omit<Pool, 'id'>) => void;
  updatePool: (id: string, updates: Partial<Omit<Pool, 'id' | 'days'>>) => void;
  deletePool: (id: string) => void;
  addPoolDay: (poolId: string, day: Omit<PoolDay, 'id' | 'poolId'>) => void;
  updatePoolDay: (id: string, updates: Partial<Omit<PoolDay, 'id' | 'poolId'>>) => void;
  deletePoolDay: (id: string) => void;
  addCourse: (course: Omit<Course, 'id'>) => void;
  updateCourse: (id: string, updates: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  addSession: (session: Omit<Session, 'id'>) => void;
  updateSession: (id: string, updates: Partial<Session>) => void;
  deleteSession: (id: string) => void;
  setUserRole: (role: UserRole) => void;
  initializeData: (pools: Pool[], courses: Course[], sessions: Session[]) => void;
  moveCourse: (sessionId: string, newPoolDayId: string, newStart?: string, newEnd?: string) => void;
}

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const initialState: ScheduleState = {
  pools: [],
  courses: [],
  sessions: [],
  currentUser: {
    id: 'default-user',
    role: 'viewer'
  }
};

export const useScheduleStore = create<ScheduleState & ScheduleActions>()(
  persist(
    (set) => ({
      ...initialState,

      initializeData: (pools, courses, sessions) => set({ pools, courses, sessions }),

      addPool: (pool) =>
        set((state) => ({
          pools: [
            ...state.pools,
            {
              ...pool,
              id: generateId('pool'),
              days: pool.days.map(day => ({
                ...day,
                id: generateId('day'),
                poolId: generateId('pool')
              }))
            }
          ]
        })),

      updatePool: (id, updates) =>
        set((state) => ({
          pools: state.pools.map((pool) =>
            pool.id === id ? { ...pool, ...updates } : pool
          )
        })),

      deletePool: (id) =>
        set((state) => {
          const poolDays = state.pools.find(p => p.id === id)?.days.map(d => d.id) || [];
          return {
            pools: state.pools.filter((pool) => pool.id !== id),
            sessions: state.sessions.filter((session) => !poolDays.includes(session.poolDayId))
          };
        }),

      addPoolDay: (poolId, day) =>
        set((state) => ({
          pools: state.pools.map((pool) =>
            pool.id === poolId
              ? {
                  ...pool,
                  days: [
                    ...pool.days,
                    {
                      ...day,
                      id: generateId('day'),
                      poolId
                    }
                  ]
                }
              : pool
          )
        })),

      updatePoolDay: (id, updates) =>
        set((state) => ({
          pools: state.pools.map((pool) => ({
            ...pool,
            days: pool.days.map((day) =>
              day.id === id ? { ...day, ...updates } : day
            )
          }))
        })),

      deletePoolDay: (id) =>
        set((state) => ({
          pools: state.pools.map((pool) => ({
            ...pool,
            days: pool.days.filter((day) => day.id !== id)
          })),
          sessions: state.sessions.filter((session) => session.poolDayId !== id)
        })),

      addCourse: (course) =>
        set((state) => ({
          courses: [...state.courses, { ...course, id: generateId('course') }]
        })),

      updateCourse: (id, updates) =>
        set((state) => ({
          courses: state.courses.map((course) =>
            course.id === id ? { ...course, ...updates } : course
          )
        })),

      deleteCourse: (id) =>
        set((state) => ({
          courses: state.courses.filter((course) => course.id !== id),
          sessions: state.sessions.filter((session) => session.courseId !== id)
        })),

      addSession: (session) =>
        set((state) => ({
          sessions: [...state.sessions, { ...session, id: generateId('session') }]
        })),

      updateSession: (id, updates) =>
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === id ? { ...session, ...updates } : session
          )
        })),

      deleteSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((session) => session.id !== id)
        })),

      moveCourse: (sessionId: string, newPoolDayId: string, newStart?: string, newEnd?: string) =>
        set((state) => {
          const session = state.sessions.find(s => s.id === sessionId);
          if (!session) return state;

          return {
            sessions: state.sessions.map((s) =>
              s.id === sessionId
                ? {
                    ...s,
                    poolDayId: newPoolDayId,
                    start: newStart || s.start,
                    end: newEnd || s.end
                  }
                : s
            )
          };
        }),

      setUserRole: (role) =>
        set((state) => ({
          currentUser: { ...state.currentUser, role }
        }))
    }),
    {
      name: 'schedule-storage'
    }
  )
); 