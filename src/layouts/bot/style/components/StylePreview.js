import React from "react";
import PropTypes from "prop-types";
import ChatWidget from "./ChatWidget";

const DEFAULT_AVATAR = "/VIA.png";

export default function StylePreview({ style }) {
  // Normaliza los datos para el preview
  const normalized = {
    ...style,
    avatarUrl: style.avatarUrl || style.AvatarUrl || style.avatar_url || DEFAULT_AVATAR,
    title: style.title || style.Title || style.name || "",
    primaryColor: style.primaryColor || style.PrimaryColor || style.primary_color || "#000000",
    secondaryColor: style.secondaryColor || style.SecondaryColor || style.secondary_color || "#ffffff",
    headerBackgroundColor:
      style.headerBackgroundColor || style.HeaderBackgroundColor || style.header_background_color || "#f5f5f5",
    fontFamily: style.fontFamily || style.FontFamily || style.font_family || "Arial",
    allowImageUpload:
      style.allowImageUpload ?? style.AllowImageUpload ?? style.allow_image_upload ?? true,
    allowFileUpload:
      style.allowFileUpload ?? style.AllowFileUpload ?? style.allow_file_upload ?? true,
    position: style.position || style.Position || "bottom-right",
    theme: style.theme || style.Theme || "light",
    customCss: style.customCss || style.CustomCss || style.custom_css || "",
  };
  return (
    <div>
      <ChatWidget
        botId={1}
        userId={9999}
        style={normalized}
        title={normalized.title}
        theme={normalized.theme}
        primaryColor={normalized.primaryColor}
        secondaryColor={normalized.secondaryColor}
        headerBackgroundColor={normalized.headerBackgroundColor}
        fontFamily={normalized.fontFamily}
        avatarUrl={normalized.avatarUrl}
        position={normalized.position}
        isDemo={true}
        allowImageUpload={normalized.allowImageUpload}
        allowFileUpload={normalized.allowFileUpload}
      />
    </div>
  );
}

StylePreview.propTypes = {
  style: PropTypes.shape({
    // camelCase
    title: PropTypes.string,
    theme: PropTypes.oneOf(["light", "dark", "custom"]),
    primaryColor: PropTypes.string,
    secondaryColor: PropTypes.string,
    headerBackgroundColor: PropTypes.string,
    fontFamily: PropTypes.string,
    avatarUrl: PropTypes.string,
    allowImageUpload: PropTypes.bool,
    allowFileUpload: PropTypes.bool,
    position: PropTypes.oneOf([
      "bottom-right",
      "bottom-left",
      "top-right",
      "top-left",
      "center-left",
      "center-right",
    ]),
    customCss: PropTypes.string,
    // PascalCase
    Title: PropTypes.string,
    Theme: PropTypes.string,
    PrimaryColor: PropTypes.string,
    SecondaryColor: PropTypes.string,
    HeaderBackgroundColor: PropTypes.string,
    FontFamily: PropTypes.string,
    AvatarUrl: PropTypes.string,
    AllowImageUpload: PropTypes.bool,
    AllowFileUpload: PropTypes.bool,
    Position: PropTypes.string,
    CustomCss: PropTypes.string,
    // snake_case
    title: PropTypes.string,
    theme: PropTypes.string,
    primary_color: PropTypes.string,
    secondary_color: PropTypes.string,
    header_background_color: PropTypes.string,
    font_family: PropTypes.string,
    avatar_url: PropTypes.string,
    allow_image_upload: PropTypes.bool,
    allow_file_upload: PropTypes.bool,
    position: PropTypes.string,
    custom_css: PropTypes.string,
    // Otros posibles
    name: PropTypes.string,
  }).isRequired,
};
