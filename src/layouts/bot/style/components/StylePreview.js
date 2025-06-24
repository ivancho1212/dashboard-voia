import React from "react";
import PropTypes from "prop-types";
import ChatWidget from "./ChatWidget";

export default function StylePreview({ style }) {
  return (
    <div>
      <ChatWidget
        theme={style?.theme}
        primaryColor={style?.primary_color}
        secondaryColor={style?.secondary_color}
        fontFamily={style?.font_family}
        avatarUrl={style?.avatar_url}
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
