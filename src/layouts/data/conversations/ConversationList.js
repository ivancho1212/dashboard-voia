import React, { useState } from "react";
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
import InputAdornment from "@mui/material/InputAdornment";
import FilterListIcon from "@mui/icons-material/FilterList";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import ConversationActions from "./ConversationActions";

function ConversationList({ conversations, onSelect, onStatusChange, onBlock }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const handleOpenMenu = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);
  const handleFilterChange = (value) => {
    setFilter(value);
    handleCloseMenu();
  };

  const filtered = conversations
    .filter((conv) => {
      if (filter === "active") return conv.status === "activa";
      if (filter === "closed") return conv.status === "cerrada";
      if (filter === "pending") return conv.status === "pendiente";
      if (filter === "resolved") return conv.status === "resuelta";
      if (filter === "blocked") return conv.blocked === true;
      return true;
    })

    .filter((conv) =>
      `${conv.alias || ""} ${conv.lastMessage || ""}`.toLowerCase().includes(search.toLowerCase())
    );

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
      <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        <List sx={{ width: "100%", padding: 0 }}>
          {filtered.map((conv) => (
            <ListItemButton
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              sx={{
                mb: 0.5,
                borderRadius: "8px",
                padding: "10px 12px",
                backgroundColor: "#f5f5f5",
                "&:hover": {
                  backgroundColor: "#d0f0f6",
                },
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              {/* Info principal */}
              <Box sx={{ flex: 1, pr: 1 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight="600"
                  color={conv.blocked ? "error" : "text.primary"}
                  noWrap
                >
                  {conv.alias || `Usuario ${conv.id.slice(-4)}`}
                </Typography>

                <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: "13px" }}>
                  {conv.lastMessage}
                </Typography>
              </Box>

              {/* Estado + tiempo + acciones */}
              <Box
                minWidth="105px"
                display="flex"
                flexDirection="column"
                alignItems="flex-end"
                justifyContent="center"
                gap={0.5}
              >
                <Chip
                  label={conv.status.toUpperCase()}
                  color={
                    conv.status === "pendiente"
                      ? "warning"
                      : conv.status === "resuelta"
                      ? "success"
                      : conv.status === "cerrada"
                      ? "default"
                      : "info"
                  }
                  size="small"
                  sx={{
                    fontSize: "11px",
                    height: "22px",
                    fontWeight: "bold",
                    "& .MuiChip-label": {
                      color: "white !important",
                    },
                  }}
                />

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "11px", textAlign: "right" }}
                >
                  {formatDistanceToNow(new Date(conv.updatedAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </Typography>

                <ConversationActions
                  onBlock={() => onBlock(conv.id)}
                  onStatusChange={(newStatus) => onStatusChange(conv.id, newStatus)}
                  blocked={conv.blocked}
                  currentStatus={conv.status}
                />
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
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onBlock: PropTypes.func.isRequired,
};

export default ConversationList;
