import React, { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import { SketchPicker } from "react-color";

import SoftBox from "components/SoftBox";
import SoftSelect from "components/SoftSelect";
import SoftTypography from "components/SoftTypography";
import MenuItem from "@mui/material/MenuItem";
import SoftButton from "components/SoftButton";

import AvatarUploader from "./AvatarUploader";
import SaveApplyButtons from "./SaveApplyButtons";

import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import TextField from "@mui/material/TextField";

export default function StyleEditor({
  style,
  setStyle,
  setShowPreviewWidget,
  botId,
  userId,
  onCancel,
  setLoading, // ✅ Agrega esto
  setLoadingMessage, // ✅ Y esto también
  allowCustomTheme = true,
  allowWidgetUploads = true,
}) {
  const [editorStyle, setEditorStyle] = useState(style);
  const [showPrimaryPicker, setShowPrimaryPicker] = useState(false);
  const [showSecondaryPicker, setShowSecondaryPicker] = useState(false);
  const [showHeaderBgPicker, setShowHeaderBgPicker] = useState(false);
  const primaryRef = useRef(null);
  const secondaryRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    const normalized = {
      ...style,
      avatarUrl: style.avatarUrl || style.AvatarUrl || style.avatar_url || "",
      title: style.title || style.Title || style.name || "",
      primaryColor: style.primaryColor || style.PrimaryColor || style.primary_color || "#000000",
      secondaryColor: style.secondaryColor || style.SecondaryColor || style.secondary_color || "#ffffff",
      headerBackgroundColor:
        style.headerBackgroundColor || style.HeaderBackgroundColor || style.header_background_color || "#f5f5f5",
      fontFamily: style.fontFamily || style.FontFamily || style.font_family || "Arial",
      allowImageUpload: false,
      allowFileUpload: false,
      position: style.position || style.Position || "bottom-right",
      width: style.width ?? style.Width ?? 380,
      height: style.height ?? style.Height ?? 600,
      theme: style.theme || style.Theme || "light",
      customCss: style.customCss || style.CustomCss || style.custom_css || "",
    };
    setEditorStyle(normalized);
  }, [style]);

  const handleStyleChange = (newStyle) => {
    const updatedStyle = typeof newStyle === 'function' ? newStyle(editorStyle) : newStyle;
    setEditorStyle(updatedStyle);
    setStyle(updatedStyle);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        showPrimaryPicker &&
        primaryRef.current &&
        !primaryRef.current.contains(event.target)
      ) {
        setShowPrimaryPicker(false);
      }

      if (
        showSecondaryPicker &&
        secondaryRef.current &&
        !secondaryRef.current.contains(event.target)
      ) {
        setShowSecondaryPicker(false);
      }

      if (
        showHeaderBgPicker &&
        headerRef.current &&
        !headerRef.current.contains(event.target)
      ) {
        setShowHeaderBgPicker(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPrimaryPicker, showSecondaryPicker, showHeaderBgPicker]);

  const handleSelectChange = (name) => (e) => {
    const value = e.target.value;

    if (name === "theme") {
      handleStyleChange((prev) => {
        if (prev.theme === value) return prev;

        let updated = { ...prev, theme: value };

        if (value === "light") {
          updated.primaryColor = "#000000"; // ✔️ Texto y botones
          updated.secondaryColor = "#ffffff"; // ✔️ Fondo del widget
          updated.headerBackgroundColor = "#f5f5f5"; // ✔️ Header claro
        } else if (value === "dark") {
          updated.primaryColor = "#ffffff"; // ✔️ Texto y botones
          updated.secondaryColor = "#000000"; // ✔️ Fondo del widget
          updated.headerBackgroundColor = "#2a2a2a"; // ✔️ Header oscuro
        }

        return updated;
      });
    } else {
      handleStyleChange((prev) => ({ ...prev, [name]: value }));

      if (name === "position") {
        setShowPreviewWidget(true);
      }
    }
  };

  return (
    <SoftBox width="100%" maxWidth="900px" px={2}>
      <SoftBox mb={2}>
        <AvatarUploader style={editorStyle} setStyle={handleStyleChange} />
      </SoftBox>
      <SoftBox mb={2}>
        <SoftTypography variant="caption">Nombre del widget</SoftTypography>
        <TextField
          fullWidth
          placeholder="Ej. Asistente virtual"
          value={editorStyle.title || ""}
          onChange={(e) => handleStyleChange((prev) => ({ ...prev, title: e.target.value }))}
        />
      </SoftBox>

      <SoftBox mb={2}>
        <SoftTypography variant="caption">
          Tema {!allowCustomTheme && <span style={{ fontSize: "0.7rem", color: "#f0a500" }}>🔒 Solo en planes superiores</span>}
        </SoftTypography>
        <SoftSelect
          label="Tema"
          value={editorStyle.theme || "light"}
          onChange={handleSelectChange("theme")}
          fullWidth
          disabled={!allowCustomTheme}
        >
          {["light", "dark", "custom"].map((value) => (
            <MenuItem
              key={value}
              value={value}
              disabled={value === "custom" && !allowCustomTheme}
              style={{ width: "100%" }}
            >
              {value === "light" ? "Claro" : value === "dark" ? "Oscuro" : allowCustomTheme ? "Personalizado" : "Personalizado 🔒"}
            </MenuItem>
          ))}
        </SoftSelect>
      </SoftBox>

      <SoftBox mb={2} display="flex" gap={3}>
        {/* Color texto y botones */}
        <SoftBox flex={1}>
          <SoftTypography variant="caption">Color del texto y botones</SoftTypography>
          <SoftBox display="flex" alignItems="center" gap={2} mt={1}>
            <SoftBox
              width="40px"
              height="40px"
              sx={{ backgroundColor: editorStyle.primaryColor || "#000000" }}
              border="1px solid #ccc"
              borderRadius="8px"
            />
            {editorStyle.theme === "custom" && (
              <SoftButton
                onClick={() => {
                  setShowPrimaryPicker((prev) => !prev);
                  setShowSecondaryPicker(false);
                  setShowHeaderBgPicker(false);
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
              ref={primaryRef}
              className="color-picker"
              style={{ position: "relative", marginTop: "8px" }}
            >
              <SketchPicker
                color={editorStyle.primaryColor}
                onChangeComplete={(color) =>
                  handleStyleChange((prev) => ({ ...prev, primaryColor: color.hex }))
                }
                disableAlpha
              />

            </div>
          )}

        </SoftBox>

        {/* Color de fondo del widget */}
        <SoftBox flex={1}>
          <SoftTypography variant="caption">Color de fondo del widget</SoftTypography>
          <SoftBox display="flex" alignItems="center" gap={2} mt={1}>
            <SoftBox
              width="40px"
              height="40px"
              sx={{ backgroundColor: editorStyle.secondaryColor || "#ffffff" }}
              border="1px solid #ccc"
              borderRadius="8px"
            />
            {editorStyle.theme === "custom" && (
              <SoftButton
                onClick={() => {
                  setShowSecondaryPicker((prev) => !prev);
                  setShowPrimaryPicker(false);
                  setShowHeaderBgPicker(false);
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
              ref={secondaryRef}
              className="color-picker"
              style={{ position: "relative", marginTop: "8px" }}
            >
              <SketchPicker
                color={editorStyle.secondaryColor}
                onChangeComplete={(color) =>
                  handleStyleChange((prev) => ({ ...prev, secondaryColor: color.hex }))
                }
                disableAlpha
              />

            </div>
          )}

        </SoftBox>

        {/* Color de fondo del header */}
        <SoftBox flex={1}>
          <SoftTypography variant="caption">Color de fondo del header</SoftTypography>
          <SoftBox display="flex" alignItems="center" gap={2} mt={1}>
            <SoftBox
              width="40px"
              height="40px"
              sx={{ backgroundColor: editorStyle.headerBackgroundColor || "#f5f5f5" }}
              border="1px solid #ccc"
              borderRadius="8px"
            />
            {editorStyle.theme === "custom" && (
              <SoftButton
                onClick={() => {
                  setShowHeaderBgPicker((prev) => !prev);
                  setShowPrimaryPicker(false);
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
          {showHeaderBgPicker && (
            <div
              ref={headerRef}
              className="color-picker"
              style={{ position: "relative", marginTop: "8px" }}
            >
              <SketchPicker
                color={editorStyle.headerBackgroundColor || "#f5f5f5"}
                onChangeComplete={(color) =>
                  handleStyleChange((prev) => ({ ...prev, headerBackgroundColor: color.hex }))
                }
                disableAlpha
              />

            </div>
          )}

        </SoftBox>
      </SoftBox>

      <SoftBox mb={2} display="flex" gap={3}>
        <SoftBox flex={1}>
          <SoftTypography variant="caption">
            Fuente {!allowCustomTheme && <span style={{ fontSize: "0.7rem", color: "#f0a500" }}>🔒</span>}
          </SoftTypography>
          <SoftSelect
            label="Fuente"
            value={editorStyle.fontFamily || "Arial"}
            onChange={handleSelectChange("fontFamily")}
            fullWidth
          >
            {[
              "Arial",
              "Helvetica",
              "Roboto",
              "Open Sans",
              "Lato",
              "Montserrat",
              "Poppins",
              "Inter",
              "Nunito",
              "Georgia",
              "Garamond",
              "Times New Roman",
              "Palatino",
              "Courier New",
              "Consolas",
              "Monaco",
              "Comic Sans MS",
              "Verdana",
              "Trebuchet MS",
              "Tahoma",
              "Impact",
            ].map((font) => (
              <MenuItem
                key={font}
                value={font}
                disabled={!allowCustomTheme && font !== "Arial"}
                style={{ fontFamily: font, width: "100%" }}
              >
                {font}{!allowCustomTheme && font !== "Arial" ? " 🔒" : ""}
              </MenuItem>
            ))}
          </SoftSelect>
        </SoftBox>

        <SoftBox flex={1}>
          <SoftTypography variant="caption">
            Posición {!allowCustomTheme && <span style={{ fontSize: "0.7rem", color: "#f0a500" }}>🔒 Posiciones limitadas</span>}
          </SoftTypography>
          <SoftSelect
            label="Posición"
            value={editorStyle.position || "bottom-right"}
            onChange={handleSelectChange("position")}
            fullWidth
          >
            {[
              ["top-left", "Arriba izquierda"],
              ["top-right", "Arriba derecha"],
              ["center-left", "Centro izquierda"],
              ["center-right", "Centro derecha"],
              ["bottom-left", "Abajo izquierda"],
              ["bottom-right", "Abajo derecha"],
            ].map(([value, label]) => {
              const isFreeAllowed = value === "bottom-left" || value === "bottom-right";
              return (
                <MenuItem
                  key={value}
                  value={value}
                  disabled={!allowCustomTheme && !isFreeAllowed}
                  style={{ width: "100%" }}
                >
                  {label}{!allowCustomTheme && !isFreeAllowed ? " 🔒" : ""}
                </MenuItem>
              );
            })}
          </SoftSelect>
        </SoftBox>
      </SoftBox>

      <SoftBox mb={2}>
        <SoftTypography variant="button" fontWeight="bold" color="text" style={{ fontSize: "0.85rem" }}>
          Opciones de carga: puedes habilitar o deshabilitar los campos de imágenes y documentos
        </SoftTypography>
      </SoftBox>

      {!allowWidgetUploads && (
        <SoftBox mb={2} p={1.5} sx={{ border: "1.5px dashed #f0a500", borderRadius: 2, backgroundColor: "#fffbf0", display: "flex", alignItems: "center", gap: 1 }}>
          <span>🔒</span>
          <SoftTypography variant="caption" color="warning" fontWeight="bold">
            Opciones de carga disponibles en planes superiores
          </SoftTypography>
        </SoftBox>
      )}

      <SoftBox mb={3} ml={2} display="flex" gap={3}>
        <FormControlLabel
          labelPlacement="end"
          control={
            <Checkbox
              checked={editorStyle.allowImageUpload ?? false}
              onChange={(e) =>
                handleStyleChange((prev) => ({ ...prev, allowImageUpload: e.target.checked }))
              }
              disabled={!allowWidgetUploads}
              sx={{ color: '#00bcd4', '&.Mui-checked': { color: '#00bcd4' } }}
            />
          }
          label={
            <SoftTypography style={{ fontSize: "0.75rem" }}>
              Permitir carga de imágenes
            </SoftTypography>
          }
        />
        <FormControlLabel
          labelPlacement="end"
          control={
            <Checkbox
              checked={editorStyle.allowFileUpload ?? false}
              onChange={(e) =>
                handleStyleChange((prev) => ({ ...prev, allowFileUpload: e.target.checked }))
              }
              disabled={!allowWidgetUploads}
              sx={{ color: '#00bcd4', '&.Mui-checked': { color: '#00bcd4' } }}
            />
          }
          label={
            <SoftTypography style={{ fontSize: "0.75rem" }}>
              Permitir carga de archivos
            </SoftTypography>
          }
        />
      </SoftBox>

      <SaveApplyButtons
        style={editorStyle}
        botId={parseInt(botId)}
        userId={userId}
        onStyleSaved={(savedStyle) => {
          handleStyleChange((prev) => ({ ...prev, ...savedStyle }));
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
  setLoading: PropTypes.func.isRequired,
  setLoadingMessage: PropTypes.func.isRequired,
  allowCustomTheme: PropTypes.bool,
  allowWidgetUploads: PropTypes.bool,
};
