import React, { useRef } from "react";
import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";

export default function AvatarUploader({ style, setStyle }) {
  const inputRef = useRef();
  const defaultAvatar = "/VIA.png";

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setStyle((prev) => ({ ...prev, avatarUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleClick = () => {
    inputRef.current.click();
  };

  const avatarSrc = style.avatarUrl || defaultAvatar;

  return (
    <SoftBox display="flex" flexDirection="column" alignItems="center" gap={1} mb={2}>
      <SoftBox
        width="120px"
        height="120px"
        borderRadius="50%"
        overflow="hidden"
        display="flex"
        justifyContent="center"
        alignItems="center"
        boxShadow="sm"
        bgcolor="#eee"
      >
        <img
          src={avatarSrc}
          alt="Avatar preview"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </SoftBox>

      <input
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        ref={inputRef}
        onChange={handleFileChange}
      />

      <SoftButton size="small" onClick={handleClick}>
        Subir Avatar
      </SoftButton>
    </SoftBox>
  );
}

AvatarUploader.propTypes = {
  style: PropTypes.object.isRequired,
  setStyle: PropTypes.func.isRequired,
};
