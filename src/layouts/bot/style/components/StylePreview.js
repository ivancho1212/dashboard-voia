import React from "react";
import PropTypes from "prop-types";
import ChatWidget from "./ChatWidget";

export default function StylePreview({ style }) {
  console.log("[DEBUG] Datos recibidos en StylePreview:", style);

  return (
    <div>
      <ChatWidget
        theme={style?.theme}
        primaryColor={style?.primaryColor}
        secondaryColor={style?.secondaryColor}
        headerBackgroundColor={style?.headerBackgroundColor} // ✅ ← nuevo
        fontFamily={style?.fontFamily}
        avatarUrl={style?.avatarUrl}
        position={style?.position}
      />
    </div>
  );
}

StylePreview.propTypes = {
  style: PropTypes.shape({
    theme: PropTypes.oneOf(["light", "dark", "custom"]),
    primaryColor: PropTypes.string,
    secondaryColor: PropTypes.string,
    headerBackgroundColor: PropTypes.string, // ✅ ← nuevo
    fontFamily: PropTypes.string,
    avatarUrl: PropTypes.string,
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
