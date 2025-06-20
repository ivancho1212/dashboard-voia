import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  getCapturedFields,
  createCapturedField,
  updateCapturedField,
} from "services/botCapturedFieldsService";
import { getCapturedSubmissionsByBot } from "services/botDataSubmissionsService";

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

function CapturedData() {
  const [fields, setFields] = useState([]);
  const [newField, setNewField] = useState("");
  const [capturedData, setCapturedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [useApi, setUseApi] = useState(false);
  const { id } = useParams(); // botId

  // Obtener campos configurados
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

  // Obtener datos captados
  useEffect(() => {
    const fetchCapturedData = async () => {
      try {
        const response = await getCapturedSubmissionsByBot(id);
        setCapturedData(response.data); // [{ userId/sessionId, fieldName1: value1, ... }]
      } catch (error) {
        console.error("Error al obtener datos captados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCapturedData();
  }, [id]);

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

  const handleExportExcel = () => {
    alert("Exportando datos a Excel...");
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(`https://tusitio.com/api/botdatasubmissions/by-bot/${id}`);
    alert("URL copiada al portapapeles");
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <SoftBox py={3} px={2}>
        {/* CARD - Configurar campos */}
        <Card sx={{ p: 3, mb: 4 }}>
          <SoftTypography variant="h5" gutterBottom>
            Configura los campos a capturar
          </SoftTypography>

          <SoftTypography variant="body2" color="text" sx={{ mb: 3 }}>
            Agrega los campos que deseas capturar desde el bot.
          </SoftTypography>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={8}>
              <SoftInput
                placeholder="Ej: Dirección"
                value={newField}
                onChange={(e) => setNewField(e.target.value)}
              />
            </Grid>
            <Grid item xs={4}>
              <SoftButton color="success" fullWidth onClick={handleAddField}>
                Agregar Campo
              </SoftButton>
            </Grid>
          </Grid>

          <Table sx={{ mt: 3 }}>
            <TableHead>
              <TableRow>
                <TableCell>Campo</TableCell>
                <TableCell>Capturar con intención</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fields.map((field, i) => (
                <TableRow key={i}>
                  <TableCell>{field.fieldName}</TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* SWITCH para modo de visualización */}
        <SoftBox display="flex" alignItems="center" mb={3}>
          <Switch checked={useApi} onChange={() => setUseApi(!useApi)} />
          <SoftTypography variant="button" ml={1}>
            {useApi ? "Visualización vía API pública" : "Visualización manual de datos"}
          </SoftTypography>
        </SoftBox>

        {/* CARD - Visualización */}
        <Card sx={{ p: 3 }}>
          <SoftTypography variant="h5" gutterBottom>
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
                https://tusitio.com/api/botdatasubmissions/by-bot/{id}
              </SoftTypography>
              <Tooltip title="Copiar URL">
                <SoftButton color="info" onClick={handleCopyToClipboard}>
                  <Icon>content_copy</Icon>
                </SoftButton>
              </Tooltip>
            </SoftBox>
          ) : (
            <>
              <Table size="small" sx={{ borderCollapse: "collapse" }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Usuario/Sesión</TableCell>
                    {fields.map((field, i) => (
                      <TableCell key={i} sx={{ fontWeight: "bold" }}>
                        {field.fieldName}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {capturedData.map((data, i) => (
                    <TableRow key={i}>
                      <TableCell>{data.sessionId || data.userId || "-"}</TableCell>
                      {fields.map((field, j) => (
                        <TableCell key={j}>
                          {data[field.fieldName] ?? "-"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <SoftBox display="flex" justifyContent="flex-end" mt={3}>
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
