const MAX_GROUP_INTERVAL_MS = 60 * 1000; // Solo agrupar archivos enviados en la misma ventana de 60 segundos

function groupConsecutiveFiles(items) {
  const result = [];
  let currentFileGroup = null;
  const processedItems = items.filter(item => {
    if (item.type === 'message' && item.text && item.text.startsWith('📎 ')) {
      const hasUrl = !!(item.fileUrl || item.url || item.filePath || item.path);
      return hasUrl;
    }
    return true;
  });
  const convertedItems = processedItems.map(item => {
    if (item.type === 'message' && item.text && item.text.startsWith('📎 ')) {
      const fileName = item.text.substring(2);
      const urlValue = item.fileUrl || item.url || item.filePath || item.path;
      return {
        ...item,
        type: 'file',
        fileName: fileName,
        fileUrl: urlValue,
        fileType: 'application/octet-stream'
      };
    }
    return item;
  });
  for (const item of convertedItems) {
    if (item.type === 'file' || item.type === 'image') {
      if (!currentFileGroup) {
        currentFileGroup = {
          id: item.id,
          type: item.type,
          timestamp: item.timestamp,
          fromRole: item.fromRole,
          fromId: item.fromId,
          fromName: item.fromName,
          fromAvatarUrl: item.fromAvatarUrl,
          isGroupedFile: true,
          files: [{
            id: item.id,
            url: item.fileUrl || item.url,
            name: item.fileName || item.name,
            type: item.fileType || item.type,
          }]
        };
      } else if (
        currentFileGroup.type === item.type &&
        currentFileGroup.fromId === item.fromId &&
        (() => {
          const lastTs = currentFileGroup.timestamp;
          const currTs = item.timestamp;
          const diffMs = Math.abs(new Date(currTs) - new Date(lastTs));
          return diffMs <= MAX_GROUP_INTERVAL_MS;
        })()
      ) {
        currentFileGroup.files.push({
          id: item.id,
          url: item.fileUrl || item.url,
          name: item.fileName || item.name,
          type: item.fileType || item.type,
        });
        if (new Date(item.timestamp) > new Date(currentFileGroup.timestamp)) {
          currentFileGroup.timestamp = item.timestamp;
        }
      } else {
        result.push(currentFileGroup);
        currentFileGroup = {
          id: item.id,
          type: item.type,
          timestamp: item.timestamp,
          fromRole: item.fromRole,
          fromId: item.fromId,
          fromName: item.fromName,
          fromAvatarUrl: item.fromAvatarUrl,
          isGroupedFile: true,
          files: [{
            id: item.id,
            url: item.fileUrl || item.url,
            name: item.fileName || item.name,
            type: item.fileType || item.type,
          }]
        };
      }
    } else {
      if (currentFileGroup) {
        result.push(currentFileGroup);
        currentFileGroup = null;
      }
      result.push(item);
    }
  }
  if (currentFileGroup) {
    result.push(currentFileGroup);
  }
  return result;
}
// Deduplicar y unificar mensajes restaurados del caché
function unifyMessages(messages) {
  const map = new Map();
  for (const msg of messages) {
    // Usar tempId si existe, si no usar id
    const key = msg.tempId || msg.id;
    if (!map.has(key)) {
      map.set(key, msg);
    } else {
      const prev = map.get(key);
      // Preferir el mensaje con status 'sent' y id definitivo
      if (msg.status === 'sent' && msg.id && msg.id !== msg.tempId) {
        map.set(key, msg);
      }
    }
  }
  return Array.from(map.values());
}

function isEmoji(str) {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (!trimmed) return false;
  if (trimmed.includes('/') || trimmed.includes('.') || trimmed.includes('http') || trimmed.includes('data:')) {
    return false;
  }
  if (trimmed.length > 8) return false;
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE0F}]|[\u{200D}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F170}-\u{1F251}]/u;
  return emojiRegex.test(trimmed);
}

function normalizeMessage(msg) {
  const { uuidv4, getSenderColor } = globalThis;
  const rawId = msg.id ?? msg.tempId ?? (typeof uuidv4 !== 'undefined' ? uuidv4() : undefined);
  const id = rawId !== undefined && rawId !== null ? String(rawId) : (typeof uuidv4 !== 'undefined' ? String(uuidv4()) : '');
  const tempRaw = msg.tempId ?? id;
  const tempId = tempRaw !== undefined && tempRaw !== null ? String(tempRaw) : id;
  const uniqueKey = msg.tempId ?? id;
  let files = msg.multipleFiles ?? msg.files ?? [];
  let images = msg.images ?? msg.imageGroup ?? [];
  let file = msg.file ?? null;

  const normFile = (f) => {
    if (!f || typeof f !== "object") return null;
    const fileUrl = f.fileUrl ?? f.filePath ?? f.url ?? f.path;
    if (!fileUrl) return null;
    return {
      ...f,
      fileUrl,
      fileName: f.fileName ?? f.name ?? "archivo",
      fileType: f.fileType ?? f.type ?? "application/octet-stream",
    };
  };

  if (msg.isGroupedFile && msg.files && msg.files.length > 0) {
    files = msg.files.map((f) => normFile({ ...f, fileUrl: f.fileUrl ?? f.url, fileName: f.fileName ?? f.name, fileType: f.fileType ?? f.type })).filter(Boolean);
  } else if (Array.isArray(files) && files.length > 0) {
    files = files.map(normFile).filter(Boolean);
  }
  if ((msg.type === "file" || msg.type === "image") && (msg.fileUrl || msg.url || msg.filePath || msg.path)) {
    const single = normFile({ fileUrl: msg.fileUrl, filePath: msg.filePath, url: msg.url, path: msg.path, fileName: msg.fileName, name: msg.name, fileType: msg.fileType, type: msg.type });
    if (single) file = single;
  }
  return {
    fromName: msg.fromName,
    fromAvatarUrl: msg.fromAvatarUrl,
    replyToText: msg.replyToText,
    id,
    tempId,
    status: msg.status ?? "sent",
    from: msg.from ?? (msg.sender === "user" ? "user" : msg.sender === "admin" ? "admin" : "bot"),
    text: msg.text ?? msg.content ?? msg.message ?? msg.body ?? "",
    file,
    multipleFiles: files,
    images,
    timestamp: msg.timestamp ?? new Date().toISOString(),
    color: msg.color ?? (typeof getSenderColor !== 'undefined' ? getSenderColor(msg.from) : undefined),
    uniqueKey,
    conversationId: msg.conversationId // <-- CONSERVAR EL CAMPO
  };
}

export { unifyMessages, isEmoji, groupConsecutiveFiles, normalizeMessage };
