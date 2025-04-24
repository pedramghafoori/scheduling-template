import { useScheduleStore } from "@/stores/scheduleStore";
import HourLabels from "./HourLabels";
import PoolCanvas from "./PoolCanvas";

const ScheduleGrid = () => {
  const { pools } = useScheduleStore();

  return (
    <div className="flex-1 flex overflow-x-auto schedule-grid">
      <HourLabels />
      {pools.map((pool) => (
        <PoolCanvas
          key={pool.id}
          pool={pool}
        />
      ))}
    </div>
  );
};

export default ScheduleGrid;
