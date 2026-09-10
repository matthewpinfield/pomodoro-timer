// Pure, Deno-free so it's Jest-testable, same split as ics-parser.ts.
//
// This function fetches whatever URL the caller supplies server-side, which
// makes it a classic SSRF vector if left unchecked - a malicious signed-in
// user could point icsUrl at an internal service or a cloud metadata
// endpoint and use FocusPie's own server as a free proxy/prober. This is a
// hostname-string blocklist, not a DNS-rebinding-proof solution (a hostname
// that *resolves* to a private IP at fetch time, rather than being one
// literally, would slip through) - a proportionate first line of defense for
// a pre-launch app, not a claim of complete SSRF immunity.
export function isSafeIcsUrl(urlString: string): boolean {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return false;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return false;

  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "" ||
    host.startsWith("127.") ||
    host.startsWith("169.254.") || // link-local, includes cloud metadata (169.254.169.254)
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  ) {
    return false;
  }

  return true;
}
