import { Dialog, DialogTitle, DialogContent, DialogActions, Checkbox } from "@mui/material";
import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import { useState } from "react";
import { Link } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

function TermsModal({ open, onClose, onAccept }) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedData, setAcceptedData] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const handleAccept = () => {
    if (acceptedTerms && captchaVerified) {
      onAccept({ acceptedTerms, acceptedData }); 
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Aceptar términos</DialogTitle>
      <DialogContent>
        <SoftBox display="flex" alignItems="center" mb={2}>
          <Checkbox checked={acceptedTerms} onChange={() => setAcceptedTerms(!acceptedTerms)} />
          <SoftTypography variant="caption">
            Acepto los{" "}
            <SoftTypography
              component={Link}
              to="/terminos"
              variant="caption"
              fontWeight="bold"
              textGradient
            >
              Términos y Condiciones
            </SoftTypography>
          </SoftTypography>
        </SoftBox>

        <SoftBox display="flex" alignItems="center" mb={2}>
          <Checkbox checked={acceptedData} onChange={() => setAcceptedData(!acceptedData)} />
          <SoftTypography variant="caption">
            Autorizo el uso de mis datos para{" "}
            <SoftTypography
              component={Link}
              to="/autorizacion-datos"
              variant="caption"
              fontWeight="bold"
              textGradient
            >
              Entrenamiento y mejora de IA
            </SoftTypography>
          </SoftTypography>
        </SoftBox>

        {/* CAPTCHA */}
        <SoftBox mt={2}>
          <ReCAPTCHA
            sitekey="TU_SITE_KEY_AQUI"
            onChange={() => setCaptchaVerified(true)}
          />
        </SoftBox>
      </DialogContent>
      <DialogActions>
        <SoftButton onClick={onClose} color="secondary">
          Cancelar
        </SoftButton>
        <SoftButton
          onClick={handleAccept}
          color="info"
          variant="gradient"
          disabled={!acceptedTerms || !captchaVerified}
        >
          Aceptar
        </SoftButton>
      </DialogActions>
    </Dialog>
  );
}

export default TermsModal;

TermsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAccept: PropTypes.func.isRequired,
};
