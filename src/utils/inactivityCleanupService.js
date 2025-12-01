// inactivityCleanupService.js
// Servicio singleton para gestionar limpieza por inactividad y cierre de conversación

const INACTIVITY_KEY = 'chat_inactivity_info';
const CHECK_INTERVAL = 10000; // 10 segundos (puedes ajustar)
const DEFAULT_TIMEOUT = 60000; // 1 minuto (puedes ajustar)

let timer = null;

function setClosedTimestamp(conversationId, cacheKey, timeout = DEFAULT_TIMEOUT) {
  const info = {
    closedAt: Date.now(),
    conversationId,
    cacheKey,
    timeout
  };
  localStorage.setItem(INACTIVITY_KEY, JSON.stringify(info));
}

function clearClosedTimestamp() {
  localStorage.removeItem(INACTIVITY_KEY);
}

function extendClosedTimestamp() {
  const info = getClosedInfo();
  if (info) {
    info.closedAt = Date.now();
    localStorage.setItem(INACTIVITY_KEY, JSON.stringify(info));
  }
}

function getClosedInfo() {
  const raw = localStorage.getItem(INACTIVITY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function startGlobalCleanupWatcher(onCleanup) {
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    const info = getClosedInfo();
    if (!info) return;
    const now = Date.now();
    if (now - info.closedAt >= info.timeout) {
      // Notificar backend para cerrar conversación (usar endpoint correcto)
      fetch(`http://localhost:5006/api/Conversations/${info.conversationId}/disconnect`, { method: 'POST' })
        .then(() => {
          console.log('[LOG][CLEANUP] Conversación expirada en backend (disconnect).');
        })
        .catch(err => {
          console.error('[LOG][CLEANUP] Error expirando conversación en backend (disconnect):', err);
        })
        .finally(() => {
          // Limpiar storage local
          localStorage.removeItem(info.cacheKey);
          sessionStorage.removeItem(info.cacheKey);
          clearClosedTimestamp();
          if (typeof onCleanup === 'function') onCleanup(info);
          console.log('[LOG][CLEANUP] Storage local y session eliminado y limpieza completa.');
        });
    }
  }, CHECK_INTERVAL);
}

function stopGlobalCleanupWatcher() {
  if (timer) clearInterval(timer);
  timer = null;
}

export {
  setClosedTimestamp,
  clearClosedTimestamp,
  extendClosedTimestamp,
  startGlobalCleanupWatcher,
  stopGlobalCleanupWatcher,
  getClosedInfo,
  INACTIVITY_KEY
};
