"use client";

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./auth-context";

// --- Constants ---
const DEFAULT_WORKDAY_HOURS = 8;
const MIN_WORKDAY_HOURS = 1;
const MAX_WORKDAY_HOURS = 24;
const MONOCHROME_STORAGE_KEY = "focuspie-settings-monochromeChart";
const WORKDAY_HOURS_STORAGE_KEY = "focuspie-settings-workdayHours"; // Use a consistent naming scheme
const SOUND_ENABLED_STORAGE_KEY = "focuspie-settings-soundEnabled";

// --- Types ---
interface SettingsContextType {
  workdayHours: number;
  updateWorkdayHours: (hours: number) => void;
  useMonochromeChart: boolean;
  updateMonochromeChart: (useMonochrome: boolean) => void;
  soundEnabled: boolean;
  updateSoundEnabled: (enabled: boolean) => void;
  // Only ever loaded/saved via Supabase (no localStorage) - the calendar
  // import feature this backs requires being signed in anyway, since the
  // Edge Function that does the actual fetch requires an auth token.
  calendarIcsUrl: string | null;
  updateCalendarIcsUrl: (url: string | null) => void;
  // ISO timestamp of the last successful "Sync calendar" click, so the
  // Calendar page can show the user when they last imported. Set only after
  // a sync actually completes without error - never touched on load.
  calendarLastSyncedAt: string | null;
  setCalendarLastSyncedAt: (iso: string) => void;
  // IANA timezone (e.g. "Europe/London"), recomputed fresh from the browser
  // every session and pushed to Supabase - never restored from a previously
  // synced row, since a stale value (old device, old DST state) would be
  // worse than none. Used server-side to correctly interpret a task's local
  // date+startTime for reminder delivery. No public setter - it's automatic.
  timezone: string | null;
  // Add other settings here later (timer durations, theme)
}

