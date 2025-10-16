
import React from "react";
import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import Icon from "@mui/material/Icon";

const FilesSection = ({ files, fileErrors, handleFileChange, handleDeleteFile, ALLOWED_FILE_TYPES }) => (
  <>
    <SoftTypography variant="subtitle1" mb={1}>Archivos (PDF, DOCX, XLSX)</SoftTypography>
    <SoftBox mb={2}>
      <SoftButton variant="outlined" color="info" component="label" fullWidth>
        Seleccionar Archivos (Max 5MB)
        <input type="file" multiple hidden onChange={handleFileChange} accept={Object.keys(ALLOWED_FILE_TYPES).join(",")}/>
      </SoftButton>
      <SoftBox mt={2}>
        {files.map((file, idx) => (
          <SoftBox key={`file-${file.name || file}-${idx}`} p={1} mb={1} sx={{ border: "1px solid", borderColor: fileErrors.has(file) ? "error.main" : "grey.300", borderRadius: "8px" }}>
            <SoftBox display="flex" justifyContent="space-between" alignItems="center">
              <SoftTypography variant="body2">{file.name ? file.name : (typeof file === 'string' ? file : '')}</SoftTypography>
              <Icon fontSize="small" color="error" onClick={() => handleDeleteFile(file)} sx={{ cursor: "pointer" }}>close</Icon>
            </SoftBox>
            {fileErrors.has(file) && <SoftTypography variant="caption" color="error" mt={0.5}>{fileErrors.get(file)}</SoftTypography>}
          </SoftBox>
        ))}
      </SoftBox>
    </SoftBox>
  </>
);

FilesSection.propTypes = {
  files: PropTypes.array.isRequired,
  fileErrors: PropTypes.instanceOf(Map).isRequired,
  handleFileChange: PropTypes.func.isRequired,
  handleDeleteFile: PropTypes.func.isRequired,
  ALLOWED_FILE_TYPES: PropTypes.object.isRequired,
};

export default FilesSection;
