import React from "react";
import PropTypes from "prop-types";
import ChatWidget from "./ChatWidget";

export default function StylePreview({ style }) {
  return (
    <div>
      <ChatWidget
        theme={style?.theme}
        primary_color={style?.primary_color}
        secondary_color={style?.secondary_color}
        font_family={style?.font_family}
        avatar_url={style?.avatar_url}
        position={style?.position}
      />
    </div>
  );
}

StylePreview.propTypes = {
  style: PropTypes.shape({
    theme: PropTypes.oneOf(["light", "dark", "custom"]),
    primary_color: PropTypes.string,
    secondary_color: PropTypes.string,
    font_family: PropTypes.string,
    avatar_url: PropTypes.string,
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
