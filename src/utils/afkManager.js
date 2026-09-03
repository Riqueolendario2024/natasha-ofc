const afkMap = new Map();

export function setAFK(userId, reason) {
  afkMap.set(userId, {
    reason: reason || "Sem motivo informado",
    timestamp: Date.now(),
  });
}

export function getAFK(userId) {
  return afkMap.get(userId);
}

export function removeAFK(userId) {
  const data = afkMap.get(userId);
  afkMap.delete(userId);
  return data;
}

export function isAFK(userId) {
  return afkMap.has(userId);
}

export function formatTimePassed(timestamp) {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  return `${diffHours}h ${diffMin % 60}m`;
}
