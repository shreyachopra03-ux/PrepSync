import mixpanel from "mixpanel-browser";

const TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

let ready = false;

function init(): boolean {
  if (ready) return true;
  if (!TOKEN || typeof window === "undefined") return false;
  try {
    mixpanel.init(TOKEN, {
      persistence: "localStorage",
      track_pageview: false,
      ignore_dnt: false,
    });
    ready = true;
  } catch {
    return false;
  }
  return true;
}

export function track(event: string, properties?: Record<string, string | number | boolean>): void {
  if (!init()) return;
  try {
    mixpanel.track(event, properties);
  } catch {}
}

export function identify(userId: string): void {
  if (!init()) return;
  try {
    mixpanel.identify(userId);
    mixpanel.people.set({ last_seen_app: new Date().toISOString() });
  } catch {}
}

export function resetIdentity(): void {
  if (!init()) return;
  try {
    mixpanel.reset();
  } catch {}
}
