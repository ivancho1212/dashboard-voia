
import React from "react";
import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import Icon from "@mui/material/Icon";

const FilesSection = ({ files, fileErrors, handleFileChange, handleDeleteFile, handleRetryFile, ALLOWED_FILE_TYPES, fileUploadLimit }) => {
  const atLimit = fileUploadLimit != null && files.length >= fileUploadLimit;
  return (
  <>
    <SoftTypography variant="subtitle1" mb={1}>
      Archivos (PDF, DOCX, XLSX)
      {fileUploadLimit != null && (
        <SoftTypography component="span" variant="caption" color={atLimit ? "error" : "text"} ml={1}>
          {files.length}/{fileUploadLimit} {atLimit ? "— límite alcanzado" : ""}
        </SoftTypography>
      )}
    </SoftTypography>
    {atLimit && (
      <SoftBox mb={1} p={1} sx={{ backgroundColor: "#fff8e1", borderRadius: 1, border: "1px solid #f0a500" }}>
        <SoftTypography variant="caption" color="warning" fontWeight="bold">
          🔒 Has alcanzado el límite de {fileUploadLimit} documento(s) de tu plan. Actualiza tu plan para subir más archivos.
        </SoftTypography>
      </SoftBox>
    )}
    <SoftBox mb={2}>
      <SoftButton variant="outlined" color="info" component="label" fullWidth disabled={atLimit}>
        Seleccionar Archivos (Max 5MB)
        <input type="file" multiple hidden onChange={handleFileChange} accept={Object.keys(ALLOWED_FILE_TYPES).join(",")} disabled={atLimit}/>
      </SoftButton>
  <SoftBox mb={3}>
  {files.map((file, idx) => {
        const name = file.name ? file.name : (typeof file === 'string' ? file : file.fileName || `Archivo ${idx+1}`);
        const progress = file.uploadProgress || 0;
        const hasError = fileErrors.has(file) || fileErrors.has(name);
        const errorMsg = fileErrors.get(file) || fileErrors.get(name);
        return (
    <SoftBox key={`file-${name}-${idx}`} p={1} mb={1} sx={{ border: "1px solid", borderColor: hasError ? "error.main" : "grey.300", borderRadius: "8px", marginTop: idx === 0 ? 3 : 0 }}>
                  <SoftBox display="flex" justifyContent="space-between" alignItems="center">
                      <SoftTypography variant="body2">{name}</SoftTypography>
                      <SoftBox display="flex" alignItems="center" gap={1}>
                        {file.canRetry && typeof handleRetryFile === 'function' && (
                          <SoftButton size="small" color="warning" onClick={() => handleRetryFile(file)}>Reintentar</SoftButton>
                        )}
                        <Icon fontSize="small" color="error" onClick={() => handleDeleteFile(file)} sx={{ cursor: "pointer" }}>close</Icon>
                      </SoftBox>
                    </SoftBox>
                  {progress > 0 && progress < 100 && (
                    <SoftBox mt={1} sx={{ background: '#eee', borderRadius: '6px' }}>
                      <div style={{ width: `${progress}%`, height: '6px', background: '#06b6d4', borderRadius: '6px' }} />
                    </SoftBox>
                  )}
                  {hasError && <SoftTypography variant="caption" color="error" mt={0.5}>{errorMsg}</SoftTypography>}
                </SoftBox>
              )
            })}
          </SoftBox>
    </SoftBox>
  </>
  );
};

FilesSection.propTypes = {
  files: PropTypes.array.isRequired,
  fileErrors: PropTypes.oneOfType([PropTypes.instanceOf(Map), PropTypes.object]).isRequired,
  handleFileChange: PropTypes.func.isRequired,
  handleDeleteFile: PropTypes.func.isRequired,
  handleRetryFile: PropTypes.func,
  ALLOWED_FILE_TYPES: PropTypes.object.isRequired,
  fileUploadLimit: PropTypes.number,
};

export default FilesSection;
