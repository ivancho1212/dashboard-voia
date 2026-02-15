// v2.1.0 - Date filter with colored calendar icons
import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import SoftTypography from "components/SoftTypography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import InputAdornment from "@mui/material/InputAdornment";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FilterListIcon from "@mui/icons-material/FilterList";
import BlockIcon from "@mui/icons-material/Block";
import { format, startOfDay, differenceInDays, isSameDay, parseISO, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import ClearIcon from '@mui/icons-material/Clear';
import ConversationActions from "./ConversationActions";
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import Loader from "components/Loader";
import Button from "@mui/material/Button";
import RefreshIcon from "@mui/icons-material/Refresh";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import Badge from "@mui/material/Badge";

// Helper para formato de tiempo estilo WhatsApp
// Maneja correctamente timezones mixtos comparando en zona horaria local
function getCompactTimeAgo(date) {
  if (!date) return "";
  
  const now = new Date();
  const targetDate = new Date(date);
  
  // Validar que la fecha sea válida
  if (isNaN(targetDate.getTime())) return "";
  
  // 🔧 Comparar año/mes/día directamente en zona horaria local para evitar problemas de timezone
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth();
  const nowDay = now.getDate();
  
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();
  const targetDay = targetDate.getDate();
  
  // Calcular diferencia de días de forma manual (más robusto con timezones mixtos)
  const isSameDay = nowYear === targetYear && nowMonth === targetMonth && nowDay === targetDay;
  
  // Si es hoy: mostrar hora en formato 12h AM/PM (ej: "2:30 PM")
  if (isSameDay) {
    return format(targetDate, "h:mm a", { locale: es }).toUpperCase();
  }
  
  // Calcular diferencia de días calendarios
  const nowDayStart = new Date(nowYear, nowMonth, nowDay);
  const targetDayStart = new Date(targetYear, targetMonth, targetDay);
  const daysDiff = Math.floor((nowDayStart - targetDayStart) / (1000 * 60 * 60 * 24));
  
  // Si fue ayer: mostrar "Ayer"
  if (daysDiff === 1) {
    return "Ayer";
  }
  
  // Si es de esta semana (2-6 días atrás): mostrar día de la semana
  if (daysDiff > 1 && daysDiff < 7) {
    return format(targetDate, "EEEE", { locale: es }); // "lunes", "martes", etc.
  }
  
  // Si es más antiguo o fecha futura: mostrar fecha (ej: "13/02/26")
  return format(targetDate, "dd/MM/yy");
}

function ConversationList({
  conversations,
  messagesMap,
  onSelect,
  onStatusChange,
  onBlock,
  highlightedIds = [],
  onClearHighlight = () => {},
  activeTab,
  onShowTrash,
  onMovedToTrash,
  loading = false,
  error = null,
  onRetry = () => {}
}) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [filter, setFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  // ✅ Timer para forzar re-render cada 15s y re-evaluar Date.now() en el LED de heartbeat
  // Sin esto, el punto verde queda congelado cuando dejan de llegar heartbeats
  const [, setHeartbeatTick] = useState(0);
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setHeartbeatTick(t => t + 1);
    }, 15000);
    return () => clearInterval(tickInterval);
  }, []);

  const handleOpenMenu = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);
  const handleFilterChange = (value) => {
    setFilter(value);
    handleCloseMenu();
  };

  const filtered = useMemo(() => {
    const result = conversations
      // Mostrar correctamente conversaciones expiradas/cerradas
      .filter((conv) => {
        if (filter === "active") return conv.status === "activa";
        if (filter === "closed") return conv.status === "cerrada" || conv.status === "closed" || conv.status === "expired" || conv.status === "expirada";
        if (filter === "pending") return conv.status === "pendiente";
        if (filter === "resolved") return conv.status === "resuelta";
        if (filter === "blocked") return conv.blocked === true;
        return true;
      })
      .filter((conv) => {
        const convId = `${conv.id}`;
        const textToSearch = `Sesión ${conv.id} ${conv.lastMessage || ""}`;
        const fullMessages = (messagesMap[convId] || []).map((msg) => msg.text || "").join(" ");
        return `${textToSearch} ${fullMessages}`.toLowerCase().includes(search.toLowerCase());
      })
      // Filtrar por rango de fechas
      .filter((conv) => {
        if (!dateFrom && !dateTo) return true; // Sin filtro de fecha
        
        const convDate = new Date(conv.updatedAt);
        const from = dateFrom ? startOfDay(parseISO(dateFrom)) : null;
        const to = dateTo ? new Date(new Date(dateTo).setHours(23, 59, 59, 999)) : null;
        
        if (from && to) {
          return isWithinInterval(convDate, { start: from, end: to });
        } else if (from) {
          return convDate >= from;
        } else if (to) {
          return convDate <= to;
        }
        return true;
      })
      // ✅ Orden garantizado: conversaciones más recientes primero (ordenar por updatedAt descendente)
      .sort((a, b) => {
        const timeA = new Date(a.updatedAt).getTime();
        const timeB = new Date(b.updatedAt).getTime();
        return timeB - timeA; // Descendente: más recientes primero
      });
    return result;
  }, [conversations, messagesMap, filter, search, dateFrom, dateTo]);

  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = `
    @keyframes flash {
      0% { background-color: #fffde7; }
      50% { background-color: #fff176; }
      100% { background-color: #fffde7; }
    }
    @keyframes border-glow-green {
      0%, 100% {
        border-color: #39FF14;
        box-shadow: inset 0 0 6px rgba(57, 255, 20, 0.3), 0 0 8px rgba(57, 255, 20, 0.2);
      }
      50% {
        border-color: rgba(57, 255, 20, 0.4);
        box-shadow: inset 0 0 3px rgba(57, 255, 20, 0.15), 0 0 4px rgba(57, 255, 20, 0.1);
      }
    }
    @keyframes border-glow-green-orange {
      0%, 40% {
        border-color: #39FF14;
        box-shadow: inset 0 0 6px rgba(57, 255, 20, 0.3), 0 0 8px rgba(57, 255, 20, 0.2);
      }
      50%, 90% {
        border-color: #FF9800;
        box-shadow: inset 0 0 6px rgba(255, 152, 0, 0.3), 0 0 8px rgba(255, 152, 0, 0.2);
      }
      100% {
        border-color: #39FF14;
        box-shadow: inset 0 0 6px rgba(57, 255, 20, 0.3), 0 0 8px rgba(57, 255, 20, 0.2);
      }
    }
  `;
    document.head.appendChild(styleTag);
    return () => document.head.removeChild(styleTag);
  }, []);

  useEffect(() => {
    if (!highlightedIds.length) return;
    const timeout = setTimeout(() => {
      highlightedIds.forEach((id) => onClearHighlight(id));
    }, 5000);
    return () => clearTimeout(timeout);
  }, [highlightedIds]);

  return (
    <Box display="flex" flexDirection="column" sx={{ height: "100%", minHeight: 0 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <SoftTypography variant="h5" color="info" fontWeight="bold">
          Conversaciones
        </SoftTypography>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={handleOpenMenu} color="info">
            <FilterListIcon />
          </IconButton>
          <Tooltip title="Ver papelera">
            <IconButton onClick={onShowTrash} sx={{ color: '#b0b0b0' }}>
              <DeleteOutlineIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
          <MenuItem onClick={() => handleFilterChange("all")}>Todas</MenuItem>
          <MenuItem onClick={() => handleFilterChange("active")}>Activas</MenuItem>
          <MenuItem onClick={() => handleFilterChange("closed")}>Cerradas</MenuItem>
          <MenuItem onClick={() => handleFilterChange("pending")}>Pendientes</MenuItem>
          <MenuItem onClick={() => handleFilterChange("resolved")}>Resueltas</MenuItem>
          <MenuItem onClick={() => handleFilterChange("blocked")}>Bloqueados</MenuItem>
        </Menu>
      </Box>

      <Box mb={2} display="flex" flexDirection="column" gap={1}>
        <TextField
          variant="outlined"
          fullWidth
          size="small"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            sx: { borderRadius: 2, backgroundColor: "#f8f9fa", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" },
            startAdornment: <InputAdornment position="start">🔍</InputAdornment>,
          }}
        />
        
        {/* Filtro por fechas - sin contenedor para máximo ancho */}
        <Box display="flex" alignItems="center" gap={0.8}>
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: "10.5px", 
              fontWeight: 600, 
              color: "#666",
              minWidth: "40px",
              flexShrink: 0
            }}
          >
            Desde:
          </Typography>
          <TextField
            type="date"
            size="small"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            sx={{ 
              flex: 1,
              minWidth: 0,
              '& .MuiOutlinedInput-root': {
                backgroundColor: "#f8f9fa !important",
                fontSize: "12px !important",
                height: "40px !important",
                minHeight: "40px !important",
                borderRadius: "8px !important"
              },
              '& .MuiOutlinedInput-input': {
                padding: "6px 10px !important",
                height: "40px !important",
                boxSizing: "border-box !important"
              },
              '& input[type="date"]::-webkit-calendar-picker-indicator': {
                filter: 'invert(58%) sepia(89%) saturate(1200%) hue-rotate(160deg) brightness(95%) contrast(101%) !important',
                cursor: 'pointer !important',
                width: '20px !important',
                height: '20px !important',
                marginTop: '0 !important',
                padding: '0 !important',
                opacity: '1 !important'
              },
              '& input[type="date"]::-webkit-calendar-picker-indicator:hover': {
                filter: 'invert(48%) sepia(99%) saturate(1500%) hue-rotate(160deg) brightness(100%) contrast(105%) !important',
                transform: 'scale(1.1) !important'
              }
            }}
          />
        </Box>
        
        <Box display="flex" alignItems="center" gap={0.8}>
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: "10.5px", 
              fontWeight: 600, 
              color: "#666",
              minWidth: "40px",
              flexShrink: 0
            }}
          >
            Hasta:
          </Typography>
          <TextField
            type="date"
            size="small"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            sx={{ 
              flex: 1,
              minWidth: 0,
              '& .MuiOutlinedInput-root': {
                backgroundColor: "#f8f9fa !important",
                fontSize: "12px !important",
                height: "40px !important",
                minHeight: "40px !important",
                borderRadius: "8px !important"
              },
              '& .MuiOutlinedInput-input': {
                padding: "6px 10px !important",
                height: "40px !important",
                boxSizing: "border-box !important"
              },
              '& input[type="date"]::-webkit-calendar-picker-indicator': {
                filter: 'invert(58%) sepia(89%) saturate(1200%) hue-rotate(160deg) brightness(95%) contrast(101%) !important',
                cursor: 'pointer !important',
                width: '20px !important',
                height: '20px !important',
                marginTop: '0 !important',
                padding: '0 !important',
                opacity: '1 !important'
              },
              '& input[type="date"]::-webkit-calendar-picker-indicator:hover': {
                filter: 'invert(48%) sepia(99%) saturate(1500%) hue-rotate(160deg) brightness(100%) contrast(105%) !important',
                transform: 'scale(1.1) !important'
              }
            }}
          />
          {(dateFrom || dateTo) && (
            <Tooltip title="Limpiar">
              <IconButton 
                size="small" 
                onClick={() => { setDateFrom(""); setDateTo(""); }}
                color="info"
                sx={{ 
                  width: "40px !important",
                  height: "40px !important",
                  minWidth: "40px !important",
                  minHeight: "40px !important",
                  flexShrink: 0,
                  backgroundColor: "#e3f2fd !important",
                  '&:hover': { 
                    backgroundColor: "#bbdefb !important"
                  }
                }}
              >
                <ClearIcon sx={{ fontSize: "18px" }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", minHeight: 0, maxWidth: "100%" }}>
        {loading ? (
          <Loader message="Cargando conversaciones..." />
        ) : error ? (
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            justifyContent="center" 
            p={4}
            sx={{ height: "100%", textAlign: "center" }}
          >
            <ErrorOutlineIcon sx={{ fontSize: 60, color: "#ff9800", mb: 2 }} />
            <SoftTypography variant="h6" color="error" mb={1}>
              Error al cargar
            </SoftTypography>
            <SoftTypography variant="body2" color="text" mb={3} sx={{ maxWidth: 300 }}>
              {error}
            </SoftTypography>
            <Button 
              variant="contained" 
              color="info" 
              startIcon={<RefreshIcon />}
              onClick={onRetry}
              sx={{ textTransform: "none" }}
            >
              Reintentar
            </Button>
          </Box>
        ) : (
        <List sx={{ width: "100%", padding: 0 }}>
          {filtered.map((conv) => {
            const hasUnread = conv.unreadCount > 0 && conv.id !== activeTab;
            
            // ✅ Calcular estado visual para el borde
            const HEARTBEAT_INACTIVITY_THRESHOLD = 45 * 1000;
            const isHeartbeatActive = conv.lastHeartbeatTime 
              && (Date.now() - new Date(conv.lastHeartbeatTime) < HEARTBEAT_INACTIVITY_THRESHOLD)
              && conv.status !== "inactiva" && conv.status !== "cerrada" && conv.status !== "resuelta";
            const isPending = conv.status === "pendiente";
            const isBlocked = conv.blocked === true;
            const isClosed = ["cerrada", "closed", "resuelta", "expired", "expirada"].includes(conv.status?.toLowerCase());
            const isInactive = conv.status === "inactiva";

            // Determinar color y estilo del borde
            let borderColor = '#d0d0d0'; // default: gris suave
            let borderShadow = '0 1px 3px rgba(0,0,0,0.05)';
            let borderAnimation = 'none';
            let statusLabel = conv.status || 'activa';

            if (isBlocked) {
              borderColor = '#f44336';
              borderShadow = 'inset 0 0 6px rgba(244, 67, 54, 0.25), 0 0 6px rgba(244, 67, 54, 0.15)';
              statusLabel = 'bloqueada';
            } else if (isHeartbeatActive && isPending) {
              borderColor = '#39FF14';
              borderShadow = 'inset 0 0 6px rgba(57, 255, 20, 0.3), 0 0 8px rgba(57, 255, 20, 0.2)';
              borderAnimation = 'border-glow-green-orange 2s infinite';
              statusLabel = 'en línea (pendiente)';
            } else if (isHeartbeatActive) {
              borderColor = '#39FF14';
              borderShadow = 'inset 0 0 6px rgba(57, 255, 20, 0.3), 0 0 8px rgba(57, 255, 20, 0.2)';
              borderAnimation = 'border-glow-green 1.5s infinite';
              statusLabel = 'en línea';
            } else if (isPending) {
              borderColor = '#FF9800';
              borderShadow = 'inset 0 0 6px rgba(255, 152, 0, 0.25), 0 0 6px rgba(255, 152, 0, 0.15)';
              statusLabel = 'pendiente';
            } else if (isClosed || isInactive) {
              borderColor = '#bdbdbd';
              borderShadow = '0 1px 2px rgba(0,0,0,0.04)';
              statusLabel = isClosed ? 'cerrada' : 'inactiva';
            }

            return (
              <Tooltip key={conv.id} title={`Estado: ${statusLabel}`} placement="left" arrow>
                <ListItemButton
                  onClick={() => { onSelect(conv.id); onClearHighlight(conv.id); }}
                  sx={{
                    mb: 0.5,
                    borderRadius: "10px",
                    padding: "10px 12px",
                    paddingLeft: "14px",
                    backgroundColor: highlightedIds.includes(conv.id) 
                      ? "#fff8e1" 
                      : (activeTab === conv.id ? "#e8f5e9" : "#ffffff"),
                    animation: highlightedIds.includes(conv.id) ? "flash 1s infinite ease-in-out" : borderAnimation,
                    border: `2px solid ${borderColor}`,
                    boxShadow: borderShadow,
                    "&:hover": { 
                      backgroundColor: activeTab === conv.id ? "#e8f5e9" : "#f5f5f5",
                      boxShadow: borderShadow,
                    },
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    maxWidth: "100%",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    transition: "border-color 0.4s ease, box-shadow 0.4s ease, background-color 0.2s ease",
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0, maxWidth: "calc(100% - 90px)", overflow: "hidden", pr: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.3 }}>
                      {/* Badge de no leídos */}
                      {hasUnread && (
                        <Box
                          sx={{
                            minWidth: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: '#17a2b8',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 6px rgba(23, 162, 184, 0.4)',
                            flexShrink: 0,
                            padding: '0 3px'
                          }}
                        >
                          {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                        </Box>
                      )}
                      {/* Icono de bloqueo */}
                      {isBlocked && (
                        <BlockIcon sx={{ fontSize: 16, color: '#f44336', flexShrink: 0 }} />
                      )}
                      {/* Nombre de sesión */}
                      <Typography 
                        variant="body2" 
                        fontWeight={hasUnread ? "bold" : "600"} 
                        color={isBlocked ? "error" : "text.primary"} 
                        noWrap
                        sx={{ fontSize: "12px" }}
                      >
                        Sesión {conv.id}
                      </Typography>
                    </Box>
                    {/* Último mensaje */}
                    <Tooltip title={conv.lastMessage || "Sin mensajes aún"} arrow>
                      <Typography
                        variant="body2"
                        color={hasUnread ? "text.primary" : "secondary"}
                        fontWeight={hasUnread ? "500" : "normal"}
                        sx={{
                          fontSize: "12px",
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          lineHeight: 1.4,
                          width: "100%",
                          wordBreak: "break-word"
                        }}
                      >
                        {conv.lastMessage || "Sin mensajes aún"}
                      </Typography>
                    </Tooltip>
                  </Box>

                  {/* Acciones y fecha */}
                  <Box display="flex" flexDirection="column" alignItems="flex-end" justifyContent="flex-start" sx={{ flexShrink: 0, width: "80px", pl: 0.5 }}>
                    <Box display="flex" alignItems="center" gap={0.3}>
                      {!conv.isWithAI && (
                        <Tooltip title="IA pausada">
                          <IconButton size="small" sx={{ color: "#c632e4ff", p: 0.3 }}>
                            <PauseCircleOutlineIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <ConversationActions
                        onBlock={() => onBlock(conv.id)}
                        onStatusChange={(newStatus) => onStatusChange(conv.id, newStatus)}
                        blocked={conv.blocked}
                        currentStatus={conv.status}
                        conversationId={conv.id}
                        onMovedToTrash={onMovedToTrash ? () => onMovedToTrash(conv.id) : undefined}
                      />
                    </Box>
                    {/* Fecha/hora */}
                    <Typography 
                      variant="caption" 
                      color="secondary" 
                      sx={{ 
                        fontSize: "10px", 
                        mt: 0.3,
                        whiteSpace: "nowrap",
                        fontWeight: 500
                      }}
                    >
                      {getCompactTimeAgo(conv.updatedAt)}
                    </Typography>
                  </Box>
                </ListItemButton>
              </Tooltip>
            )}
          )}
        </List>
        )}
      </Box>
    </Box>
  );
}

ConversationList.propTypes = {
  conversations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      alias: PropTypes.string,
      lastMessage: PropTypes.string,
      updatedAt: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      blocked: PropTypes.bool.isRequired,
      unreadCount: PropTypes.number,
      isWithAI: PropTypes.bool,
      isWidget: PropTypes.bool,
      publicUserId: PropTypes.number,
      lastHeartbeatTime: PropTypes.string, // Added for heartbeat
    })
  ).isRequired,
  messagesMap: PropTypes.objectOf(
    PropTypes.arrayOf(
      PropTypes.shape({
        text: PropTypes.string,
        from: PropTypes.string,
        timestamp: PropTypes.string,
      })
    )
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onBlock: PropTypes.func.isRequired,
  highlightedIds: PropTypes.arrayOf(PropTypes.string),
  onClearHighlight: PropTypes.func,
  activeTab: PropTypes.string,
  onShowTrash: PropTypes.func,
  onMovedToTrash: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func,
};

export default ConversationList;
