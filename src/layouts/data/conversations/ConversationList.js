import React, { useEffect, useMemo } from "react";
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
import FilterListIcon from "@mui/icons-material/FilterList";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import ConversationActions from "./ConversationActions";
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';

function ConversationList({
  conversations,
  messagesMap,
  onSelect,
  onStatusChange,
  onBlock,
  highlightedIds = [],
  onClearHighlight = () => {},
  activeTab,
}) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [filter, setFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");

  const handleOpenMenu = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);
  const handleFilterChange = (value) => {
    setFilter(value);
    handleCloseMenu();
  };

  const filtered = useMemo(() => {
    return conversations
      .filter((conv) => conv.lastMessage || (messagesMap[conv.id] || []).length > 0)
      .filter((conv) => {
        if (filter === "active") return conv.status === "activa";
        if (filter === "closed") return conv.status === "cerrada";
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
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [conversations, messagesMap, filter, search]);

  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = `
    @keyframes flash {
      0% { background-color: #fffde7; }
      50% { background-color: #fff176; }
      100% { background-color: #fffde7; }
    }
    @keyframes led-blink {
      50% {
        opacity: 0.5;
        box-shadow: none;
      }
    }
    @keyframes led-green-orange {
      0%, 49% {
        background-color: #39FF14;
        box-shadow: 0 0 4px #39FF14, 0 0 8px #39FF14;
      }
      50%, 100% {
        background-color: #FF9800;
        box-shadow: 0 0 4px #FF9800, 0 0 8px #FF9800;
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
        <IconButton onClick={handleOpenMenu} color="info">
          <FilterListIcon />
        </IconButton>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
          <MenuItem onClick={() => handleFilterChange("all")}>Todas</MenuItem>
          <MenuItem onClick={() => handleFilterChange("active")}>Activas</MenuItem>
          <MenuItem onClick={() => handleFilterChange("closed")}>Cerradas</MenuItem>
          <MenuItem onClick={() => handleFilterChange("pending")}>Pendientes</MenuItem>
          <MenuItem onClick={() => handleFilterChange("resolved")}>Resueltas</MenuItem>
          <MenuItem onClick={() => handleFilterChange("blocked")}>Bloqueados</MenuItem>
        </Menu>
      </Box>

      <Box mb={2}>
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
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", minHeight: 0, maxWidth: "100%" }}>
        <List sx={{ width: "100%", padding: 0 }}>
          {filtered.map((conv) => {
            const hasUnread = conv.unreadCount > 0 && conv.id !== activeTab;
            return (
              <ListItemButton
                key={conv.id}
                onClick={() => { onSelect(conv.id); onClearHighlight(conv.id); }}
                sx={{
                  mb: 0.5,
                  borderRadius: "8px",
                  padding: "12px",
                  paddingLeft: "20px",
                  backgroundColor: highlightedIds.includes(conv.id) ? "#fff8e1" : (activeTab === conv.id ? "#e3f2fd" : "#f5f5f5"),
                  animation: highlightedIds.includes(conv.id) ? "flash 1s infinite ease-in-out" : "none",
                  "&:hover": { backgroundColor: "#d0f0f6" },
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  maxWidth: "100%",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                <Box sx={{ flex: 1, pr: 1, minWidth: 0, maxWidth: "100%", overflow: "hidden" }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {hasUnread && (
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ff7dabff', flexShrink: 0 }} />
                    )}
                    <Typography variant="subtitle2" fontWeight={hasUnread ? "bold" : "600"} color={conv.blocked ? "error" : "text.primary"} noWrap>
                      {conv.alias || `Usuario ${conv.id.slice(-4)}`}
                    </Typography>
                  </Box>
                  <Tooltip
                    title={conv.lastMessage || "Sin mensajes aún"}
                    arrow
                  >
                    <Typography
                      variant="body2"
                      color={hasUnread ? "text.primary" : "secondary"}
                      fontWeight={hasUnread ? "500" : "normal"}
                      sx={{
                        fontSize: "13px",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        minWidth: 0,
                        textOverflow: "ellipsis",
                        maxWidth: "100%",
                        display: "block",
                        paddingLeft: hasUnread ? '14px' : '0px'
                      }}
                    >
                      {conv.lastMessage || "Sin mensajes aún"}
                    </Typography>
                  </Tooltip>
                </Box>

                <Box display="flex" flexDirection="column" alignItems="flex-end" justifyContent="center" sx={{ flexShrink: 0, maxWidth: "30%" }}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Tooltip title={`Estado: ${conv.status}`}>
                      <Box
                        sx={(() => {
                            const HEARTBEAT_INACTIVITY_THRESHOLD = 45 * 1000;
                            const isHeartbeatActive = conv.lastHeartbeatTime && (Date.now() - new Date(conv.lastHeartbeatTime) < HEARTBEAT_INACTIVITY_THRESHOLD);
                            const isPending = conv.status === "pendiente";

                            const baseLedStyle = {
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                transition: 'all 0.3s ease',
                            };

                            let style = {
                                ...baseLedStyle,
                                backgroundColor: '#444',
                                border: '1px solid #222',
                            };

                            if (isHeartbeatActive) {
                                if (isPending) {
                                    style = { ...style, border: 'none', animation: 'led-green-orange 1.5s infinite' };
                                } else {
                                    style = { ...style, backgroundColor: '#39FF14', border: 'none', boxShadow: '0 0 4px #39FF14, 0 0 8px #39FF14', animation: 'led-blink 1.2s infinite' };
                                }
                            } else { 
                                if (isPending) {
                                    style = { ...style, backgroundColor: '#FF9800', border: 'none', boxShadow: '0 0 4px #FF9800, 0 0 8px #FF9800' };
                                }
                            }
                            return style;
                        })()}
                      />
                    </Tooltip>
                    {!conv.isWithAI && (
                      <Tooltip title="IA pausada">
                        <IconButton size="small" sx={{ color: "#8b8a8aff", mr: -1.9 }}>
                          <PauseCircleOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <ConversationActions
                      onBlock={() => onBlock(conv.id)}
                      onStatusChange={(newStatus) => onStatusChange(conv.id, newStatus)}
                      blocked={conv.blocked}
                      currentStatus={conv.status}
                    />
                  </Box>
                  <Typography variant="caption" color="secondary" sx={{ fontSize: "9.5px", mt: 0.2 }}>
                    {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true, locale: es })}
                  </Typography>
                </Box>
              </ListItemButton>
            )}
          )}
        </List>
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
};

export default ConversationList;
