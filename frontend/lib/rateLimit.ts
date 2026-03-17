/**
 * IP 기반 단순 rate limit (인메모리).
 * 서버리스 환경에서는 인스턴스별로 동작하므로, 다중 인스턴스 시 제한이 완화될 수 있음.
 * 분당 maxRequests 건까지 허용, 초과 시 false 반환.
 */

const windowMs = 60 * 1000; // 1분
const store = new Map<
  string,
  { count: number; resetAt: number }
>();

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

/** 오래된 항목 제거 (메모리 누수 방지) */
function cleanup(): void {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (value.resetAt < now) store.delete(key);
  }
}

/**
 * IP 기준 rate limit 체크.
 * @param request Request (headers에서 IP 추출)
 * @param maxRequests 분당 허용 횟수 (기본 10)
 * @returns 허용 시 true, 초과 시 false
 */
export function checkRateLimit(
  request: Request,
  maxRequests: number = 10
): boolean {
  cleanup();
  const ip = getClientIp(request);
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (now >= entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count += 1;
  return true;
}
