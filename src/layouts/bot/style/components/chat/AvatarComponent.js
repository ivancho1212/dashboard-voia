import React from 'react';
import PropTypes from 'prop-types';

const AvatarComponent = ({ avatarUrl, isEmojiAvatar, size = "42px", defaultAvatar = "/VIA.png" }) => {
  // Función para detectar si el avatarUrl es un emoji (más robusta)
  const isEmoji = (str) => {
    if (!str || typeof str !== 'string') return false;
    
    const trimmed = str.trim();
    if (!trimmed) return false;
    
    // Verificar que no sea una URL o path
    if (trimmed.includes('/') || trimmed.includes('.') || trimmed.includes('http') || trimmed.includes('data:')) {
      return false;
    }
    
    // Verificar que sea muy corto (emojis son típicamente ≤ 8 caracteres)
    if (trimmed.length > 8) return false;
    
    // Regex más completa para emojis (incluye más rangos Unicode)
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE0F}]|[\u{200D}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F170}-\u{1F251}]/u;
    
    return emojiRegex.test(trimmed);
  };

  // Determinar si es emoji basado en la prop o detección automática
  const shouldRenderAsEmoji = isEmojiAvatar || isEmoji(avatarUrl) || 
    // Fallback: si es muy corto y no contiene caracteres de URL/path, probablemente es emoji
    (avatarUrl && avatarUrl.trim().length <= 4 && 
     !avatarUrl.includes('/') && !avatarUrl.includes('.') && 
     !avatarUrl.includes('http') && !avatarUrl.includes('data:'));

  // Debug logging (solo cuando es necesario)
  if (shouldRenderAsEmoji) {
    console.log("🔧 AvatarComponent - Renderizando emoji:", {
      avatarUrl,
      isEmojiAvatar,
      shouldRenderAsEmoji,
      size
    });
  }

  if (shouldRenderAsEmoji && avatarUrl) {
    // Calcular tamaño de emoji basado en el size del contenedor
    let emojiSize = "24px"; // default
    if (size === "120px") emojiSize = "60px";
    else if (size === "60px") emojiSize = "32px";
    else if (size === "42px") emojiSize = "24px";
    else if (size === "80px") emojiSize = "48px"; // Aumentado de 40px a 48px

    // Forzar font-family compatible con emojis modernos
    const emojiFontFamily = "'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', 'Android Emoji', 'EmojiOne Color', 'Twemoji Mozilla', sans-serif";

    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: "#f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isEmoji(avatarUrl) ? (
          <span 
            style={{ 
              fontSize: size === "80px" ? "56px" : size === "60px" ? "40px" : size === "42px" ? "32px" : "48px", // Aumenta el tamaño del emoji
              lineHeight: 1,
              userSelect: "none",
              fontFamily: "'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', 'Android Emoji', 'EmojiOne Color', 'Twemoji Mozilla', sans-serif"
            }}
          >
            {avatarUrl}
          </span>
        ) : (
          <img
            src={avatarUrl?.trim() ? avatarUrl : defaultAvatar}
            alt="Avatar"
            style={{
              width: size === "80px" ? "70px" : size,
              height: size === "80px" ? "70px" : size,
              borderRadius: "50%",
              objectFit: "cover",
            }}
            onError={(e) => {
              console.log("❌ Error cargando avatar launcher:", avatarUrl);
              e.target.style.display = "none";
            }}
          />
        )}
      </div>
    );
  }
  
  // Construir URL completa para mostrar la imagen
  const getImageSrc = () => {
    if (!avatarUrl || !avatarUrl.trim()) return defaultAvatar;
    
    // Si ya es una URL completa o base64, usarla tal como está
    if (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:')) {
      return avatarUrl;
    }
    
    // Si es una ruta relativa, agregar el dominio del backend
    return `http://localhost:5006${avatarUrl}`;
  };
  
  return (
    <img
      src={getImageSrc()}
      alt="Avatar"
      onError={(e) => {
        console.log("❌ Error cargando avatar:", avatarUrl, "Intentando con avatar por defecto");
        e.target.src = defaultAvatar;
      }}
      style={{
        width: size === "80px" ? "70px" : size, // Imagen más grande en launcher flotante
        height: size === "80px" ? "70px" : size,
        borderRadius: "50%",
        objectFit: "cover",
      }}
    />
  );
};

AvatarComponent.propTypes = {
  avatarUrl: PropTypes.string,
  isEmojiAvatar: PropTypes.bool,
  size: PropTypes.string,
  defaultAvatar: PropTypes.string
};

export default AvatarComponent;