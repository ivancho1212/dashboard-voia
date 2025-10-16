
import React from "react";
import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import Icon from "@mui/material/Icon";

const UrlsSection = ({ urls, currentUrl, setCurrentUrl, handleAddUrl, handleDeleteUrl }) => (
  <>
    <SoftTypography variant="subtitle1" mb={1}>Páginas Web</SoftTypography>
    <SoftBox display="flex" mb={2}>
      <SoftInput placeholder="https://ejemplo.com/info" value={currentUrl} onChange={(e) => setCurrentUrl(e.target.value)} fullWidth />
      <SoftButton variant="gradient" color="info" onClick={handleAddUrl} sx={{ ml: 1, flexShrink: 0 }}>Añadir</SoftButton>
    </SoftBox>
    <SoftBox mt={1}>
      {urls.map((url, idx) => (
        <SoftBox key={`url-${url.url || url}-${idx}`} p={1} mb={1} sx={{ border: "1px solid", borderColor: "grey.300", borderRadius: "8px" }}>
          <SoftBox display="flex" justifyContent="space-between" alignItems="center">
            <SoftTypography variant="body2" sx={{ wordBreak: "break-all" }}>{url.url ? url.url : (typeof url === 'string' ? url : '')}</SoftTypography>
            <Icon fontSize="small" color="error" onClick={() => handleDeleteUrl(url)} sx={{ cursor: "pointer" }}>close</Icon>
          </SoftBox>
        </SoftBox>
      ))}
    </SoftBox>
  </>
);

UrlsSection.propTypes = {
  urls: PropTypes.array.isRequired,
  currentUrl: PropTypes.string.isRequired,
  setCurrentUrl: PropTypes.func.isRequired,
  handleAddUrl: PropTypes.func.isRequired,
  handleDeleteUrl: PropTypes.func.isRequired,
};

export default UrlsSection;
