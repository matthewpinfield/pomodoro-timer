export function TimerStats() {
  return (
    <div className="grid grid-cols-3 gap-4 my-4">
      <div className="flex flex-col items-center">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
          <span className="text-xs text-gray-500">TODO</span>
        </div>
        <span className="text-sm font-medium">3</span>
      </div>

      <div className="flex flex-col items-center">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
          <span className="text-xs text-gray-500">IN PROGRESS</span>
        </div>
        <span className="text-sm font-medium">1</span>
      </div>

      <div className="flex flex-col items-center">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
          <span className="text-xs text-gray-500">DONE</span>
        </div>
        <span className="text-sm font-medium">5</span>
      </div>
    </div>
  )
}

