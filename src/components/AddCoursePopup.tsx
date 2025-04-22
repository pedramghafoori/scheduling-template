import { Course } from '@/types/schedule';
import { useEffect, useRef } from 'react';

interface AddCoursePopupProps {
  courses: Course[];
  position: { x: number; y: number };
  onSelect: (courseId: string) => void;
  onClose: () => void;
}

export function AddCoursePopup({ courses, position, onSelect, onClose }: AddCoursePopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className="fixed bg-white rounded-lg shadow-lg border z-50 w-64"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className="p-2 border-b">
        <h3 className="text-sm font-medium">Add Course</h3>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {courses.length === 0 ? (
          <div className="p-4 text-sm text-gray-500 text-center">
            No courses available
          </div>
        ) : (
          <div className="p-1">
            {courses.map(course => (
              <button
                key={course.id}
                onClick={() => onSelect(course.id)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded transition-colors flex items-center space-x-2"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: course.color || '#3B82F6' }}
                />
                <div>
                  <div className="font-medium">{course.title}</div>
                  <div className="text-xs text-gray-500">
                    {course.totalHours}h total
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 