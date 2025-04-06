"use client"

import { useRef, useEffect, useState } from 'react'

// No type checking for charts since we're using dynamic imports
type ChartComponents = {
  chartType: 'bar' | 'line'
  labels: string[]
  datasets: any[]
}

export default function ChartComponents({ chartType, labels, datasets }: ChartComponents) {
  const chartContainer = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // This code only runs in the browser
    const initChart = async () => {
      try {
        // Check if chart.js is available without actually importing it yet
        if (typeof window === 'undefined') return;
  
        // Dynamically import Chart.js - wrap in try/catch to handle missing module
        try {
          // Use a type assertion to prevent TypeScript errors
          const ChartModule = await import('chart.js' as any);
          const { Chart, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } = ChartModule;
          
          // Register required components
          Chart.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend)
          
          // If we already have a chart, destroy it
          if (chartInstance.current) {
            chartInstance.current.destroy()
          }
          
          // Create the chart context
          const ctx = chartContainer.current?.querySelector('canvas')?.getContext('2d')
          
          if (ctx) {
            // Create the chart
            chartInstance.current = new Chart(ctx, {
              type: chartType,
              data: {
                labels,
                datasets
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Minutes'
                    }
                  }
                }
              }
            })
          }
        } catch (chartError) {
          console.error('Failed to load chart.js:', chartError)
          setError('Chart.js library not available. Please install chart.js package.')
        }
      } catch (error) {
        console.error('Error in chart initialization:', error)
        setError('Failed to initialize chart.')
      }
    }
    
    initChart()
    
    // Clean up
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [chartType, labels, datasets])

  // Show error message if chart.js couldn't be loaded
  if (error) {
    return (
      <div className="h-[300px] flex flex-col items-center justify-center p-4 border rounded-md">
        <p className="text-red-500">{error}</p>
        <div className="mt-4 p-4 w-full bg-gray-50 rounded overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Day</th>
                <th className="text-right p-2">Minutes</th>
              </tr>
            </thead>
            <tbody>
              {labels.map((label, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">{label}</td>
                  <td className="text-right p-2">
                    {datasets[0]?.data[index] || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[300px]" ref={chartContainer}>
      <canvas />
    </div>
  )
} 