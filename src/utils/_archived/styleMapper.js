// utils/styleMapper.js

/**
 * Mapea los estilos que recibe el widget hacia la estructura de bot_styles
 * @param {Object} widgetStyle - Estilos en formato widget
 * @returns {Object} - Estilos en formato bot_styles
 */
export const mapWidgetStyleToBotStyle = (widgetStyle) => {
  if (!widgetStyle) return {};

  return {
    // Mapeo directo de propiedades del widget
    primaryColor: widgetStyle.headerBackground || widgetStyle.launcherBackground || "#000000",
    secondaryColor: widgetStyle.userMessageBackground || "#ffffff", 
    headerBackgroundColor: widgetStyle.headerBackground || widgetStyle.launcherBackground || "#000000",
    fontFamily: widgetStyle.fontFamily || "Arial",
    avatarUrl: widgetStyle.avatarUrl || "",
    isEmojiAvatar: widgetStyle.isEmojiAvatar ?? false,
    title: widgetStyle.title || "",
    theme: widgetStyle.theme || "custom",
    position: widgetStyle.position || "bottom-right",
    allowImageUpload: widgetStyle.allowImageUpload ?? true,
    allowFileUpload: widgetStyle.allowFileUpload ?? true,
    customCss: widgetStyle.customCss || "",
    
    // Propiedades específicas para colores de texto y fondos
    headerTextColor: widgetStyle.headerText || "#FFFFFF",
    userMessageTextColor: widgetStyle.userMessageText || "#000000",
    userMessageBackgroundColor: widgetStyle.userMessageBackground || "#ffffff",
    responseMessageTextColor: widgetStyle.responseMessageText || "#000000", 
    responseMessageBackgroundColor: widgetStyle.responseMessageBackground || "#f4f7f9",
    subtitle: widgetStyle.subtitle || "Powered by Voia"
  };
};

/**
 * Mapea los estilos de bot_styles hacia el formato que espera el widget
 * @param {Object} botStyle - Estilos en formato bot_styles
 * @returns {Object} - Estilos en formato widget
 */
export const mapBotStyleToWidget = (botStyle) => {
  if (!botStyle) return {};

  return {
    launcherBackground: botStyle.primaryColor || botStyle.PrimaryColor || "#000000",
    headerBackground: botStyle.headerBackgroundColor || botStyle.HeaderBackgroundColor || botStyle.primaryColor || "#000000",
    headerText: getContrastTextColor(botStyle.headerBackgroundColor || botStyle.primaryColor || "#000000"),
    userMessageBackground: botStyle.secondaryColor || botStyle.SecondaryColor || "#ffffff",
    userMessageText: botStyle.primaryColor || botStyle.PrimaryColor || "#000000",
    responseMessageBackground: botStyle.secondaryColor || botStyle.SecondaryColor || "#f4f7f9",
    responseMessageText: botStyle.primaryColor || botStyle.PrimaryColor || "#000000",
    title: botStyle.title || botStyle.Title || "",
    subtitle: "Powered by Voia",
    avatarUrl: botStyle.avatarUrl || botStyle.AvatarUrl || "",
    isEmojiAvatar: botStyle.isEmojiAvatar ?? botStyle.IsEmojiAvatar ?? botStyle.is_emoji_avatar ?? false,
    theme: botStyle.theme || botStyle.Theme || "light",
    fontFamily: botStyle.fontFamily || botStyle.FontFamily || "Arial",
    position: botStyle.position || botStyle.Position || "bottom-right",
    allowImageUpload: botStyle.allowImageUpload ?? botStyle.AllowImageUpload ?? true,
    allowFileUpload: botStyle.allowFileUpload ?? botStyle.AllowFileUpload ?? true,
    customCss: botStyle.customCss || botStyle.CustomCss || "",
    primaryColor: botStyle.primaryColor || botStyle.PrimaryColor || "#000000",
    secondaryColor: botStyle.secondaryColor || botStyle.SecondaryColor || "#ffffff",
    headerBackgroundColor: botStyle.headerBackgroundColor || botStyle.HeaderBackgroundColor || ""
  };
};

/**
 * Normaliza un objeto de estilo independientemente de su origen
 * @param {Object} style - Objeto de estilo
 * @returns {Object} - Estilo normalizado
 */
export const normalizeStyle = (style) => {
  if (!style) return {};

  // Detectar si es formato widget o bot_styles y normalizar
  const hasWidgetFormat = style.launcherBackground || style.headerBackground || style.headerText;
  
  if (hasWidgetFormat) {
    return mapWidgetStyleToBotStyle(style);
  }

  // Si ya está en formato bot_styles, solo normalizar las propiedades
  return {
    primaryColor: style.primaryColor || style.PrimaryColor || style.primary_color || "#000000",
    secondaryColor: style.secondaryColor || style.SecondaryColor || style.secondary_color || "#ffffff",
    fontFamily: style.fontFamily || style.FontFamily || style.font_family || "Arial",
    avatarUrl: style.avatarUrl || style.AvatarUrl || style.avatar_url || "",
    isEmojiAvatar: style.isEmojiAvatar ?? style.IsEmojiAvatar ?? style.is_emoji_avatar ?? false,
    headerBackgroundColor: style.headerBackgroundColor || style.HeaderBackgroundColor || style.header_background_color || "",
    allowImageUpload: style.allowImageUpload ?? style.AllowImageUpload ?? style.allow_image_upload ?? true,
    allowFileUpload: style.allowFileUpload ?? style.AllowFileUpload ?? style.allow_file_upload ?? true,
    position: style.position || style.Position || "bottom-right",
    title: style.title || style.Title || "",
    theme: style.theme || style.Theme || "light",
    customCss: style.customCss || style.CustomCss || style.custom_css || "",
  };
};

/**
 * Calcula el color de texto que mejor contraste tenga con un color de fondo
 * @param {string} bgColor - Color de fondo en hexadecimal
 * @returns {string} - Color de texto (#000000 o #ffffff)
 */
export const getContrastTextColor = (bgColor) => {
  if (!bgColor) return "#000000";
  
  // Remover # si existe
  let color = bgColor.replace("#", "");
  
  // Convertir formato corto a largo (ej: fff -> ffffff)
  if (color.length === 3) {
    color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
  }
  
  // Convertir a RGB
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  
  // Fórmula YIQ para determinar luminosidad
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Si es claro, usar texto oscuro; si es oscuro, usar texto claro
  return yiq >= 128 ? "#000000" : "#ffffff";
};

/**
 * Verifica si un color es oscuro
 * @param {string} hexColor - Color en hexadecimal
 * @returns {boolean} - true si el color es oscuro
 */
export const isColorDark = (hexColor) => {
  if (!hexColor) return false;
  
  const color = hexColor.replace("#", "");
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
};