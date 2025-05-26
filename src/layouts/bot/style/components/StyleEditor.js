import React, { useEffect } from "react";
import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftInput from "components/SoftInput";
import SoftSelect from "components/SoftSelect";
import SoftTypography from "components/SoftTypography";
import MenuItem from "@mui/material/MenuItem";
import AvatarUploader from "./AvatarUploader";
import SaveApplyButtons from "./SaveApplyButtons";

export default function StyleEditor({ style, setStyle, setShowPreviewWidget }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setStyle((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name) => (e) => {
    const value = e.target.value;

    if (name === "theme") {
      if (value === "light") {
        setStyle((prev) => ({
          ...prev,
          theme: "light",
          primary_color: "#ffffff",
          secondary_color: "#000000",
        }));
      } else if (value === "dark") {
        setStyle((prev) => ({
          ...prev,
          theme: "dark",
          primary_color: "#000000",
          secondary_color: "#ffffff",
        }));
      } else if (value === "custom") {
        setStyle((prev) => ({
          ...prev,
          theme: "custom",
          primary_color: prev.primary_color,
          secondary_color: prev.secondary_color,
        }));
      }
    } else {
      setStyle((prev) => ({ ...prev, [name]: value }));

      // Mostrar vista previa solo si se cambia la posición
      if (name === "position") {
        setShowPreviewWidget(true);
      }
    }
  };

  useEffect(() => {
    setStyle((prev) => {
      if (prev.theme === "light") {
        return {
          ...prev,
          primary_color: "#ffffff",
          secondary_color: "#000000",
        };
      } else if (prev.theme === "dark") {
        return {
          ...prev,
          primary_color: "#000000",
          secondary_color: "#ffffff",
        };
      }
      return prev; // Si es "custom" no tocamos nada
    });
  }, []); // Ejecutar solo una vez al montar

  return (
    <SoftBox width="100%" maxWidth="900px" px={2}>
      <SoftTypography variant="h6" gutterBottom>
        Editor de Estilo
      </SoftTypography>
      <SoftBox mb={2}>
        <SoftTypography variant="caption">Avatar</SoftTypography>
        <AvatarUploader style={style} setStyle={setStyle} />
      </SoftBox>
      <SoftBox mb={2}>
        <SoftTypography variant="caption">Tema</SoftTypography>
        <SoftSelect
          label="Tema"
          value={style.theme}
          onChange={handleSelectChange("theme")}
          fullWidth
        >
          <MenuItem value="light">Claro</MenuItem>
          <MenuItem value="dark">Oscuro</MenuItem>
          <MenuItem value="custom">Personalizado</MenuItem>
        </SoftSelect>
      </SoftBox>

      <SoftBox mb={2}>
        <SoftTypography variant="caption">Color Primario</SoftTypography>
        <SoftInput
          type="color"
          name="primary_color"
          value={style.primary_color}
          onChange={handleChange}
          fullWidth
          disabled={style.theme !== "custom"}
        />
      </SoftBox>

      <SoftBox mb={2}>
        <SoftTypography variant="caption">Color Secundario</SoftTypography>
        <SoftInput
          type="color"
          name="secondary_color"
          value={style.secondary_color}
          onChange={handleChange}
          fullWidth
          disabled={style.theme !== "custom"}
        />
      </SoftBox>

      <SoftBox mb={2}>
        <SoftTypography variant="caption">Fuente</SoftTypography>
        <SoftSelect
          label="Fuente"
          value={style.font_family}
          onChange={handleSelectChange("font_family")}
          fullWidth
        >
          <MenuItem value="Arial" style={{ fontFamily: "Arial" }}>
            Arial
          </MenuItem>
          <MenuItem value="Roboto" style={{ fontFamily: "Roboto" }}>
            Roboto
          </MenuItem>
          <MenuItem value="Georgia" style={{ fontFamily: "Georgia" }}>
            Georgia
          </MenuItem>
          <MenuItem value="Comic Sans MS" style={{ fontFamily: "Comic Sans MS" }}>
            Comic Sans
          </MenuItem>
          <MenuItem value="Courier New" style={{ fontFamily: "Courier New" }}>
            Courier New
          </MenuItem>
          <MenuItem value="Times New Roman" style={{ fontFamily: "Times New Roman" }}>
            Times New Roman
          </MenuItem>
          <MenuItem value="Verdana" style={{ fontFamily: "Verdana" }}>
            Verdana
          </MenuItem>
        </SoftSelect>
      </SoftBox>

      <SoftBox mb={2}>
        <SoftTypography variant="caption">Posición</SoftTypography>
        <SoftSelect
          label="Posición"
          value={style.position}
          onChange={handleSelectChange("position")}
          fullWidth
        >
          <MenuItem value="top-left">Arriba a la izquierda</MenuItem>
          <MenuItem value="top-right">Arriba a la derecha</MenuItem>
          <MenuItem value="center-left">Centro izquierda</MenuItem>
          <MenuItem value="center-right">Centro derecha</MenuItem>
          <MenuItem value="bottom-left">Abajo a la izquierda</MenuItem>
          <MenuItem value="bottom-right">Abajo a la derecha</MenuItem>
        </SoftSelect>
      </SoftBox>
      <SaveApplyButtons style={style} />
    </SoftBox>
  );
}

StyleEditor.propTypes = {
  style: PropTypes.object.isRequired,
  setStyle: PropTypes.func.isRequired,
  setShowPreviewWidget: PropTypes.func.isRequired,
};
