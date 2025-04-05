export function TimerStatsAlt() {
  return (
    <div className="grid grid-cols-2 gap-8 my-4">
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold">42 h</span>
        <div className="flex items-center mt-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full mr-1"></div>
          <span className="text-xs text-gray-500">TOTAL TIME</span>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold">46 m</span>
        <div className="flex items-center mt-1">
          <div className="w-2 h-2 bg-red-400 rounded-full mr-1"></div>
          <span className="text-xs text-gray-500">REMAINING TIME</span>
        </div>
      </div>
    </div>
  )
}

