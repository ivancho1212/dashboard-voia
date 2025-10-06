import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  IconButton,
  Tooltip
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ComputerIcon from '@mui/icons-material/Computer';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SchoolIcon from '@mui/icons-material/School';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import PaletteIcon from '@mui/icons-material/Palette';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import SecurityIcon from '@mui/icons-material/Security';
import EngineeringIcon from '@mui/icons-material/Engineering';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import FlightIcon from '@mui/icons-material/Flight';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import PetsIcon from '@mui/icons-material/Pets';
import SportsIcon from '@mui/icons-material/Sports';

const ProfessionalAvatarPicker = ({ onAvatarSelect, selectedAvatar }) => {
  const [selectedCategory, setSelectedCategory] = useState('business');

  // Emojis profesionales reales organizados por categoría
  const professionalEmojis = {
    business: [
      '💼', // Icono de negocios
      '👩‍💼', // Mujer de negocios
      '🧑‍💼'  // Persona de negocios
    ],
    medical: [
      '🏥', // Icono de hospital
      '👩‍⚕️', // Doctora mujer
      '🧑‍⚕️'  // Personal médico
    ],
    tech: [
      '💻', // Icono de tecnología
      '👩‍💻', // Programadora mujer
      '🧑‍💻'  // Desarrollador
    ],
    legal: [
      '⚖️', // Icono de justicia
      '👩‍⚖️', // Jueza mujer
      '🧑‍⚖️'  // Personal legal
    ],
    education: [
      '🎓', // Icono de educación
      '👩‍🏫', // Profesora mujer
      '🧑‍🏫'  // Educador
    ],
    support: [
      '🎧', // Icono de soporte
      '🙋‍♂️', // Asistente hombre
      '🙋‍♀️'  // Asistente mujer
    ],
    creative: [
      '🎨', // Icono de arte
      '👩‍🎨', // Artista mujer
      '🧑‍🎨'  // Creativo
    ],
    food: [
      '🍽️', // Icono de gastronomía
      '👩‍🍳', // Chef mujer
      '🧑‍🍳'  // Cocinero
    ],
    security: [
      '🛡️', // Icono de seguridad
      '👮‍♂️', // Policía hombre
      '👮‍♀️', // Policía mujer
      '🧑‍✈️'  // Oficial de seguridad
    ],
    engineering: [
      '⚙️', // Icono de ingeniería
      '👨‍🔧', // Ingeniero hombre
      '👩‍🔧', // Ingeniera mujer
      '🧑‍🏭'  // Trabajador industrial
    ],
    agriculture: [
      '🚜', // Icono de campo/agricultura
      '👩‍🌾', // Agricultora mujer
      '🧑‍🌾'  // Trabajador del campo
    ],
    aviation: [
      '✈️', // Icono de aviación
      '👩‍✈️', // Piloto mujer
      '🧑‍✈️'  // Personal de aviación
    ],
    sports: [
      '⚽', // Icono de deportes
      '🏃‍♂️', // Corredor hombre
      '🏃‍♀️', // Corredora mujer
      '🏋️‍♂️', // Levantador de pesas hombre
      '🏋️‍♀️', // Levantadora de pesas mujer
      '🤾‍♂️', // Jugador de balonmano hombre
      '🏊‍♂️', // Nadador hombre
      '🏊‍♀️', // Nadadora mujer
      '🚴‍♂️', // Ciclista hombre
      '🚴‍♀️', // Ciclista mujer
      '🧗‍♂️', // Escalador hombre
      '🧗‍♀️'  // Escaladora mujer
    ],
    faces: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', 
      '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', 
      '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛', 
      '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', 
      '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', 
      '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', 
      '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', 
      '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', 
      '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', 
      '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', 
      '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', 
      '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', 
      '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', 
      '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'
    ],
    animals: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', 
      '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', 
      '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', 
      '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', 
      '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', 
      '🐜', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', 
      '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', 
      '🐡', '🐠', '🐟', '🐝', '🐳', '🐋', '🦈', '🐊', 
      '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', 
      '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', 
      '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', 
      '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🦃', '🦚', '🦜', 
      '🦢', '🦩', '🐇', '🦝', '🦨', '🦡', '🦦', 
      '🐁', '🐀', '🐿️', '🦔'
    ]
  };

  // Categorías con iconos solamente
  const categories = {
    business: { 
      icon: <BusinessIcon />, 
      name: 'Negocios'
    },
    medical: { 
      icon: <LocalHospitalIcon />, 
      name: 'Medicina'
    },
    tech: { 
      icon: <ComputerIcon />, 
      name: 'Tecnología'
    },
    legal: { 
      icon: <AccountBalanceIcon />, 
      name: 'Legal'
    },
    education: { 
      icon: <SchoolIcon />, 
      name: 'Educación'
    },
    support: { 
      icon: <SupportAgentIcon />, 
      name: 'Soporte'
    },
    creative: { 
      icon: <PaletteIcon />, 
      name: 'Creativos'
    },
    food: { 
      icon: <RestaurantIcon />, 
      name: 'Gastronomía'
    },
    security: { 
      icon: <SecurityIcon />, 
      name: 'Seguridad'
    },
    engineering: { 
      icon: <EngineeringIcon />, 
      name: 'Ingeniería'
    },
    agriculture: { 
      icon: <AgricultureIcon />, 
      name: 'Campo'
    },
    aviation: { 
      icon: <FlightIcon />, 
      name: 'Aviación'
    },
    sports: { 
      icon: <SportsIcon />, 
      name: 'Deportes'
    },
    faces: { 
      icon: <EmojiEmotionsIcon />, 
      name: 'Caras'
    },
    animals: { 
      icon: <PetsIcon />, 
      name: 'Animales'
    }
  };

  const handleEmojiClick = (emoji) => {
    onAvatarSelect(emoji);
  };

  const handleCategorySelect = (categoryKey) => {
    setSelectedCategory(categoryKey);
  };

  return (
    <Box sx={{ p: 3, maxHeight: '500px', overflow: 'auto' }}>
      {/* Categorías con iconos solamente */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          Categorías Profesionales
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {Object.entries(categories).map(([key, category]) => (
            <Tooltip key={key} title={category.name}>
              <IconButton
                onClick={() => handleCategorySelect(key)}
                sx={{
                  border: selectedCategory === key ? 2 : 1,
                  borderColor: selectedCategory === key ? 'info.main' : 'divider',
                  borderRadius: 2,
                  p: 1.5,
                  bgcolor: selectedCategory === key ? 'info.light' : 'background.paper',
                  '&:hover': {
                    bgcolor: 'info.light',
                    borderColor: 'info.main'
                  }
                }}
              >
                {category.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Box>
      </Box>

      {/* Grid de emojis profesionales */}
      <Grid container spacing={2}>
        {professionalEmojis[selectedCategory]?.map((emoji, index) => (
          <Grid item xs={6} sm={4} md={3} key={index}>
            <Card
              sx={{
                cursor: 'pointer',
                border: selectedAvatar === emoji ? 2 : 1,
                borderColor: selectedAvatar === emoji ? 'info.main' : 'divider',
                bgcolor: selectedAvatar === emoji ? 'info.light' : 'background.paper',
                '&:hover': {
                  borderColor: 'info.main',
                  bgcolor: 'info.light'
                },
                transition: 'all 0.2s ease',
                minHeight: '100px'
              }}
              onClick={() => handleEmojiClick(emoji)}
            >
              <CardContent sx={{ 
                p: 1.5, 
                textAlign: 'center', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:last-child': { pb: 1.5 } 
              }}>
                <Typography sx={{ fontSize: '3rem', lineHeight: 1 }}>
                  {/* Se fuerza una fuente compatible con emojis modernos */}
                  <style>{`
                    .emoji-font {
                      font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', 'Android Emoji', 'EmojiOne Color', 'Twemoji Mozilla', sans-serif !important;
                    }
                  `}</style>
                  <span className="emoji-font" style={{ fontSize: '3rem', lineHeight: 1 }}>{emoji}</span>
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {!professionalEmojis[selectedCategory]?.length && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No se encontraron avatares para esta categoría
          </Typography>
        </Box>
      )}
    </Box>
  );
};

ProfessionalAvatarPicker.propTypes = {
  onAvatarSelect: PropTypes.func.isRequired,
  selectedAvatar: PropTypes.string
};

export default ProfessionalAvatarPicker;