// Single seam every paid-tier feature (Calendar import, Push notifications)
// checks - there's no billing system yet, so this unconditionally grants
// access today. Its shape (an async-friendly `loading` flag alongside the
// boolean) already anticipates the real version, which will need to fetch a
// subscription status rather than answer synchronously - so wiring up real
// billing later means changing what happens *inside* this hook, not hunting
// through every paid feature's code to add gates retroactively.
export function useProAccess(): { hasProAccess: boolean; loading: boolean } {
  return { hasProAccess: true, loading: false };
}
