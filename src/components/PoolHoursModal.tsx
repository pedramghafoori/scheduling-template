import { DayOfWeek, Pool, PoolDay } from '@/types/schedule';
import { useState } from 'react';

interface PoolHoursModalProps {
  pool: Pool;
  onSave: (poolId: string, days: PoolDay[]) => void;
  onClose: () => void;
}

export function PoolHoursModal({ pool, onSave, onClose }: PoolHoursModalProps) {
  const [days, setDays] = useState<PoolDay[]>(pool.days.map(day => ({
    ...day,
    hoursOpen: { start: '08:00', end: '17:00' }
  })));

  const handleSave = () => {
    onSave(pool.id, days);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Set Pool Hours - {pool.title}</h2>
        <div className="space-y-4">
          {days.map((day, index) => (
            <div key={day.id} className="flex items-center gap-4">
              <div className="w-24 font-medium capitalize">{day.day}</div>
              <div className="flex gap-4 flex-1">
                <div className="flex-1">
                  <label className="block text-sm text-gray-600">Open</label>
                  <input
                    type="time"
                    value={day.hoursOpen?.start || '08:00'}
                    onChange={(e) => {
                      const newDays = [...days];
                      newDays[index] = {
                        ...day,
                        hoursOpen: {
                          ...day.hoursOpen!,
                          start: e.target.value
                        }
                      };
                      setDays(newDays);
                    }}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-600">Close</label>
                  <input
                    type="time"
                    value={day.hoursOpen?.end || '17:00'}
                    onChange={(e) => {
                      const newDays = [...days];
                      newDays[index] = {
                        ...day,
                        hoursOpen: {
                          ...day.hoursOpen!,
                          end: e.target.value
                        }
                      };
                      setDays(newDays);
                    }}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save Hours
          </button>
        </div>
      </div>
    </div>
  );
} 