import { generateTimeSlots } from '@/lib/utils';
import { GridConfig } from '@/types/schedule';

interface HourLabelsProps {
  gridConfig: GridConfig;
}

export function HourLabels({ gridConfig }: HourLabelsProps) {
  const { startHour, endHour } = gridConfig;
  const timeSlots = generateTimeSlots(startHour, endHour, 60);

  return (
    <div className="w-16 flex-shrink-0">
      <div className="h-[41px]" /> {/* Header spacer */}
      <div className="relative h-full">
        {timeSlots.map((time, index) => (
          <div
            key={time}
            className="absolute w-full text-right pr-2 text-sm text-gray-500"
            style={{ top: `${index * 60}px` }}
          >
            {time}
          </div>
        ))}
      </div>
    </div>
  );
} 