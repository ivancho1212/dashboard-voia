import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  getCapturedFields,
  createCapturedField,
  updateCapturedField,
} from "services/botCapturedFieldsService";
import {
  getCapturedSubmissionsByBot,
  getPublicCapturedSubmissionsByBot, // ✅ asegúrate de incluir esto
} from "services/botDataSubmissionsService";
import { styled } from "@mui/material/styles"; // 👈 ya está bien
import { useNavigate } from "react-router-dom";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";

// ✅ Usa props dinámicas para el ancho
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

function CapturedData() {
  const [fields, setFields] = useState([]);
  const [newField, setNewField] = useState("");
  const [capturedData, setCapturedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useApi, setUseApi] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // 🔍 búsqueda
  const { id } = useParams(); // botId
  const totalColumns = fields.length + 1;
  const columnWidth = `${100 / totalColumns}%`;
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate(`/bots/style/${id}`);
  };

  // 👉 Obtener campos configurados para el bot
  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await getCapturedFields(id);
        setFields(response.data);
      } catch (error) {
        console.error("Error al cargar campos:", error);
      }
    };

    fetchFields();
  }, [id]);

  // 👉 Obtener datos captados por el bot
  useEffect(() => {
    const fetchCapturedData = async () => {
      try {
        const response = useApi
          ? await getPublicCapturedSubmissionsByBot(id)
          : await getCapturedSubmissionsByBot(id);

        setCapturedData(response.data);
      } catch (error) {
        console.error("Error al obtener datos captados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCapturedData();
  }, [id, useApi]); // asegúrate de incluir useApi en las dependencias

  // 🔍 Filtrar datos por texto
  const filteredData = capturedData.filter((item) =>
    Object.values(item.values || {}).some((val) =>
      val?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // ➕ Agregar nuevo campo
  const handleAddField = async () => {
    const fieldName = newField.trim();
    if (!fieldName || fields.some((f) => f.fieldName === fieldName)) return;

    try {
      const newFieldObj = {
        botId: parseInt(id),
        fieldName,
        fieldType: "text",
        isRequired: false,
      };
      const response = await createCapturedField(newFieldObj);
      setFields([...fields, response.data]);
      setNewField("");
    } catch (error) {
      console.error("Error creando campo:", error);
    }
  };

  // 📤 Simular exportación
  const handleExportExcel = () => {
    const exportData = capturedData.map((item) => {
      const values = item.values || {};
      return {
        Usuario: item.userId || item.sessionId || "N/A",
        Fecha: item.createdAt ? new Date(item.createdAt).toLocaleString() : "N/A", // ✅ fecha formateada
        ...fields.reduce((acc, field) => {
          acc[field.fieldName] = values[field.fieldName] || "-";
          return acc;
        }, {}),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos Capturados");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(blob, `captura_bot_${id}.xlsx`);
  };

  // 📋 Copiar URL API (modo público)
  const handleCopyToClipboard = () => {
    const publicEndpoint = `http://localhost:5006/api/BotDataSubmissions/public/by-bot/${id}`;
    navigator.clipboard.writeText(publicEndpoint);
    alert("URL copiada al portapapeles");
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox pt={1} pb={3} px={2}>
        {/* CARD - Configurar campos */}
        <Card sx={{ p: 3, mb: 4, borderRadius: "xl", boxShadow: "lg" }}>
          <SoftTypography variant="h5" fontWeight="bold" gutterBottom>
            Configura los campos a capturar
          </SoftTypography>
          <SoftTypography variant="body2" color="text" sx={{ mb: 3 }}>
            Agrega los campos que deseas capturar desde el bot.
          </SoftTypography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2}>
            <Grid item xs={8}>
              <SoftInput
                placeholder="Ej: Dirección"
                value={newField}
                onChange={(e) => setNewField(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <SoftButton color="success" fullWidth onClick={handleAddField}>
                Agregar Campo
              </SoftButton>
            </Grid>
          </Grid>

          <SoftBox sx={{ overflowX: "auto", mt: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <FixedCell>Campo</FixedCell>
                  <FixedCell>Capturar con intención</FixedCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fields.map((field, i) => (
                  <TableRow key={i}>
                    <BodyCell>{field.fieldName}</BodyCell>
                    <BodyCell>
                      <Switch
                        checked={field.isRequired || false}
                        onChange={async () => {
                          const updated = {
                            ...field,
                            isRequired: !field.isRequired,
                          };
                          try {
                            await updateCapturedField(updated);
                            const updatedFields = [...fields];
                            updatedFields[i] = updated;
                            setFields(updatedFields);
                          } catch (error) {
                            console.error("Error actualizando campo:", error);
                          }
                        }}
                      />
                      <SoftTypography variant="caption" ml={1}>
                        Capturar solo si se detecta intención
                      </SoftTypography>
                    </BodyCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SoftBox>
        </Card>

        {/* SWITCH para modo de visualización */}
        <SoftBox
          display="flex"
          alignItems="center"
          mb={3}
          bgcolor="#f9f9f9"
          p={2}
          borderRadius="lg"
          boxShadow="xs"
        >
          <Switch checked={useApi} onChange={() => setUseApi(!useApi)} />
          <SoftTypography variant="button" ml={1}>
            {useApi ? "Visualización vía API pública" : "Visualización manual de datos"}
          </SoftTypography>
        </SoftBox>

        {/* CARD - Visualización */}
        <Card sx={{ p: 3, borderRadius: "xl", boxShadow: "lg" }}>
          <SoftTypography variant="h5" fontWeight="bold" gutterBottom>
            {useApi ? "Endpoint público para obtener datos" : "Datos captados por el bot"}
          </SoftTypography>

          <SoftTypography variant="body2" color="text" sx={{ mb: 2 }}>
            {useApi
              ? "Usa este endpoint para acceder a los datos capturados desde tu sistema externo:"
              : "Estos son los datos recolectados por el bot con los campos definidos manualmente."}
          </SoftTypography>

          {useApi ? (
            <SoftBox
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              bgcolor="#f5f5f5"
              p={2}
              borderRadius="lg"
            >
              <SoftTypography variant="caption" color="text">
                {`http://localhost:5006/api/BotDataSubmissions/public/by-bot/${id}`}
              </SoftTypography>
              <Tooltip title="Copiar URL">
                <SoftButton
                  color="info"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `http://localhost:5006/api/BotDataSubmissions/public/by-bot/${id}`
                    )
                  }
                >
                  <Icon>content_copy</Icon>
                </SoftButton>
              </Tooltip>
            </SoftBox>
          ) : (
            <>
              <SoftInput
                placeholder="Buscar en los datos captados..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
              />

              <SoftBox sx={{ overflowX: "auto" }}>
                <Table
                  size="small"
                  sx={{
                    borderCollapse: "collapse",
                    minWidth: "100%",
                    tableLayout: "fixed",
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <FixedCell width={columnWidth}>Usuario/Sesión</FixedCell>
                      {fields.map((field, i) => (
                        <FixedCell key={i} width={columnWidth}>
                          {field.fieldName}
                        </FixedCell>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filteredData.map((data, i) => (
                      <TableRow key={i}>
                        <BodyCell width={columnWidth}>
                          {data.sessionId || data.userId || "-"}
                        </BodyCell>
                        {fields.map((field, j) => (
                          <BodyCell key={j} width={columnWidth}>
                            {data.values?.[field.fieldName] ?? "-"}
                          </BodyCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </SoftBox>
              <SoftBox mt={4} display="flex" justifyContent="space-between" alignItems="center">
                <SoftButton variant="gradient" color="info" onClick={handleContinue}>
                  Continuar
                </SoftButton>

                <SoftButton color="primary" onClick={handleExportExcel}>
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

export default CapturedData;
