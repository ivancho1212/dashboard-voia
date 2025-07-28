import React, { useEffect, useRef, useMemo } from "react";
import PropTypes from "prop-types";
import SoftTypography from "components/SoftTypography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import Chip from "@mui/material/Chip";
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
import CheckIcon from "@mui/icons-material/Check";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BlockIcon from "@mui/icons-material/Block";

const getStatusIcon = (status) => {
  switch (status) {
    case "pendiente":
      return <AccessTimeIcon />;
    case "resuelta":
      return <DoneAllIcon />;
    case "activa":
    default:
      return <CheckIcon />;
  }
};

function ConversationList({
  conversations,
  messagesMap,
  onSelect,
  onStatusChange,
  onBlock,
  highlightedIds = [],
  onClearHighlight = () => { },
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
      .filter((conv) => {
        const hasAnyMessage = conv.lastMessage || (messagesMap[conv.id] || []).length > 0;
        return hasAnyMessage;
      })
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
        const textToSearch = `${conv.alias || ""} ${conv.lastMessage || ""}`;
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
      {/* Encabezado y Filtro */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <SoftTypography variant="h5" color="info.main" fontWeight="bold">
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

      {/* Buscador */}
      <Box mb={2}>
        <TextField
          variant="outlined"
          fullWidth
          size="small"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            sx: {
              borderRadius: 2,
              backgroundColor: "#f8f9fa",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            },
            startAdornment: <InputAdornment position="start">🔍</InputAdornment>,
          }}
        />
      </Box>

      {/* Lista con scroll */}
      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", minHeight: 0, maxWidth: "100%" }}>
        <List sx={{ width: "100%", padding: 0 }}>
          {filtered.map((conv) => (
            <ListItemButton
              key={conv.id}
              onClick={() => {
                onSelect(conv.id);
                onClearHighlight(conv.id);
              }}
              sx={{
                mb: 0.5,
                borderRadius: "8px",
                padding: "12px",
                paddingLeft: "20px",
                backgroundColor: highlightedIds.includes(conv.id) ? "#fff8e1" : "#f5f5f5",
                animation: highlightedIds.includes(conv.id)
                  ? "flash 1s infinite ease-in-out"
                  : "none",
                "&:hover": {
                  backgroundColor: "#d0f0f6",
                },
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                maxWidth: "100%", // 👈 asegura que no exceda el ancho del padre
                overflow: "hidden", // 👈 oculta cualquier contenido que se desborde
                whiteSpace: "nowrap", // 👈 impide que los textos se expandan en múltiples líneas
              }}
            >
              {/* Info principal */}
              <Box sx={{ flex: 1, pr: 1, minWidth: 0, maxWidth: "100%", overflow: "hidden" }}>
                <Typography
                  variant="subtitle2"
                  fontWeight="600"
                  color={conv.blocked ? "error" : "text.primary"}
                  noWrap
                >
                  {conv.alias || `Usuario ${conv.id.slice(-4)}`}
                </Typography>

                <Tooltip
                  title={(() => {
                    const lowerSearch = search.toLowerCase();
                    const matchMessage = (messagesMap[conv.id] || []).find((msg) =>
                      msg.text?.toLowerCase().includes(lowerSearch)
                    );

                    if (!search || !matchMessage) {
                      const messages = messagesMap[conv.id] || [];
                      const last = messages[messages.length - 1];

                      if (!last) return "Sin mensajes aún";

                      if (last?.files?.length > 0) {
                        return `📎 ${last.files.map((f) => f.name || "archivo").join(", ")}`;
                      }

                      if (last?.text) return last.text;

                      return "📎 Archivo adjunto";
                    }

                    return matchMessage.text;
                  })()}
                  arrow
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: "13px",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      minWidth: 0,
                      textOverflow: "ellipsis",
                      maxWidth: "100%",
                      display: "block",
                    }}
                  >
                    {(() => {
                      const lowerSearch = search.toLowerCase();
                      const matchMessage = (messagesMap[conv.id] || []).find((msg) =>
                        msg.text?.toLowerCase().includes(lowerSearch)
                      );

                      if (!search || !matchMessage) {
                        const messages = messagesMap[conv.id] || [];
                        const last = messages[messages.length - 1];

                        if (!last) return "Sin mensajes aún";

                        if (last?.files?.length > 0) {
                          return `📎 ${last.files.map((f) => f.name || "archivo").join(", ")}`;
                        }

                        if (last?.text) return last.text;

                        return "📎 Archivo adjunto";
                      }

                      const index = matchMessage.text.toLowerCase().indexOf(lowerSearch);
                      const start = Math.max(index - 20, 0);
                      const end = Math.min(
                        index + lowerSearch.length + 20,
                        matchMessage.text.length
                      );
                      const fragment = matchMessage.text.slice(start, end);

                      const before = fragment.slice(0, index - start);
                      const match = fragment.slice(
                        index - start,
                        index - start + lowerSearch.length
                      );
                      const after = fragment.slice(index - start + lowerSearch.length);

                      return (
                        <>
                          ...{before}
                          <strong style={{ backgroundColor: "#ffff00" }}>{match}</strong>
                          {after}...
                        </>
                      );
                    })()}
                  </Typography>
                </Tooltip>
              </Box>

              <Box
                display="flex"
                flexDirection="column"
                alignItems="flex-end"
                justifyContent="center"
                sx={{ flexShrink: 0, maxWidth: "30%" }}
              >
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Tooltip title={`Estado: ${conv.status}`}>
                    <Chip
                      icon={getStatusIcon(conv.status)}
                      color="default"
                      size="small"
                      sx={{
                        height: 18,
                        width: 18,
                        minWidth: 0,
                        borderRadius: "50%",
                        backgroundColor:
                          conv.status === "pendiente"
                            ? "#ff9800"
                            : conv.status === "resuelta"
                              ? "#4caf50"
                              : "#29b6f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        "& .MuiChip-icon": {
                          color: "#fff !important",
                          fontSize: "12px !important",
                          margin: 0,
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        },
                        "& .MuiChip-label": {
                          display: "none",
                        },
                      }}
                    />
                  </Tooltip>
                  {!conv.isWithAI && conv.unreadCount > 0 && conv.id !== activeTab && (
                    <Chip
                      label={conv.unreadCount}
                      size="small"
                      color="error"
                      sx={{
                        height: 18,
                        width: 18,
                        minWidth: 0,
                        borderRadius: "50%",
                        fontSize: "11px",
                        fontWeight: "bold",
                        backgroundColor: "#ff7043",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        "& .MuiChip-icon": {
                          display: "none",
                        },
                        "& .MuiChip-label": {
                          padding: 0,
                          margin: 0,
                          lineHeight: 1,
                          width: "100%",
                          textAlign: "center",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        },
                      }}
                    />
                  )}

                  {!conv.isWithAI && (
                    <Tooltip title="IA pausada">
                      <Chip
                        label="IA pausada"
                        size="small"
                        sx={{
                          backgroundColor: "#9e9e9e",
                          color: "#fff",
                          fontSize: "10px",
                          height: 18,
                          borderRadius: "8px",
                        }}
                      />
                    </Tooltip>
                  )}

                  <ConversationActions
                    onBlock={() => onBlock(conv.id)}
                    onStatusChange={(newStatus) => onStatusChange(conv.id, newStatus)}
                    blocked={conv.blocked}
                    currentStatus={conv.status}
                  />
                </Box>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "9.5px", mt: 0.2 }}
                >
                  {formatDistanceToNow(new Date(conv.updatedAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </Typography>
              </Box>
            </ListItemButton>
          ))}
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
    })
  ).isRequired,
  messagesMap: PropTypes.objectOf(
    PropTypes.arrayOf(
      PropTypes.shape({
        text: PropTypes.string.isRequired,
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
};

export default ConversationList;
