import React, { useRef } from "react";
import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";

export default function AvatarUploader({ style, setStyle }) {
  const inputRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setStyle((prev) => ({ ...prev, avatar_url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleClick = () => {
    inputRef.current.click();
  };

  return (
    <SoftBox display="flex" flexDirection="column" alignItems="center" gap={1} mb={2}>
      <SoftTypography variant="caption">Avatar</SoftTypography>

      {style.avatar_url ? (
        <img
          src={style.avatar_url}
          alt="Avatar preview"
          style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover" }}
        />
      ) : (
        <SoftBox
          width={80}
          height={80}
          borderRadius="50%"
          bgcolor="#ddd"
          display="flex"
          justifyContent="center"
          alignItems="center"
          color="#999"
        >
          Sin avatar
        </SoftBox>
      )}

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
