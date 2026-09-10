import { isSafeIcsUrl } from "./url-guard";

describe("isSafeIcsUrl", () => {
  it("accepts ordinary https and http calendar URLs", () => {
    expect(isSafeIcsUrl("https://calendar.google.com/calendar/ical/abc/basic.ics")).toBe(true);
    expect(isSafeIcsUrl("http://example.com/feed.ics")).toBe(true);
  });

  it("rejects non-http(s) protocols", () => {
    expect(isSafeIcsUrl("file:///etc/passwd")).toBe(false);
    expect(isSafeIcsUrl("ftp://example.com/feed.ics")).toBe(false);
    expect(isSafeIcsUrl("gopher://example.com")).toBe(false);
  });

  it("rejects garbage input that isn't a valid URL at all", () => {
    expect(isSafeIcsUrl("not a url")).toBe(false);
    expect(isSafeIcsUrl("")).toBe(false);
  });

  it("rejects localhost and loopback", () => {
    expect(isSafeIcsUrl("http://localhost/feed.ics")).toBe(false);
    expect(isSafeIcsUrl("http://127.0.0.1/feed.ics")).toBe(false);
    expect(isSafeIcsUrl("http://127.55.1.2/feed.ics")).toBe(false);
  });

  it("rejects link-local addresses, including the cloud metadata endpoint", () => {
    expect(isSafeIcsUrl("http://169.254.169.254/latest/meta-data/")).toBe(false);
  });

  it("rejects private (RFC 1918) IP ranges", () => {
    expect(isSafeIcsUrl("http://10.0.0.5/feed.ics")).toBe(false);
    expect(isSafeIcsUrl("http://192.168.1.1/feed.ics")).toBe(false);
    expect(isSafeIcsUrl("http://172.16.0.1/feed.ics")).toBe(false);
    expect(isSafeIcsUrl("http://172.31.255.255/feed.ics")).toBe(false);
  });

  it("does not false-positive on public IPs that merely start similarly", () => {
    expect(isSafeIcsUrl("http://172.15.0.1/feed.ics")).toBe(true); // just below the 172.16-31 private range
    expect(isSafeIcsUrl("http://172.32.0.1/feed.ics")).toBe(true); // just above it
    expect(isSafeIcsUrl("http://11.0.0.1/feed.ics")).toBe(true); // not 10.x
  });
});
