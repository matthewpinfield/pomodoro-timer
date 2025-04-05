import Link from "next/link"
import { Home, Clock, List, BarChart2, Settings } from "lucide-react"

interface BottomNavigationProps {
  activeTab: string
}

export function BottomNavigation({ activeTab }: BottomNavigationProps) {
  const tabs = [
    { id: "home", icon: Home, label: "Home" },
    { id: "stats", icon: BarChart2, label: "Stats" },
    { id: "timer", icon: Clock, label: "Timer" },
    { id: "tasks", icon: List, label: "Tasks" },
    { id: "settings", icon: Settings, label: "Settings" },
  ]

  return (
    <div className="sticky bottom-0 bg-white border-t py-2 px-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = tab.id === activeTab

            return (
              <Link
                key={tab.id}
                href="#"
                className={`flex flex-col items-center p-2 ${isActive ? "text-red-500" : "text-gray-500"}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs mt-1">{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

