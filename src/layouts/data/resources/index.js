import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { getCapturedFields } from "services/botCapturedFieldsService";
import { getBotById } from "services/botService";
import { getBotsByUserId } from "services/botService";
import {
  getCapturedSubmissionsByBot,
  getPublicCapturedSubmissionsByBot,
  getCapturedSubmissionsRaw,
} from "services/botDataSubmissionsService";
import { styled } from "@mui/material/styles";
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { exportCapturedSubmissions } from "services/botDataSubmissionsService";

// Layout y componentes de UI
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import { useAuth } from "contexts/AuthContext";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import Card from "@mui/material/Card";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from '@mui/material/IconButton';
import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";

// Se podrían mover a un archivo compartido si se usan en más sitios
const FixedCell = styled(TableCell)(({ theme, width }) => ({
  width: width || "auto",
  textAlign: "center",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  padding: theme.spacing(1),
  backgroundColor: "#f0f0f0",
  fontWeight: "bold",
}));

const BodyCell = styled(TableCell)(({ theme, width }) => ({
  width: width || "auto",
  textAlign: "center",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  padding: theme.spacing(1),
}));

function ViewCapturedData() {
  const [fields, setFields] = useState([]);
  const [capturedData, setCapturedData] = useState([]);
  // serverGroupedSessions will hold authoritative grouped session data when fetched from server
  const [serverGroupedSessions, setServerGroupedSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useApi, setUseApi] = useState(false);
  // Siempre mostramos filas crudas por diseño (cada registro por fila)
  const rawView = true;
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSessionId, setFilterSessionId] = useState("");
  const [filterIntent, setFilterIntent] = useState("");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");
  const [botsList, setBotsList] = useState([]);
  const [selectedBotFilter, setSelectedBotFilter] = useState("");
  const { id } = useParams(); // Asumiendo que el ID del bot viene de la URL
  const { user } = useAuth();

  // Permisos: determinar si el usuario puede ver el endpoint público
  const canSeePublicEndpoint = (() => {
    if (!user) return false;

    // If there's a flat permissions array on the user (some endpoints provide this), check it first
    if (Array.isArray(user.permissions) && user.permissions.length > 0) {
      const up = user.permissions.map(p => (p || '').toString());
      const allowedFlat = new Set(['recursos', 'datos_captados_bot', 'Datos Captados del Bot', 'CanViewBotDataCaptureFields', 'CanExportData', 'CanViewBots']);
      if (up.some(p => allowedFlat.has(p))) return true;
    }

    // Role permissions may come in different shapes: { permission: { key/Name/name } }, { permissionName }, etc.
    const rps = user.role?.rolePermissions || user.rolePermissions || [];
    if (!Array.isArray(rps)) return false;

    const allowed = new Set(['recursos', 'datos_captados_bot', 'Datos Captados del Bot', 'CanViewBotDataCaptureFields', 'CanExportData', 'CanViewBots']);

    for (const rp of rps) {
      if (!rp) continue;
      // possible places where the permission identifier/name may live
      const candidates = [];
      if (rp.permissionName) candidates.push(rp.permissionName);
      if (rp.permissionKey) candidates.push(rp.permissionKey);
      if (rp.permission && typeof rp.permission === 'object') {
        candidates.push(rp.permission.key || rp.permission.Key || rp.permission.name || rp.permission.Name || rp.permission.title);
      }
      // also accept direct Permission or PermissionId shapes
      if (rp.Permission && typeof rp.Permission === 'object') {
        candidates.push(rp.Permission.key || rp.Permission.Key || rp.Permission.name || rp.Permission.Name || rp.Permission.title);
      }
      // push any plain-string properties
      Object.values(rp).forEach(v => { if (typeof v === 'string') candidates.push(v); });

      for (const c of candidates) {
        if (!c) continue;
        if (allowed.has(c.toString())) return true;
      }
    }

    return false;
  })();

  // sincronizar selector si la ruta contiene id
  useEffect(() => {
    if (id) setSelectedBotFilter(String(id));
  }, [id]);

  // modo de despliegue: 'session' = agrupar por sesión (expandible), 'raw' = filas crudas
  const [displayMode, setDisplayMode] = useState('session');

  // Si cambia el bot seleccionado, traer sus campos para el encabezado y para pivot
  useEffect(() => {
    const loadFields = async () => {
      const bid = selectedBotFilter || id;
      if (!bid) return;
      try {
        const resp = await getCapturedFields(bid);
        setFields(resp.data || []);
      } catch (err) {
        console.warn('No se pudieron obtener campos para bot', bid, err);
      }
    };
    loadFields();
  }, [selectedBotFilter, id]);

  // Función para pivotar los datos a un formato de fila por entrada (vista agrupada)
  const pivotData = (data) => {
    const rows = [];
    data.forEach((item) => {
      const row = {
        // Preserve bot metadata when present
        botId: item.botId,
        botName: item.botName,
        sessionId: item.sessionId,
        userId: item.userId,
        createdAt: item.createdAt,
        conversationId: item.conversationId,
        captureIntent: item.captureIntent
      };
      fields.forEach(field => {
        row[field.fieldName] = item.values?.[field.fieldName]?.join(', ') || "N/A";
      });
      rows.push(row);
    });
    return rows;
  };

  // Obtener campos y datos capturados
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Determinar qué bots consultar: ruta id > selectedBotFilter > todos los bots del usuario
        let botIds = [];
        if (id) {
          botIds = [Number(id)];
        } else if (selectedBotFilter) {
          botIds = [Number(selectedBotFilter)];
        } else {
          if (!user || !user.id) {
            setCapturedData([]);
            setFields([]);
            setLoading(false);
            return;
          }
          const bots = await getBotsByUserId(user.id);
          setBotsList(bots || []);
          botIds = (bots || []).map(b => b.id);
        }

        if (!botIds || botIds.length === 0) {
          setCapturedData([]);
          setFields([]);
          setLoading(false);
          return;
        }

        // Obtener campos del primer bot para los títulos (si aplica)
        try {
          const fieldsResponse = await getCapturedFields(botIds[0]);
          setFields(fieldsResponse.data);
        } catch (err) {
          console.warn('No se pudieron obtener los campos del primer bot', err);
        }

        // If we are focusing on a single bot and displayMode === 'session', prefer server-side grouped sessions
        if ((id || selectedBotFilter) && displayMode === 'session' && !useApi) {
          const bid = Number(id || selectedBotFilter);
          try {
            const resp = await getCapturedSubmissionsByBot(bid);
            // resp.data is expected to be an array of grouped sessions with shape { sessionId, userId, values, createdAt, conversationId, captureIntent }
            const groups = (resp.data || []).map(g => ({ ...g, botId: bid }));
            setServerGroupedSessions(groups);
            // Also set capturedData to a flattened representation (so raw view still works)
            const flat = [];
            groups.forEach(g => {
              Object.keys(g.values || {}).forEach(fn => {
                const vals = g.values[fn] || [];
                flat.push({ botId: bid, botName: null, sessionId: g.sessionId, userId: g.userId, fieldName: fn, value: Array.isArray(vals) ? vals.join(' | ') : vals, conversationId: g.conversationId, captureIntent: g.captureIntent, createdAt: g.createdAt });
              });
            });
            setCapturedData(flat);
            setLoading(false);
            return;
          } catch (err) {
            console.warn('Error fetching grouped sessions from server for bot', bid, err);
            // fallback to client-side approach below
          }
        }

        // For each bot, fetch raw submissions (or public grouped) and flatten
        const results = await Promise.all(botIds.map(async (bid) => {
          try {
            if (useApi) {
              return (await getPublicCapturedSubmissionsByBot(bid)).data.map(d => ({ ...d, botId: bid }));
            }
            return (await getCapturedSubmissionsRaw(bid)).data.map(d => ({ ...d, botId: bid }));
          } catch (err) {
            console.warn('Error fetching bot data', bid, err);
            return [];
          }
        }));

        // Flatten and attach botName
        const flat = [];
        const botsLookup = {};
        try {
          const bots = await getBotsByUserId(user?.id);
          (bots || []).forEach(b => botsLookup[b.id] = b);
        } catch (err) { /* ignore */ }
        results.forEach(arr => (arr || []).forEach(item => flat.push({ ...item, botName: botsLookup[item.botId]?.name || null })));

        setCapturedData(flat);
        setLoading(false);
        return;

        // Si no hay id, cargar todos los bots del usuario y concatenar sus capturas
        if (!user || !user.id) {
          setCapturedData([]);
          setFields([]);
          setLoading(false);
          return;
        }

        const bots = await getBotsByUserId(user.id);
        if (!Array.isArray(bots) || bots.length === 0) {
          setCapturedData([]);
          setFields([]);
          setLoading(false);
          return;
        }

        // Para simplificar, usaremos los campos del primer bot (si quieres mergear campos, lo podemos mejorar)
        const firstBotId = bots[0].id;
        try {
          const fieldsResponse = await getCapturedFields(firstBotId);
          setFields(fieldsResponse.data);
        } catch (err) {
          console.warn('No se pudieron obtener los campos del primer bot', err);
        }

        // Obtener capturas de todos los bots en paralelo
        const submissionsArrays = await Promise.all(
          bots.map((b) => (useApi ? getPublicCapturedSubmissionsByBot(b.id) : getCapturedSubmissionsByBot(b.id)))
        );

        // Flatten y añadir metadata del bot
        const allData = [];
        submissionsArrays.forEach((res, idx) => {
          const bot = bots[idx];
          const entries = res?.data || [];
          entries.forEach((e) => allData.push({ ...e, botId: bot.id, botName: bot.name }));
        });

        setCapturedData(allData);
      } catch (error) {
        console.error("Error al obtener datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [id, useApi, user, rawView]);

  // Filtrar datos por término de búsqueda
  const pivotedData = pivotData(capturedData);
  const filteredData = pivotedData.filter((row) =>
    Object.values(row).some((val) =>
      val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Aplicar filtros adicionales (sessionId, intent, date range)
  const filteredWithExtras = filteredData.filter(row => {
    if (filterSessionId && !((row.sessionId || "").toString().includes(filterSessionId))) return false;
    if (filterIntent && !((row.captureIntent || "").toString().toLowerCase().includes(filterIntent.toLowerCase()))) return false;
    if (filterFromDate) {
      const from = new Date(filterFromDate);
      if (!row.createdAt || new Date(row.createdAt) < from) return false;
    }
    if (filterToDate) {
      const to = new Date(filterToDate);
      if (!row.createdAt || new Date(row.createdAt) > to) return false;
    }
    return true;
  });

  // Construir filas crudas a partir de capturedData para la vista "raw"
  const rawRows = [];
  (capturedData || []).forEach((item) => {
    // Si el item ya viene crudo (campo/value) — endpoint público
    if (item.fieldName || item.value) {
      rawRows.push({
        botId: item.botId,
        botName: item.botName,
        sessionId: item.sessionId,
        userId: item.userId,
        fieldName: item.fieldName || item.Field || (item.captureFieldId ? (fields.find(f => f.id === item.captureFieldId)?.fieldName) : null),
        value: item.value || item.Value,
        conversationId: item.conversationId,
        captureIntent: item.captureIntent,
        createdAt: item.createdAt,
      });
      return;
    }

    // Si el item está agrupado con objeto values: convertir cada campo en una fila
    if (item.values && typeof item.values === 'object') {
      Object.keys(item.values).forEach((fn) => {
        const vals = item.values[fn] || [];
        rawRows.push({
          botId: item.botId,
          botName: item.botName,
          sessionId: item.sessionId,
          userId: item.userId,
          fieldName: fn,
          value: Array.isArray(vals) ? vals.join(' | ') : vals,
          conversationId: item.conversationId,
          captureIntent: item.captureIntent,
          createdAt: item.createdAt,
        });
      });
      return;
    }
  });

  // Filtrar rawRows por search + sesión + intención + rango de fechas
  const rawRowsFiltered = rawRows.filter((row) => {
    if (searchTerm) {
      const hit = [row.botName, row.sessionId, row.userId, row.fieldName, row.value, row.captureIntent, row.conversationId]
        .some(v => v && v.toString().toLowerCase().includes(searchTerm.toLowerCase()));
      if (!hit) return false;
    }
    if (filterSessionId && !((row.sessionId || "").toString().includes(filterSessionId))) return false;
    if (filterIntent && !((row.captureIntent || "").toString().toLowerCase().includes(filterIntent.toLowerCase()))) return false;
    if (filterFromDate) {
      const from = new Date(filterFromDate);
      if (!row.createdAt || new Date(row.createdAt) < from) return false;
    }
    if (filterToDate) {
      const to = new Date(filterToDate);
      if (!row.createdAt || new Date(row.createdAt) > to) return false;
    }
    return true;
  });

  // Agrupar por sessionId + userId para la vista expandible
  // Si el servidor ya nos devolvió grupos (single-bot + session mode), usarlos directamente
  const groupedSessions = (serverGroupedSessions && serverGroupedSessions.length > 0) ? serverGroupedSessions : (() => {
    const map = new Map();
    rawRowsFiltered.forEach(r => {
      const key = `${r.sessionId || '_nosession'}::${r.userId || '_nouser'}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          sessionId: r.sessionId,
          userId: r.userId,
          botId: r.botId,
          botName: r.botName,
          conversationId: r.conversationId,
          captureIntent: r.captureIntent,
          createdAt: r.createdAt,
          values: {},
        });
      }
      const g = map.get(key);
      // actualizar fecha al máximo
      if (r.createdAt && (!g.createdAt || new Date(r.createdAt) > new Date(g.createdAt))) g.createdAt = r.createdAt;
      if (r.captureIntent && !g.captureIntent) g.captureIntent = r.captureIntent;
      if (r.conversationId && !g.conversationId) g.conversationId = r.conversationId;
      const fn = r.fieldName || r.Field || 'value';
      const val = r.value ?? r.Value ?? r.submissionValue ?? r.SubmissionValue ?? '';
      if (!g.values[fn]) g.values[fn] = [];
      if (val !== null && val !== undefined && String(val).trim() !== '') g.values[fn].push(val);
    });
    return Array.from(map.values()).sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  })();

  const [expandedMap, setExpandedMap] = useState({});
  const toggleExpanded = (key) => {
    setExpandedMap(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Exportar a Excel
  const handleExportExcel = () => {
    // Si hay un bot seleccionado (id en ruta), preferimos pedir al servidor el CSV exportado
    if (id) {
      // Parámetros con filtros
      const params = {
        botId: id,
        sessionId: filterSessionId || undefined,
        intent: filterIntent || undefined,
        from: filterFromDate ? new Date(filterFromDate).toISOString() : undefined,
        to: filterToDate ? new Date(filterToDate).toISOString() : undefined,
      };

      exportCapturedSubmissions(params, { format: 'xlsx' })
        .then((res) => {
          const disposition = res.headers['content-disposition'] || '';
          let fileName = `captura_bot_${id}.csv`;
          const matches = /filename="?(.*?)"?(;|$)/i.exec(disposition);
          if (matches && matches[1]) fileName = matches[1];
          const url = window.URL.createObjectURL(new Blob([res.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', fileName);
          document.body.appendChild(link);
          link.click();
          link.parentNode.removeChild(link);
        })
        .catch((err) => {
          console.error('Error exportando desde servidor', err);
          // Fallback al export local
          doLocalExcelExport();
        });
      return;
    }

    // Si no hay bot seleccionado, hacemos export cliente (XLSX)
    doLocalExcelExport();
  };

  const doLocalExcelExport = () => {
    let exportData = [];
    if (rawView) {
      exportData = rawRowsFiltered.map(r => ({
        'Bot': r.botName || r.botId || '',
        'Usuario/Sesión': r.sessionId || r.userId || 'N/A',
        'Campo': r.fieldName || '',
        'Valor': r.value || '',
        'Conversación': r.conversationId ? `${window.location.origin}/data/conversations?id=${r.conversationId}` : '',
        'Intención': r.captureIntent || '',
        'Fecha': r.createdAt ? new Date(r.createdAt).toLocaleString() : 'N/A'
      }));
    } else {
      // If we have authoritative server-side grouped sessions for single bot, use them
      if (serverGroupedSessions && serverGroupedSessions.length > 0) {
        exportData = serverGroupedSessions.map(g => {
          const record = { 'Usuario/Sesión': g.sessionId || g.userId || 'N/A' };
          Object.keys(g.values || {}).forEach(fn => { record[fn] = Array.isArray(g.values[fn]) ? g.values[fn].join(' | ') : g.values[fn]; });
          record['Conversación'] = g.conversationId ? `${window.location.origin}/data/conversations?id=${g.conversationId}` : '';
          record['Intención'] = g.captureIntent || '';
          record['Fecha'] = g.createdAt ? new Date(g.createdAt).toLocaleString() : 'N/A';
          return record;
        });
      } else {
        exportData = filteredWithExtras.map((row) => {
        const record = { 'Usuario/Sesión': row.sessionId || row.userId || 'N/A' };
        fields.forEach(field => {
          record[field.fieldName] = row[field.fieldName];
        });
        // Incluir enlace a la conversación si existe
        record['Conversación'] = row.conversationId ? `${window.location.origin}/data/conversations?id=${row.conversationId}` : '';
        record['Intención'] = row.captureIntent || '';
        record['Fecha'] = row.createdAt ? new Date(row.createdAt).toLocaleString() : 'N/A';
        return record;
        });
      }
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos Capturados");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `captura_bot_${id || 'all'}.xlsx`);
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox pt={1} pb={3} px={2}>
        <SoftBox display="flex" alignItems="center" mb={3} bgcolor="#f9f9f9" p={2} borderRadius="lg">
          {canSeePublicEndpoint ? (
            <>
              <Switch checked={useApi} onChange={() => setUseApi(!useApi)} />
              <SoftTypography variant="button" ml={1}>
                {useApi ? "Visualización vía API pública" : "Visualización de datos internos"}
              </SoftTypography>
              {useApi && !(user && user.plan && user.plan.allowPublicDataEndpoint) && !canSeePublicEndpoint && (
                <SoftTypography variant="caption" color="error" ml={2}>
                  Nota: tu plan actual no permite acceder al endpoint público. Contacta soporte o actualiza tu plan.
                </SoftTypography>
              )}
            </>
          ) : (
            <SoftTypography variant="button" ml={1}>
              Visualización de datos internos
            </SoftTypography>
          )}
        </SoftBox>

        <Card sx={{ p: 3, borderRadius: "xl", boxShadow: "lg" }}>
          <SoftTypography variant="h5" fontWeight="bold" gutterBottom>
            {useApi ? "Endpoint público para obtener datos" : "Datos captados por el bot"}
          </SoftTypography>
          <SoftTypography variant="body2" color="text" sx={{ mb: 2 }}>
            {useApi
              ? "Usa este endpoint para acceder a los datos capturados desde tu sistema externo:"
              : "Estos son los datos recolectados por el bot."}
          </SoftTypography>

          {useApi ? (
            <SoftBox display="flex" alignItems="center" justifyContent="space-between" bgcolor="#f5f5f5" p={2} borderRadius="lg">
              { (id || selectedBotFilter) ? (
                <>
                  <SoftTypography variant="caption" color="text">
                    {`http://localhost:5006/api/BotDataSubmissions/public/by-bot/${id || selectedBotFilter}`}
                  </SoftTypography>
                  <Tooltip title="Copiar URL">
                    <SoftButton color="info" onClick={() => navigator.clipboard.writeText(`http://localhost:5006/api/BotDataSubmissions/public/by-bot/${id || selectedBotFilter}`)}>
                      <Icon>content_copy</Icon>
                    </SoftButton>
                  </Tooltip>
                </>
              ) : canSeePublicEndpoint && user && user.id ? (
                // Mostrar endpoint que devuelve todos los datos de los bots asociados al usuario
                <>
                  <SoftTypography variant="caption" color="text">
                    {`http://localhost:5006/api/BotDataSubmissions/public/by-user/${user.id}`}
                  </SoftTypography>
                  <Tooltip title="Copiar URL">
                    <SoftButton color="info" onClick={() => navigator.clipboard.writeText(`http://localhost:5006/api/BotDataSubmissions/public/by-user/${user.id}`)}>
                      <Icon>content_copy</Icon>
                    </SoftButton>
                  </Tooltip>
                </>
              ) : (
                <SoftTypography variant="caption" color="text">Selecciona un bot para generar el endpoint público.</SoftTypography>
              )}
            </SoftBox>
          ) : (
            <>
              <SoftInput
                placeholder="Buscar en los datos captados..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
              />
              <SoftBox display="flex" gap={2} sx={{ mb: 2, alignItems: 'center' }}>
                <SoftTypography variant="caption">Filtrar por Bot</SoftTypography>
                <Select
                  value={selectedBotFilter || ''}
                  onChange={(e) => { setSelectedBotFilter(e.target.value); }}
                  displayEmpty
                  sx={{ minWidth: 220 }}
                >
                  <MenuItem value="">Todos los bots</MenuItem>
                  {botsList.map(b => (
                    <MenuItem key={b.id} value={b.id}>{b.name || `Bot ${b.id}`}</MenuItem>
                  ))}
                </Select>
                <SoftTypography variant="caption">Modo</SoftTypography>
                <Select value={displayMode} onChange={(e) => setDisplayMode(e.target.value)} sx={{ minWidth: 180 }}>
                  <MenuItem value="session">Agrupar por sesión (expandible)</MenuItem>
                  <MenuItem value="raw">Ver crudo (filas)</MenuItem>
                </Select>
              </SoftBox>
              <SoftBox display="flex" gap={2} sx={{ mb: 2 }}>
                <SoftInput placeholder="Filtrar por Sesión" value={filterSessionId} onChange={(e) => setFilterSessionId(e.target.value)} />
                <SoftInput placeholder="Filtrar por Intención" value={filterIntent} onChange={(e) => setFilterIntent(e.target.value)} />
                <SoftInput type="date" placeholder="Desde" value={filterFromDate} onChange={(e) => setFilterFromDate(e.target.value)} />
                <SoftInput type="date" placeholder="Hasta" value={filterToDate} onChange={(e) => setFilterToDate(e.target.value)} />
              </SoftBox>
              <SoftBox sx={{ overflowX: "auto" }}>
                <Table size="small" sx={{ tableLayout: "fixed" }}>
                  <TableHead>
                      <TableRow>{[
                        <FixedCell key="h-bot">{!id ? 'Bot' : ''}</FixedCell>,
                        <FixedCell key="h-exp" />, /* expand icon col */
                        <FixedCell key="h-session">Usuario/Sesión</FixedCell>,
                        <FixedCell key="h-summary">Resumen</FixedCell>,
                        <FixedCell key="h-conv">Conversación</FixedCell>,
                        <FixedCell key="h-intent">Intención</FixedCell>,
                        <FixedCell key="h-date">Fecha</FixedCell>
                      ]}</TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={10}>Cargando...</TableCell></TableRow>
                      ) : displayMode === 'raw' ? (
                        // Mostrar filas crudas
                        (rawRowsFiltered || []).map((r, idx) => (
                          <TableRow key={r.id || `raw-${idx}`}>{[
                            <BodyCell key={`raw-${idx}-bot`}>{!id ? (r.botName || r.botId || '-') : ''}</BodyCell>,
                            <BodyCell key={`raw-${idx}-exp`} />,
                            <BodyCell key={`raw-${idx}-session`}>{r.sessionId || r.userId || '-'}</BodyCell>,
                            <BodyCell key={`raw-${idx}-summary`}><strong>{r.fieldName || r.Field || 'value'}:</strong> {r.value || r.Value || r.submissionValue || r.SubmissionValue || '-'}</BodyCell>,
                            <BodyCell key={`raw-${idx}-conv`}>{r.conversationId ? (<Link to={`/data/conversations?id=${r.conversationId}`} style={{ textDecoration: 'none' }}>{`Ver conversación ${r.conversationId}`}</Link>) : '-'}</BodyCell>,
                            <BodyCell key={`raw-${idx}-intent`}>{r.captureIntent || '-'}</BodyCell>,
                            <BodyCell key={`raw-${idx}-date`}>{r.createdAt ? new Date(r.createdAt).toLocaleString() : 'N/A'}</BodyCell>
                          ]}</TableRow>
                        ))
                      ) : (
                        // Mostrar grupos por sesión: fila resumen + fila expandida con detalles
                        groupedSessions.map((g, idx) => (
                          <React.Fragment key={`frag-${g.key || idx}`}>
                            <TableRow key={`grp-${g.key || idx}`}>{[
                              <BodyCell key={`grp-${g.key || idx}-bot`}>{!id ? (g.botName || g.botId || '-') : ''}</BodyCell>,
                              <BodyCell key={`grp-${g.key || idx}-exp`}><IconButton size="small" onClick={() => toggleExpanded(g.key)}>{expandedMap[g.key] ? <Icon>expand_less</Icon> : <Icon>expand_more</Icon>}</IconButton></BodyCell>,
                              <BodyCell key={`grp-${g.key || idx}-session`}>{g.sessionId || g.userId || '-'}</BodyCell>,
                              <BodyCell key={`grp-${g.key || idx}-summary`}>{Object.keys(g.values || {}).map(fn => (<div key={fn}><strong>{fn}:</strong> {(g.values[fn] || []).join(' | ')}</div>))}</BodyCell>,
                              <BodyCell key={`grp-${g.key || idx}-conv`}>{g.conversationId ? (<Link to={`/data/conversations?id=${g.conversationId}`} style={{ textDecoration: 'none' }}>{`Ver conversación ${g.conversationId}`}</Link>) : '-'}</BodyCell>,
                              <BodyCell key={`grp-${g.key || idx}-intent`}>{g.captureIntent || '-'}</BodyCell>,
                              <BodyCell key={`grp-${g.key || idx}-date`}>{g.createdAt ? new Date(g.createdAt).toLocaleString() : 'N/A'}</BodyCell>
                            ]}</TableRow>

                            {expandedMap[g.key] && (
                              <TableRow key={`detail-${g.key || idx}`}>
                                <TableCell colSpan={7} sx={{ backgroundColor: '#fafafa' }}>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <FixedCell>Campo</FixedCell>
                                        <FixedCell>Valor(es)</FixedCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {Object.keys(g.values || {}).map(fn => (
                                        <TableRow key={`fv-${g.key || idx}-${fn}`}>{[
                                          <BodyCell key={`fv-${g.key || idx}-${fn}-n`}>{fn}</BodyCell>,
                                          <BodyCell key={`fv-${g.key || idx}-${fn}-v`}>{(g.values[fn] || []).join(' | ')}</BodyCell>
                                        ]}</TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </TableBody>
                </Table>
              </SoftBox>
              <SoftBox mt={4} display="flex" justifyContent="flex-end">
                <SoftButton color="info" onClick={handleExportExcel} disabled={loading}>
                  <Icon sx={{ mr: 1 }}>download</Icon>
                  Exportar Excel
                </SoftButton>
              </SoftBox>
            </>
          )}
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default ViewCapturedData;
