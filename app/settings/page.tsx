"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { 
  ArrowLeft, 
  Clock, 
  Coffee, 
  PlusCircle,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSettings } from "@/context/settings-context"
import { Toast } from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function SettingsPage() {
  const router = useRouter()
  const { settings, updateSettings, resetSettings: contextResetSettings } = useSettings()
  const { toast } = useToast()
  
  // Local state for form values
  const [formValues, setFormValues] = useState({
    workDuration: settings.workDuration,
    shortBreakDuration: settings.shortBreakDuration,
    longBreakDuration: settings.longBreakDuration,
    cyclesBeforeLongBreak: settings.cyclesBeforeLongBreak,
    workdayHours: settings.workdayHours,
    enableNotifications: settings.enableNotifications,
  })

  // Update form values when settings change (e.g. on initial load)
  useEffect(() => {
    setFormValues({
      workDuration: settings.workDuration,
      shortBreakDuration: settings.shortBreakDuration,
      longBreakDuration: settings.longBreakDuration,
      cyclesBeforeLongBreak: settings.cyclesBeforeLongBreak,
      workdayHours: settings.workdayHours,
      enableNotifications: settings.enableNotifications,
    })
  }, [settings])
  
  // Save settings to context
  const saveSettings = () => {
    updateSettings({
      ...formValues,
      theme: "light" // Always use light theme
    })
    
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated"
    })
    
    router.push("/pie-chart")
  }
  
  // Reset settings to defaults
  const resetSettings = () => {
    contextResetSettings()
    
    toast({
      title: "Settings reset",
      description: "Your settings have been reset to defaults"
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-white p-2 sm:p-4">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pb-2 mb-2 sm:mb-4 flex items-center justify-between w-full border-b border-gray-200/75"
      >
        <Button variant="ghost" size="icon" onClick={() => router.push("/pie-chart")} className="w-10 h-10">
          <ArrowLeft className="h-6 w-6" />
          <span className="sr-only">Back</span>
        </Button>
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-500">Customize your experience</p>
        </div>
        <div className="w-10"></div>
      </motion.header>

      <div className="w-full max-w-3xl mx-auto space-y-6 py-4">
        {/* Timer Settings */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timer Settings
            </CardTitle>
            <CardDescription>
              Configure your Pomodoro timer durations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Work Duration</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    min={1} 
                    max={60}
                    value={formValues.workDuration} 
                    onChange={(e) => setFormValues({
                      ...formValues,
                      workDuration: parseInt(e.target.value) || 25
                    })} 
                    className="w-16 h-8"
                  />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
              </div>
              <Slider 
                value={[formValues.workDuration]} 
                min={1} 
                max={60} 
                step={1}
                onValueChange={(value) => setFormValues({
                  ...formValues,
                  workDuration: value[0]
                })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Short Break Duration</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    min={1} 
                    max={20}
                    value={formValues.shortBreakDuration} 
                    onChange={(e) => setFormValues({
                      ...formValues,
                      shortBreakDuration: parseInt(e.target.value) || 5
                    })} 
                    className="w-16 h-8"
                  />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
              </div>
              <Slider 
                value={[formValues.shortBreakDuration]} 
                min={1} 
                max={20} 
                step={1}
                onValueChange={(value) => setFormValues({
                  ...formValues,
                  shortBreakDuration: value[0]
                })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Long Break Duration</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    min={5} 
                    max={30}
                    value={formValues.longBreakDuration} 
                    onChange={(e) => setFormValues({
                      ...formValues,
                      longBreakDuration: parseInt(e.target.value) || 15
                    })} 
                    className="w-16 h-8"
                  />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
              </div>
              <Slider 
                value={[formValues.longBreakDuration]} 
                min={5} 
                max={30} 
                step={1}
                onValueChange={(value) => setFormValues({
                  ...formValues,
                  longBreakDuration: value[0]
                })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Cycles Before Long Break</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    min={1} 
                    max={10}
                    value={formValues.cyclesBeforeLongBreak} 
                    onChange={(e) => setFormValues({
                      ...formValues,
                      cyclesBeforeLongBreak: parseInt(e.target.value) || 4
                    })} 
                    className="w-16 h-8"
                  />
                  <span className="text-sm text-muted-foreground">cycles</span>
                </div>
              </div>
              <Slider 
                value={[formValues.cyclesBeforeLongBreak]} 
                min={1} 
                max={10} 
                step={1}
                onValueChange={(value) => setFormValues({
                  ...formValues,
                  cyclesBeforeLongBreak: value[0]
                })}
              />
            </div>
          </CardContent>
        </Card>

        {/* General Settings */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>
              Basic application preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Workday Hours</Label>
                <p className="text-sm text-gray-600">Default total hours per day</p>
              </div>
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  min={1} 
                  max={24}
                  value={formValues.workdayHours} 
                  onChange={(e) => setFormValues({
                    ...formValues,
                    workdayHours: parseInt(e.target.value) || 8
                  })} 
                  className="w-16 h-8"
                />
                <span className="text-sm text-gray-600">hours</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Browser Notifications</Label>
                <p className="text-sm text-gray-600">Send alerts when timer is up</p>
              </div>
              <Switch 
                checked={formValues.enableNotifications} 
                onCheckedChange={(checked) => setFormValues({
                  ...formValues,
                  enableNotifications: checked
                })} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={resetSettings}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Defaults
          </Button>
          <Button 
            onClick={saveSettings}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
          >
            Save Settings
          </Button>
        </div>
      </div>
      <Toaster />
    </div>
  )
} 