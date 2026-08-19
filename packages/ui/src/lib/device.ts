export const MOBILE_UA = /mobile|android|iphone|ipad|ipod|webos|blackberry|iemobile|opera mini/i;

export function getOsFromUa(ua: string): string {
  if (ua.includes("win")) {
    return "Windows";
  }
  if (ua.includes("iphone") || ua.includes("ipad")) {
    return "iOS";
  }
  if (ua.includes("mac")) {
    return "macOS";
  }
  if (ua.includes("linux")) {
    return "Linux";
  }
  if (ua.includes("android")) {
    return "Android";
  }

  return "Unknown";
}

export function getBrowserFromUa(ua: string): string {
  if (ua.includes("chrome") && !ua.includes("edg")) {
    return "Chrome";
  }
  if (ua.includes("safari") && !ua.includes("chrome")) {
    return "Safari";
  }
  if (ua.includes("firefox")) {
    return "Firefox";
  }
  if (ua.includes("edg")) {
    return "Edge";
  }
  return "Browser";
}

export function formatDeviceLabel(userAgent?: string | null): string {
  if (!userAgent) {
    return "Unknown device";
  }
  const ua = userAgent.toLowerCase();
  const isMobile = MOBILE_UA.test(ua);
  const browser = getBrowserFromUa(ua);
  const os = getOsFromUa(ua);
  const device = isMobile ? "Mobile" : "Desktop";
  return `${device} · ${browser} on ${os}`;
}

export function isMobileAgent(userAgent?: string | null): boolean {
  return MOBILE_UA.test((userAgent ?? "").toLowerCase());
}
