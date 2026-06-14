export function getOrCreatePlayerToken() {
  if (typeof window === "undefined") return "";
  const key = "dezhou_player_token";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const token = crypto.randomUUID();
  window.localStorage.setItem(key, token);
  return token;
}
