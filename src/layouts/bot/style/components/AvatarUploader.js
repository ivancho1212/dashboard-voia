import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import { Dialog, DialogTitle, DialogContent, Tabs, Tab, Box } from "@mui/material";
import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import AvatarComponent from "./chat/AvatarComponent";
import ProfessionalAvatarPicker from "components/ProfessionalAvatarPicker";

export default function AvatarUploader({ style, setStyle }) {
  const inputRef = useRef();
  const defaultAvatar = "/VIA.png";
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setStyle((prev) => ({ ...prev, avatarUrl: reader.result }));
      setModalOpen(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUploadClick = () => {
    inputRef.current.click();
  };

  const handleEmojiSelect = (emoji) => {
    setStyle((prev) => ({ ...prev, avatarUrl: emoji }));
    setModalOpen(false);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <SoftBox display="flex" flexDirection="column" alignItems="center" gap={1} mb={2}>
      <SoftBox
        width="120px"
        height="120px"
        borderRadius="50%"
        overflow="hidden"
        display="flex"
        justifyContent="center"
        alignItems="center"
        boxShadow="sm"
        bgcolor="#eee"
      >
        <AvatarComponent
          avatarUrl={style.avatarUrl}
          size="120px"
          defaultAvatar={defaultAvatar}
        />
      </SoftBox>

      <input
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        ref={inputRef}
        onChange={handleFileChange}
      />

      <SoftButton size="small" onClick={() => setModalOpen(true)}>
        Cambiar Avatar
      </SoftButton>

      {/* Modal para seleccionar avatar */}
      <Dialog 
        open={modalOpen} 
        onClose={() => setModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px', // Esquinas más redondeadas
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle>Seleccionar Avatar</DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab label="Subir Imagen" />
              <Tab label="Emojis Profesionales" />
            </Tabs>
          </Box>
          
          {activeTab === 0 && (
            <SoftBox display="flex" flexDirection="column" alignItems="center" gap={2} py={3}>
              <SoftButton onClick={handleFileUploadClick}>
                Seleccionar Archivo
              </SoftButton>
              <p style={{ textAlign: 'center', color: '#666', margin: 0 }}>
                Formatos soportados: JPG, PNG, GIF
              </p>
            </SoftBox>
          )}
          
          {activeTab === 1 && (
            <ProfessionalAvatarPicker
              onAvatarSelect={handleEmojiSelect}
              selectedAvatar={style.avatarUrl}
            />
          )}
        </DialogContent>
      </Dialog>
    </SoftBox>
  );
}

AvatarUploader.propTypes = {
  style: PropTypes.object.isRequired,
  setStyle: PropTypes.func.isRequired,
};
