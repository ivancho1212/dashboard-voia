import React, { useEffect, useState, useCallback } from "react";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import { Card, IconButton, Tooltip, Switch, FormControlLabel, CircularProgress, Chip } from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import axios from "axios";

const API_URL = "http://localhost:5006/api";

function PlanSuscriptionTable() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await axios.get(`${API_URL}/subscriptions`, { withCredentials: true });
      setSubscriptions(Array.isArray(resp.data) ? resp.data : []);
    } catch (e) {
      console.error("Error cargando suscripciones:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubscriptions(); }, [fetchSubscriptions]);

  const handleToggleWidgetBlocked = async (sub) => {
    setTogglingId(sub.id);
    try {
      await axios.put(`${API_URL}/subscriptions/${sub.id}`, { widgetBlocked: !sub.widgetBlocked }, { withCredentials: true });
      setSubscriptions(prev => prev.map(s => s.id === sub.id ? { ...s, widgetBlocked: !s.widgetBlocked } : s));
    } catch (e) {
      console.error("Error actualizando widgetBlocked:", e);
    } finally {
      setTogglingId(null);
    }
  };

  const statusLabel = (status) => {
    switch (status) {
      case "active": return <Chip label="Activa" color="success" size="small" />;
      case "canceled": return <Chip label="Cancelada" color="error" size="small" />;
      case "expired": return <Chip label="Expirada" color="warning" size="small" />;
      default: return <Chip label={status || "—"} size="small" />;
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("es-ES") : "—";

  if (loading) {
    return <SoftBox display="flex" justifyContent="center" p={4}><CircularProgress /></SoftBox>;
  }

  return (
    <Card sx={{ p: 2, overflowX: "auto" }}>
      <SoftTypography variant="h6" fontWeight="bold" mb={2}>
        Suscripciones de Usuarios
      </SoftTypography>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
        <thead>
          <tr>
            {["ID", "Usuario", "Email", "Plan", "Estado", "Inicio", "Vence", "Widget Bloqueado"].map(t => (
              <th key={t} style={thStyle}>{t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {subscriptions.length === 0 && (
            <tr><td colSpan={8} style={{ ...tdStyle, textAlign: "center", color: "#999" }}>Sin suscripciones</td></tr>
          )}
          {subscriptions.map(sub => (
            <tr key={sub.id} style={{ background: sub.widgetBlocked ? "#fff3f3" : "transparent" }}>
              <td style={tdStyle}>{sub.id}</td>
              <td style={tdStyle}>{sub.userName || "—"}</td>
              <td style={tdStyle}>{sub.userEmail || "—"}</td>
              <td style={tdStyle}>{sub.planName || "—"}</td>
              <td style={tdStyle}>{statusLabel(sub.status)}</td>
              <td style={tdStyle}>{formatDate(sub.startedAt)}</td>
              <td style={{ ...tdStyle, color: sub.expiresAt && new Date(sub.expiresAt) < new Date() ? "#d32f2f" : "inherit" }}>
                {formatDate(sub.expiresAt)}
              </td>
              <td style={tdStyle}>
                <Tooltip title={sub.widgetBlocked ? "Widget bloqueado — clic para desbloquear" : "Widget activo — clic para bloquear"}>
                  <span>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!sub.widgetBlocked}
                          onChange={() => handleToggleWidgetBlocked(sub)}
                          disabled={togglingId === sub.id}
                          color="error"
                          size="small"
                        />
                      }
                      label={
                        togglingId === sub.id
                          ? <CircularProgress size={12} />
                          : sub.widgetBlocked
                            ? <span style={{ color: "#d32f2f", fontWeight: 600 }}>Bloqueado</span>
                            : <span style={{ color: "#388e3c" }}>Activo</span>
                      }
                    />
                  </span>
                </Tooltip>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

const thStyle = {
  padding: "8px 6px",
  borderBottom: "2px solid #ccc",
  textAlign: "left",
  backgroundColor: "#f5f5f5",
  whiteSpace: "nowrap",
  fontWeight: 600,
};

const tdStyle = {
  padding: "7px 6px",
  borderBottom: "1px solid #eee",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};

export default PlanSuscriptionTable;
