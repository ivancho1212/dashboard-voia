// ...existing code...
import React from "react";
import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import Icon from "@mui/material/Icon";

const TextsSection = ({ texts, currentText, setCurrentText, handleAddText, handleDeleteText, setTexts }) => (
  <>
    <SoftTypography variant="subtitle1" mb={1}>Texto Plano</SoftTypography>
    <SoftBox mb={2}>
      {texts.length === 0 && (
        <SoftBox component="textarea" rows={5} placeholder="Pega aquí fragmentos de texto relevantes..." value={currentText} onChange={(e) => setCurrentText(e.target.value)} sx={{ width: "100%", p: "12px", borderRadius: "8px", border: "1px solid", borderColor: "grey.300", fontSize: "14px", outline: "none" }} />
      )}
      {texts.length === 0 && (
        <SoftButton variant="gradient" color="info" onClick={handleAddText} sx={{ mt: 1 }} fullWidth>Añadir Texto</SoftButton>
      )}
      {texts.length > 0 && texts.map((text, idx) => (
        <SoftBox key={`text-edit-${(text.content ? text.content.substring(0, 20) : (typeof text === 'string' ? text.substring(0, 20) : ''))}-${idx}`} p={1} mb={1} sx={{ border: "1px solid", borderColor: "grey.300", borderRadius: "8px" }}>
          <SoftBox display="flex" alignItems="center" gap={2}>
            <SoftBox flex={1}>
              <SoftBox component="textarea"
                rows={3}
                value={text.content !== undefined ? text.content : text}
                onChange={e => {
                  const newTexts = [...texts];
                  if (typeof newTexts[idx] === 'object') newTexts[idx].content = e.target.value;
                  else newTexts[idx] = e.target.value;
                  setTexts(newTexts);
                }}
                sx={{ width: "100%", p: "10px", borderRadius: "8px", border: "1px solid", borderColor: "grey.300", fontSize: "14px", outline: "none" }}
              />
            </SoftBox>
            <Icon fontSize="small" color="error" onClick={() => handleDeleteText(text)} sx={{ cursor: "pointer" }}>close</Icon>
          </SoftBox>
        </SoftBox>
      ))}
    </SoftBox>
  </>
);

TextsSection.propTypes = {
  texts: PropTypes.array.isRequired,
  currentText: PropTypes.string.isRequired,
  setCurrentText: PropTypes.func.isRequired,
  handleAddText: PropTypes.func.isRequired,
  handleDeleteText: PropTypes.func.isRequired,
  setTexts: PropTypes.func.isRequired,
};

export default TextsSection;
