import React from "react";
import PropTypes from "prop-types";
import ChatWidget from "./ChatWidget";

const DEFAULT_AVATAR = "/VIA.png";

export default function StylePreview({ style }) {
  return (
    <div>
      <ChatWidget
        botId={1}
        userId={9999}
        style={style}
        title={style?.title}
        theme={style?.theme}
        primaryColor={style?.primaryColor}
        secondaryColor={style?.secondaryColor}
        headerBackgroundColor={style?.headerBackgroundColor}
        fontFamily={style?.fontFamily}
        avatarUrl={style?.avatarUrl?.trim() ? style.avatarUrl : DEFAULT_AVATAR}
        position={style?.position}
        isDemo={true} // ✅ AÑADIDO
        allowImageUpload={style?.allowImageUpload}
        allowFileUpload={style?.allowFileUpload}
      />
    </div>
  );
}

StylePreview.propTypes = {
  style: PropTypes.shape({
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
  }).isRequired,
};
