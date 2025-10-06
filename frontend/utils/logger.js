export function log(message, data = null) {
  const stamp = new Date().toISOString();
  console.log(`[${stamp}] ${message}`, data || "");
}
