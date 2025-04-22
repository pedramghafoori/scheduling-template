'use client';

import { useState } from 'react';
import { useScheduleStore } from '@/store/scheduleStore';
import { Course, Pool, DayOfWeek, Session } from '@/types/schedule';
import Link from 'next/link';

const DAYS_OF_WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

interface CourseFormData {
  title: string;
  totalHours: number;
  instructorId?: string;
  minDuration?: number;
  requiredSpacing?: number;
  color?: string;
}

export default function ManagePage() {
  const { pools, courses, sessions, addPool, addCourse, addSession, updateCourse, deleteCourse } = useScheduleStore();
  const [isAddingPool, setIsAddingPool] = useState(false);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [newPool, setNewPool] = useState({
    title: '',
    location: '',
    days: [] as { day: DayOfWeek; id: string; poolId: string }[]
  });
  const [newCourse, setNewCourse] = useState({
    title: '',
    totalHours: 0
  });
  const [newSession, setNewSession] = useState({
    start: '',
    end: '',
    poolDayId: ''
  });
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [courseFormData, setCourseFormData] = useState<CourseFormData>({
    title: '',
    totalHours: 0,
    instructorId: '',
    minDuration: 0,
    requiredSpacing: 0,
    color: '#3B82F6' // default blue color
  });

  const handleAddPool = (e: React.FormEvent) => {
    e.preventDefault();
    const poolId = `pool-${Date.now()}`;
    const days = selectedDays.map(day => ({
      day,
      id: `day-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      poolId
    }));
    
    addPool({
      title: newPool.title,
      location: newPool.location,
      days
    });
    
    setNewPool({ title: '', location: '', days: [] });
    setSelectedDays([]);
    setIsAddingPool(false);
  };

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    addCourse({
      title: newCourse.title,
      totalHours: newCourse.totalHours
    });
    setNewCourse({ title: '', totalHours: 0 });
    setIsAddingCourse(false);
  };

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    addSession({
      courseId: selectedCourse,
      poolDayId: newSession.poolDayId,
      start: newSession.start,
      end: newSession.end
    });
    setNewSession({ start: '', end: '', poolDayId: '' });
  };

  // Calculate remaining hours for a course
  const getRemainingHours = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return 0;

    const courseSessions = sessions.filter(s => s.courseId === courseId);
    const scheduledHours = courseSessions.reduce((total, session) => {
      const [startHour, startMinute] = session.start.split(':').map(Number);
      const [endHour, endMinute] = session.end.split(':').map(Number);
      const duration = (endHour - startHour) + (endMinute - startMinute) / 60;
      return total + duration;
    }, 0);

    return course.totalHours - scheduledHours;
  };

  const handleSubmitCourse = (e: React.FormEvent) => {
    e.preventDefault();
    const courseData = {
      ...courseFormData,
      // Only include optional fields if they have values
      ...(courseFormData.instructorId ? { instructorId: courseFormData.instructorId } : {}),
      ...(courseFormData.minDuration ? { minDuration: courseFormData.minDuration } : {}),
      ...(courseFormData.requiredSpacing ? { requiredSpacing: courseFormData.requiredSpacing } : {}),
      ...(courseFormData.color ? { color: courseFormData.color } : {})
    };

    if (editingCourse) {
      updateCourse(editingCourse, courseData);
    } else {
      addCourse(courseData);
    }

    setIsAddingCourse(false);
    setEditingCourse(null);
    setCourseFormData({
      title: '',
      totalHours: 0,
      instructorId: '',
      minDuration: 0,
      requiredSpacing: 0,
      color: '#3B82F6'
    });
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course.id);
    setCourseFormData({
      title: course.title,
      totalHours: course.totalHours,
      instructorId: course.instructorId || '',
      minDuration: course.minDuration || 0,
      requiredSpacing: course.requiredSpacing || 0,
      color: course.color || '#3B82F6'
    });
    setIsAddingCourse(true);
  };

  const handleDeleteCourse = (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this course? This will also delete all associated sessions.')) {
      deleteCourse(courseId);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Manage Schedule</h1>
          <Link href="/" className="text-blue-500 hover:text-blue-700">
            Back to Schedule
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Pools Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Pools</h2>
              <button
                onClick={() => setIsAddingPool(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Add Pool
              </button>
            </div>

            {isAddingPool && (
              <form onSubmit={handleAddPool} className="mb-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Pool Name</label>
                  <input
                    type="text"
                    value={newPool.title}
                    onChange={(e) => setNewPool({ ...newPool, title: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={newPool.location}
                    onChange={(e) => setNewPool({ ...newPool, location: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Days Available</label>
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
                        <span className="text-sm capitalize">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Save Pool
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingPool(false);
                      setSelectedDays([]);
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {pools.map((pool) => (
                <div key={pool.id} className="p-3 border rounded">
                  <div className="font-medium">{pool.title}</div>
                  <div className="text-sm text-gray-500">{pool.location}</div>
                  <div className="text-sm text-gray-500">
                    Days: {pool.days.map(d => d.day).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Courses Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Courses</h2>
              {!isAddingCourse && (
                <button
                  onClick={() => setIsAddingCourse(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Add Course
                </button>
              )}
            </div>

            {isAddingCourse && (
              <form onSubmit={handleSubmitCourse} className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-medium mb-4">
                  {editingCourse ? 'Edit Course' : 'Add New Course'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Course Name *</label>
                    <input
                      type="text"
                      value={courseFormData.title}
                      onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Total Hours *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={courseFormData.totalHours}
                      onChange={(e) => setCourseFormData({ ...courseFormData, totalHours: parseFloat(e.target.value) })}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Instructor ID</label>
                    <input
                      type="text"
                      value={courseFormData.instructorId}
                      onChange={(e) => setCourseFormData({ ...courseFormData, instructorId: e.target.value })}
                      className="w-full p-2 border rounded"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Minimum Duration (hours)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={courseFormData.minDuration}
                      onChange={(e) => setCourseFormData({ ...courseFormData, minDuration: parseFloat(e.target.value) })}
                      className="w-full p-2 border rounded"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Required Spacing (hours)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={courseFormData.requiredSpacing}
                      onChange={(e) => setCourseFormData({ ...courseFormData, requiredSpacing: parseFloat(e.target.value) })}
                      className="w-full p-2 border rounded"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Color</label>
                    <input
                      type="color"
                      value={courseFormData.color}
                      onChange={(e) => setCourseFormData({ ...courseFormData, color: e.target.value })}
                      className="w-full h-10 p-1 border rounded"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    {editingCourse ? 'Save Changes' : 'Add Course'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCourse(false);
                      setEditingCourse(null);
                      setCourseFormData({
                        title: '',
                        totalHours: 0,
                        instructorId: '',
                        minDuration: 0,
                        requiredSpacing: 0,
                        color: '#3B82F6'
                      });
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {courses.map((course) => (
                <div 
                  key={course.id} 
                  className="p-4 border rounded hover:shadow-sm transition-shadow"
                  style={{ borderLeft: `4px solid ${course.color || '#3B82F6'}` }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{course.title}</div>
                      <div className="text-sm text-gray-500 space-y-1">
                        <div>Total Hours: {course.totalHours}h | Remaining: {getRemainingHours(course.id)}h</div>
                        {course.instructorId && (
                          <div>Instructor ID: {course.instructorId}</div>
                        )}
                        {course.minDuration && (
                          <div>Minimum Duration: {course.minDuration}h</div>
                        )}
                        {course.requiredSpacing && (
                          <div>Required Spacing: {course.requiredSpacing}h</div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditCourse(course)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 space-y-1">
                    {sessions
                      .filter(s => s.courseId === course.id)
                      .map((session) => {
                        const poolDay = pools
                          .flatMap(p => p.days)
                          .find(d => d.id === session.poolDayId);
                        const pool = pools.find(p => p.id === poolDay?.poolId);
                        
                        return (
                          <div key={session.id} className="text-sm text-gray-600">
                            {pool?.title} - {poolDay?.day}: {session.start} - {session.end}
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 