import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getCapturedFields } from "services/botCapturedFieldsService";
import {
  getCapturedSubmissionsByBot,
  getPublicCapturedSubmissionsByBot,
} from "services/botDataSubmissionsService";
import { styled } from "@mui/material/styles";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Layout y componentes de UI
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import Card from "@mui/material/Card";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
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
  const [loading, setLoading] = useState(true);
  const [useApi, setUseApi] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { id } = useParams(); // Asumiendo que el ID del bot viene de la URL

  // Función para pivotar los datos a un formato de fila por entrada
  const pivotData = (data) => {
    const rows = [];
    data.forEach((item) => {
      const row = { 
        sessionId: item.sessionId, 
        userId: item.userId, 
        createdAt: item.createdAt 
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
        const fieldsResponse = await getCapturedFields(id);
        setFields(fieldsResponse.data);

        const dataResponse = useApi
          ? await getPublicCapturedSubmissionsByBot(id)
          : await getCapturedSubmissionsByBot(id);
        setCapturedData(dataResponse.data);

      } catch (error) {
        console.error("Error al obtener datos:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAllData();
    }
  }, [id, useApi]);

  // Filtrar datos por término de búsqueda
  const pivotedData = pivotData(capturedData);
  const filteredData = pivotedData.filter((row) =>
    Object.values(row).some((val) =>
      val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Exportar a Excel
  const handleExportExcel = () => {
    const exportData = filteredData.map((row) => {
        const record = { 'Usuario/Sesión': row.sessionId || row.userId || 'N/A' };
        fields.forEach(field => {
            record[field.fieldName] = row[field.fieldName];
        });
        record['Fecha'] = row.createdAt ? new Date(row.createdAt).toLocaleString() : 'N/A';
        return record;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos Capturados");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `captura_bot_${id}.xlsx`);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox pt={1} pb={3} px={2}>
        <SoftBox display="flex" alignItems="center" mb={3} bgcolor="#f9f9f9" p={2} borderRadius="lg">
          <Switch checked={useApi} onChange={() => setUseApi(!useApi)} />
          <SoftTypography variant="button" ml={1}>
            {useApi ? "Visualización vía API pública" : "Visualización de datos internos"}
          </SoftTypography>
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
              <SoftTypography variant="caption" color="text">
                {`http://localhost:5006/api/BotDataSubmissions/public/by-bot/${id}`}
              </SoftTypography>
              <Tooltip title="Copiar URL">
                <SoftButton color="info" onClick={() => navigator.clipboard.writeText(`http://localhost:5006/api/BotDataSubmissions/public/by-bot/${id}`)}>
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
                <Table size="small" sx={{ tableLayout: "fixed" }}>
                  <TableHead>
                    <TableRow>
                      <FixedCell>Usuario/Sesión</FixedCell>
                      {fields.map((field) => (
                        <FixedCell key={field.id}>{field.fieldName}</FixedCell>
                      ))}
                      <FixedCell>Fecha</FixedCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                        <TableRow><TableCell colSpan={fields.length + 2}>Cargando...</TableCell></TableRow>
                    ) : filteredData.map((row, idx) => (
                      <TableRow key={idx}>
                        <BodyCell>{row.sessionId || row.userId || "-"}</BodyCell>
                        {fields.map(field => (
                            <BodyCell key={field.id}>{row[field.fieldName]}</BodyCell>
                        ))}
                        <BodyCell>{row.createdAt ? new Date(row.createdAt).toLocaleString() : "N/A"}</BodyCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </SoftBox>
              <SoftBox mt={4} display="flex" justifyContent="flex-end">
                <SoftButton color="black" onClick={handleExportExcel} disabled={loading}>
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
