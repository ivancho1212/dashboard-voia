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

import Switch from "@mui/material/Switch";
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
      allowImageUpload:
        style.allowImageUpload ?? style.AllowImageUpload ?? style.allow_image_upload ?? true,
      allowFileUpload:
        style.allowFileUpload ?? style.AllowFileUpload ?? style.allow_file_upload ?? true,
      position: style.position || style.Position || "bottom-right",
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
        <SoftTypography variant="caption">Tema</SoftTypography>
        <SoftSelect
          label="Tema"
          value={editorStyle.theme || "light"}
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
          <SoftTypography variant="caption">Fuente</SoftTypography>
          <SoftSelect
            label="Fuente"
            value={editorStyle.fontFamily || "Arial"}
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
            value={editorStyle.position || "bottom-right"}
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

      <SoftBox mb={2}>
        <SoftTypography variant="button" fontWeight="bold" color="text" style={{ fontSize: "0.85rem" }}>
          Opciones de carga: puedes habilitar o deshabilitar los campos de imágenes y documentos
        </SoftTypography>
      </SoftBox>

      <SoftBox mb={3} ml={2} display="flex" gap={3}>
        <FormControlLabel
          labelPlacement="end"
          control={
            <Switch
              checked={editorStyle.allowImageUpload ?? true}
              onChange={(e) =>
                handleStyleChange((prev) => ({ ...prev, allowImageUpload: e.target.checked }))
              }
              color="info" // asegúrate de que "info" esté definido en el theme
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#00bcd4', // color info personalizado
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#00bcd4',
                },
              }}
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
            <Switch
              checked={editorStyle.allowFileUpload ?? true}
              onChange={(e) =>
                handleStyleChange((prev) => ({ ...prev, allowFileUpload: e.target.checked }))
              }
              color="info"
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#00bcd4',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#00bcd4',
                },
              }}
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
  setLoading: PropTypes.func.isRequired, // ✅ Agrega esto
  setLoadingMessage: PropTypes.func.isRequired, // ✅ Agrega esto
};
