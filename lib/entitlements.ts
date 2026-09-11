"use client";

// Single seam every paid-tier feature (Calendar import, Push notifications)
// checks. A one-way pull from public.subscriptions - deliberately NOT the
// migration/write-through pattern used elsewhere in this app (see
// context/settings-context.tsx), since the client must never write
// subscription status; only the Stripe webhook (via the service role) ever
// does. Real status can only come from Stripe.
//
// Both existing consumers (components/calendar-view.tsx,
// components/SettingsDialog.tsx) already destructure exactly
// `{ hasProAccess, loading }` and need no changes - this was built as the
// single seam it's now paying off as.

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";

export function useProAccess(): { hasProAccess: boolean; loading: boolean; refetch: () => void } {
  const { user } = useAuth();
  const [hasProAccess, setHasProAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refetchTick, setRefetchTick] = useState(0);

  useEffect(() => {
    if (!user || !supabase) {
      setHasProAccess(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("ENTITLEMENTS: Failed to load subscription status:", error);
          setHasProAccess(false);
        } else {
          setHasProAccess(data?.status === "active" || data?.status === "trialing");
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, refetchTick]);

  const refetch = useCallback(() => setRefetchTick((t) => t + 1), []);

  return { hasProAccess, loading, refetch };
}
