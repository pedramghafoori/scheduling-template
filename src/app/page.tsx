'use client';

import { useState } from 'react';
import { ScheduleGrid } from '@/components/ScheduleGrid';
import { useScheduleStore } from '@/store/scheduleStore';
import { DayOfWeek, Pool, PoolDay } from '@/types/schedule';
import Link from 'next/link';
import { PoolHoursModal } from '@/components/PoolHoursModal';
import { PoolMenu } from '@/components/PoolMenu';

export default function Home() {
  const { 
    pools, 
    courses, 
    sessions, 
    addPool, 
    updatePoolDay, 
    moveCourse, 
    deletePool,
    addSession,
    deleteSession 
  } = useScheduleStore();
  const [isAddingPool, setIsAddingPool] = useState(false);
  const [newPoolTitle, setNewPoolTitle] = useState('');
  const [newPoolLocation, setNewPoolLocation] = useState('');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [poolForHours, setPoolForHours] = useState<Pool | null>(null);
  const [editingPool, setEditingPool] = useState<Pool | null>(null);

  const DAYS_OF_WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const handleAddPool = () => {
    if (!newPoolTitle || selectedDays.length === 0) return;

    const poolId = `pool-${Date.now()}`;
    const days = selectedDays.map(day => ({
      id: `day-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      poolId,
      day
    }));

    const newPool: Pool = {
      id: poolId,
      title: newPoolTitle,
      location: newPoolLocation,
      days
    };

    addPool(newPool);
    setPoolForHours(newPool);
    setIsAddingPool(false);
    setNewPoolTitle('');
    setNewPoolLocation('');
    setSelectedDays([]);
  };

  const handleDuplicatePool = (pool: Pool) => {
    const newId = `pool-${Date.now()}`;
    const newDays = pool.days.map(day => ({
      ...day,
      id: `day-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      poolId: newId
    }));

    const duplicatedPool: Pool = {
      ...pool,
      id: newId,
      title: `${pool.title} (Copy)`,
      days: newDays
    };

    addPool(duplicatedPool);
  };

  const handlePoolHoursSave = (poolId: string, days: PoolDay[]) => {
    days.forEach(day => {
      updatePoolDay(day.id, { hoursOpen: day.hoursOpen });
    });
    setPoolForHours(null);
    setEditingPool(null);
  };

  const handleSessionDragEnd = (sessionId: string, newPoolDayId: string, newStart: string, newEnd: string) => {
    moveCourse(sessionId, newPoolDayId, newStart, newEnd);
  };

  const handleAddSession = (courseId: string, poolDayId: string, start: string, end: string) => {
    addSession({
      courseId,
      poolDayId,
      start,
      end
    });
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
  };

  return (
    <main className="min-h-screen p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Scheduler</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setIsAddingPool(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Pool
          </button>
          <Link href="/manage" className="px-4 py-2 text-blue-500 hover:text-blue-700">
            Manage Courses
          </Link>
        </div>
      </div>

      {pools.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium text-gray-600 mb-4">Welcome to Scheduler</h2>
          <p className="text-gray-500 mb-6">Get started by adding a pool to create your schedule</p>
          <button
            onClick={() => setIsAddingPool(true)}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Add Your First Pool
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {pools.map(pool => (
            <div key={pool.id} className="bg-white rounded-lg border shadow-sm">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">{pool.title}</h2>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500">{pool.location}</div>
                    <PoolMenu
                      pool={pool}
                      onDelete={deletePool}
                      onDuplicate={handleDuplicatePool}
                      onAdjustDetails={(pool) => setEditingPool(pool)}
                    />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <ScheduleGrid
                  pools={[pool]}
                  courses={courses}
                  sessions={sessions.filter(session => pool.days.some(day => day.id === session.poolDayId))}
                  onSessionDragEnd={handleSessionDragEnd}
                  onAddSession={handleAddSession}
                  onDeleteSession={handleDeleteSession}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {isAddingPool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Add New Pool</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Pool Name</label>
                <input
                  type="text"
                  value={newPoolTitle}
                  onChange={(e) => setNewPoolTitle(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter pool name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  value={newPoolLocation}
                  onChange={(e) => setNewPoolLocation(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Available Days</label>
                <div className="grid grid-cols-2 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <label key={day} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedDays.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDays([...selectedDays, day]);
                          } else {
                            setSelectedDays(selectedDays.filter(d => d !== day));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="capitalize">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setIsAddingPool(false);
                  setNewPoolTitle('');
                  setNewPoolLocation('');
                  setSelectedDays([]);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPool}
                disabled={!newPoolTitle || selectedDays.length === 0}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                Add Pool
              </button>
            </div>
          </div>
        </div>
      )}

      {(poolForHours || editingPool) && (
        <PoolHoursModal
          pool={poolForHours || editingPool!}
          onSave={handlePoolHoursSave}
          onClose={() => {
            setPoolForHours(null);
            setEditingPool(null);
          }}
        />
      )}
    </main>
  );
}
