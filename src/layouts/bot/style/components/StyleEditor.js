import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { SketchPicker } from "react-color";

import SoftBox from "components/SoftBox";
import SoftSelect from "components/SoftSelect";
import SoftTypography from "components/SoftTypography";
import MenuItem from "@mui/material/MenuItem";
import SoftButton from "components/SoftButton";

import AvatarUploader from "./AvatarUploader";
import SaveApplyButtons from "./SaveApplyButtons";

export default function StyleEditor({
  style,
  setStyle,
  setShowPreviewWidget,
  botId,
  userId,
  onCancel,
  setLoading, // ✅ Agrega esto
  setLoadingMessage, // ✅ Y esto también
}) {
  const [showPrimaryPicker, setShowPrimaryPicker] = useState(false);
  const [showSecondaryPicker, setShowSecondaryPicker] = useState(false);

  const closePickers = () => {
    setShowPrimaryPicker(false);
    setShowSecondaryPicker(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".color-picker")) {
        closePickers();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  // 👉 Añade este inmediatamente después:
  useEffect(() => {}, [style]);

  const handleSelectChange = (name) => (e) => {
    const value = e.target.value;

    if (name === "theme") {
      setStyle((prev) => {
        if (prev.theme === value) return prev; // evita sobreescribir si no cambia

        let updated = { ...prev, theme: value };

        if (value === "light") {
          updated.primaryColor = "#ffffff";
          updated.secondaryColor = "#000000";
        } else if (value === "dark") {
          updated.primaryColor = "#000000";
          updated.secondaryColor = "#ffffff";
        }

        return updated;
      });
    } else {
      setStyle((prev) => ({ ...prev, [name]: value }));

      if (name === "position") {
        setShowPreviewWidget(true);
      }
    }
  };

  return (
    <SoftBox width="100%" maxWidth="900px" px={2}>
      <SoftBox mb={2}>
        <AvatarUploader style={style} setStyle={setStyle} />
      </SoftBox>

      <SoftBox mb={2}>
        <SoftTypography variant="caption">Tema</SoftTypography>
        <SoftSelect
          label="Tema"
          value={style.theme || "light"}
          onChange={handleSelectChange("theme")}
          fullWidth
        >
          {["light", "dark", "custom"].map((value) => (
            <MenuItem key={value} value={value} style={{ width: "100%" }}>
              {value === "light" ? "Claro" : value === "dark" ? "Oscuro" : "Personalizado"}
            </MenuItem>
          ))}
        </SoftSelect>
      </SoftBox>

      <SoftBox mb={2} display="flex" gap={3}>
        <SoftBox flex={1}>
          <SoftTypography variant="caption">Color del texto y botones</SoftTypography>
          <SoftBox display="flex" alignItems="center" gap={2} mt={1}>
            <SoftBox
              width="40px"
              height="40px"
              bgcolor={style.primaryColor || "#000000"}
              border="1px solid #ccc"
              borderRadius="8px"
            />
            {style.theme === "custom" && (
              <SoftButton
                onClick={() => {
                  setShowPrimaryPicker((prev) => !prev);
                  setShowSecondaryPicker(false);
                }}
                size="small"
                color="info"
                variant="outlined"
              >
                Elegir color
              </SoftButton>
            )}
          </SoftBox>
          {showPrimaryPicker && (
            <div
              className="color-picker"
              style={{ position: "relative", marginTop: "8px", display: "inline-block" }}
            >
              <SketchPicker
                color={style.primaryColor}
                onChangeComplete={(color) =>
                  setStyle((prev) => ({ ...prev, primaryColor: color.hex }))
                }
                disableAlpha
              />
              <SoftButton
                onClick={() => setShowPrimaryPicker(false)}
                size="small"
                color="error"
                style={{
                  position: "absolute",
                  top: "-22px",
                  right: "-22px",
                  minWidth: "32px",
                  height: "32px",
                  padding: 0,
                  fontSize: "14px",
                  zIndex: 10,
                  borderRadius: "50%",
                }}
              >
                ✕
              </SoftButton>
            </div>
          )}
        </SoftBox>

        <SoftBox flex={1}>
          <SoftTypography variant="caption">Color de fondo del widget</SoftTypography>
          <SoftBox display="flex" alignItems="center" gap={2} mt={1}>
            <SoftBox
              width="40px"
              height="40px"
              bgcolor={style.secondaryColor || "#ffffff"}
              border="1px solid #ccc"
              borderRadius="8px"
            />
            {style.theme === "custom" && (
              <SoftButton
                onClick={() => {
                  setShowSecondaryPicker((prev) => !prev);
                  setShowPrimaryPicker(false);
                }}
                size="small"
                color="info"
                variant="outlined"
              >
                Elegir color
              </SoftButton>
            )}
          </SoftBox>
          {showSecondaryPicker && (
            <div
              className="color-picker"
              style={{ position: "relative", marginTop: "8px", display: "inline-block" }}
            >
              <SketchPicker
                color={style.secondaryColor}
                onChangeComplete={(color) =>
                  setStyle((prev) => ({ ...prev, secondaryColor: color.hex }))
                }
                disableAlpha
              />
              <SoftButton
                onClick={() => setShowSecondaryPicker(false)}
                size="small"
                color="error"
                style={{
                  position: "absolute",
                  top: "-22px",
                  right: "-22px",
                  minWidth: "32px",
                  height: "32px",
                  padding: 0,
                  fontSize: "14px",
                  zIndex: 10,
                  borderRadius: "50%",
                }}
              >
                ✕
              </SoftButton>
            </div>
          )}
        </SoftBox>
      </SoftBox>

      <SoftBox mb={2} display="flex" gap={3}>
        <SoftBox flex={1}>
          <SoftTypography variant="caption">Fuente</SoftTypography>
          <SoftSelect
            label="Fuente"
            value={style.fontFamily || "Arial"}
            onChange={handleSelectChange("fontFamily")}
            fullWidth
          >
            {[
              "Arial",
              "Roboto",
              "Georgia",
              "Comic Sans MS",
              "Courier New",
              "Times New Roman",
              "Verdana",
            ].map((font) => (
              <MenuItem key={font} value={font} style={{ fontFamily: font, width: "100%" }}>
                {font}
              </MenuItem>
            ))}
          </SoftSelect>
        </SoftBox>

        <SoftBox flex={1}>
          <SoftTypography variant="caption">Posición</SoftTypography>
          <SoftSelect
            label="Posición"
            value={style.position || "bottom-right"}
            onChange={handleSelectChange("position")}
            fullWidth
          >
            {[
              ["top-left", "Arriba a la izquierda"],
              ["top-right", "Arriba a la derecha"],
              ["center-left", "Centro izquierda"],
              ["center-right", "Centro derecha"],
              ["bottom-left", "Abajo a la izquierda"],
              ["bottom-right", "Abajo a la derecha"],
            ].map(([value, label]) => (
              <MenuItem key={value} value={value} style={{ width: "100%" }}>
                {label}
              </MenuItem>
            ))}
          </SoftSelect>
        </SoftBox>
      </SoftBox>

      <SaveApplyButtons
        style={style}
        botId={parseInt(botId)}
        userId={userId}
        onStyleSaved={(savedStyle) => {
          setStyle((prev) => ({ ...prev, ...savedStyle }));
          onCancel(); // <- esto hace que vuelva a la lista y se recargue
        }}
        onCancel={onCancel}
        setLoading={setLoading}
        setLoadingMessage={setLoadingMessage}
      />
    </SoftBox>
  );
}

StyleEditor.propTypes = {
  style: PropTypes.object.isRequired,
  setStyle: PropTypes.func.isRequired,
  setShowPreviewWidget: PropTypes.func.isRequired,
  botId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  userId: PropTypes.number.isRequired,
  onCancel: PropTypes.func.isRequired,
  setLoading: PropTypes.func.isRequired, // ✅ Agrega esto
  setLoadingMessage: PropTypes.func.isRequired, // ✅ Agrega esto
};