// --- Context Definition ---
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// --- Provider Component ---
export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // --- State ---
  const [workdayHours, setWorkdayHours] = useState<number>(DEFAULT_WORKDAY_HOURS);
  const [useMonochromeChart, setUseMonochromeChart] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [calendarIcsUrl, setCalendarIcsUrl] = useState<string | null>(null);
  const [calendarLastSyncedAt, setCalendarLastSyncedAt] = useState<string | null>(null);
  const [timezone, setTimezone] = useState<string | null>(null);
  const localLoadDoneRef = useRef(false);
  const migrationStartedForUserIdRef = useRef<string | null>(null);
  const [migrationDoneForUserId, setMigrationDoneForUserId] = useState<string | null>(null);

  // Load settings from localStorage on initial render
  useEffect(() => {
    // Load Workday Hours
    const savedHours = localStorage.getItem(WORKDAY_HOURS_STORAGE_KEY);
    if (savedHours) {
      const parsedHours = parseInt(savedHours, 10);
      if (!isNaN(parsedHours) && parsedHours >= MIN_WORKDAY_HOURS && parsedHours <= MAX_WORKDAY_HOURS) {
        setWorkdayHours(parsedHours);
      } else {
         localStorage.removeItem(WORKDAY_HOURS_STORAGE_KEY); 
      }
    }
    
    // Re-add Load Monochrome Setting
    const savedMonochrome = localStorage.getItem(MONOCHROME_STORAGE_KEY);
    // Check for 'true' string explicitly, as any non-empty string is truthy
    if (savedMonochrome === 'true') { 
      setUseMonochromeChart(true);
    } else if (savedMonochrome === 'false') {
        setUseMonochromeChart(false);
    } // If item doesn't exist or has other value, default 'false' is used.

    // Load Sound Enabled setting (defaults to true if unset)
    const savedSoundEnabled = localStorage.getItem(SOUND_ENABLED_STORAGE_KEY);
    if (savedSoundEnabled === 'true') {
      setSoundEnabled(true);
    } else if (savedSoundEnabled === 'false') {
      setSoundEnabled(false);
    }

    localLoadDoneRef.current = true;
  }, []);

  // Capture the browser's current IANA timezone every session - deliberately
  // not persisted to localStorage and never read back from a synced row (see
  // the type comment above); this always reflects the device/browser it's
  // running on right now.
  useEffect(() => {
    try {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {
      // Unsupported environment - reminders just won't fire for this session.
    }
  }, []);

  // --- Sync with Supabase when a user signs in ---
  // Same shape as task-context.tsx's migration effect: if this account
  // already has a settings row (from another device), it's authoritative -
  // pull it down and replace local state. Otherwise push the current local
  // settings up as the starting point. Only ever touches the three columns
  // this context owns - TimerContext independently owns the rest of the row.
  useEffect(() => {
    if (!supabase || !user || !localLoadDoneRef.current || migrationStartedForUserIdRef.current === user.id) return;
    migrationStartedForUserIdRef.current = user.id;

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase!
        .from("user_settings")
        .select("workday_hours, use_monochrome_chart, sound_enabled, calendar_ics_url, calendar_last_synced_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error("SETTINGS_CONTEXT: Failed to load synced settings:", error);
        setMigrationDoneForUserId(user.id);
        return;
      }

      if (data) {
        setWorkdayHours(data.workday_hours);
        setUseMonochromeChart(data.use_monochrome_chart);
        setSoundEnabled(data.sound_enabled);
        setCalendarIcsUrl(data.calendar_ics_url ?? null);
        setCalendarLastSyncedAt(data.calendar_last_synced_at ?? null);
      } else {
        const { error: upsertError } = await supabase!.from("user_settings").upsert(
          {
            user_id: user.id,
            workday_hours: workdayHours,
            use_monochrome_chart: useMonochromeChart,
            sound_enabled: soundEnabled,
            calendar_ics_url: calendarIcsUrl,
            calendar_last_synced_at: calendarLastSyncedAt,
            timezone,
          },
          { onConflict: "user_id" },
        );
        if (upsertError) console.error("SETTINGS_CONTEXT: Failed to push initial settings on sign-in:", upsertError);
      }
      if (cancelled) return;
      setMigrationDoneForUserId(user.id);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // --- Write-through: mirror any settings change to Supabase while signed in ---
  useEffect(() => {
    if (!supabase || !user || migrationDoneForUserId !== user.id) return;
    supabase
      .from("user_settings")
      .upsert(
        {
          user_id: user.id,
          workday_hours: workdayHours,
          use_monochrome_chart: useMonochromeChart,
          sound_enabled: soundEnabled,
          calendar_ics_url: calendarIcsUrl,
          calendar_last_synced_at: calendarLastSyncedAt,
          timezone,
        },
        { onConflict: "user_id" },
      )
      .then(({ error }) => {
        if (error) console.error("SETTINGS_CONTEXT: Failed to sync settings to Supabase:", error);
      });
  }, [
    workdayHours,
    useMonochromeChart,
    soundEnabled,
    calendarIcsUrl,
    calendarLastSyncedAt,
    timezone,
    user,
    migrationDoneForUserId,
  ]);

  // Save workdayHours to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(WORKDAY_HOURS_STORAGE_KEY, workdayHours.toString());
  }, [workdayHours]);

  // Re-add Save useMonochromeChart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(MONOCHROME_STORAGE_KEY, useMonochromeChart.toString());
  }, [useMonochromeChart]);

  // Save soundEnabled to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(SOUND_ENABLED_STORAGE_KEY, soundEnabled.toString());
  }, [soundEnabled]);

  // --- Actions ---
  const updateWorkdayHours = (hours: number) => {
    const validatedHours = Math.max(MIN_WORKDAY_HOURS, Math.min(MAX_WORKDAY_HOURS, Math.round(hours)));
    if (!isNaN(validatedHours)) {
       setWorkdayHours(validatedHours);
    } else {
       setWorkdayHours(DEFAULT_WORKDAY_HOURS); 
    }
  };

  // Re-add updater function for monochrome setting
  const updateMonochromeChart = (useMonochrome: boolean) => {
    setUseMonochromeChart(useMonochrome);
  };

  const updateSoundEnabled = (enabled: boolean) => {
    setSoundEnabled(enabled);
  };

  const updateCalendarIcsUrl = (url: string | null) => {
    setCalendarIcsUrl(url);
  };

  // --- Context Value ---
  const value = {
    workdayHours,
    updateWorkdayHours,
    useMonochromeChart,
    updateMonochromeChart,
    soundEnabled,
    updateSoundEnabled,
    calendarIcsUrl,
    updateCalendarIcsUrl,
    calendarLastSyncedAt,
    setCalendarLastSyncedAt,
    timezone,
    // Add other settings values/updaters here
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

// --- Hook ---
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
} 