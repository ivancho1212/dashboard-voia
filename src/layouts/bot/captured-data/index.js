import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getCapturedFields,
  createCapturedField,
  updateCapturedField,
  deleteCapturedField,
} from "services/botCapturedFieldsService";

// Layout y componentes de UI
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
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

// Componentes de celda estilizados
import { FixedCell, BodyCell } from "./components/StyledCells";

function DefineCapturedData() {
  const [fields, setFields] = useState([]);
  const [newField, setNewField] = useState("");
  const [editingField, setEditingField] = useState({ id: null, name: "" }); // 1. Estado para la edición
  const { id } = useParams();
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate(`/bots/style/${id}`);
  };

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

  const handleAddField = async () => {
    const fieldName = newField.trim();
    if (!fieldName || fields.some((f) => f.fieldName === fieldName)) return;

    try {
      const newFieldObj = {
        botId: parseInt(id),
        fieldName,
        fieldType: "text",
        isRequired: true,
      };
      const response = await createCapturedField(newFieldObj);
      setFields([...fields, response.data]);
      setNewField("");
    } catch (error) {
      console.error("Error creando campo:", error);
    }
  };

  const handleDeleteField = async (fieldId) => {
    try {
      await deleteCapturedField(fieldId);
      setFields(fields.filter((f) => f.id !== fieldId));
    } catch (error) {
      console.error("Error eliminando campo:", error);
    }
  };

  // 2. Nueva función para guardar la edición
  const handleSaveEdit = async () => {
    if (!editingField.id || !editingField.name.trim()) {
      setEditingField({ id: null, name: "" }); // Cancelar si está vacío
      return;
    }

    const originalField = fields.find(f => f.id === editingField.id);
    if (!originalField) return;

    const updatedFieldData = { ...originalField, fieldName: editingField.name.trim() };

    try {
      await updateCapturedField(updatedFieldData);
      const updatedFields = fields.map(f => f.id === editingField.id ? updatedFieldData : f);
      setFields(updatedFields);
    } catch (error) {
      console.error("Error actualizando el nombre del campo:", error);
    } finally {
      setEditingField({ id: null, name: "" }); // Salir del modo edición
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox pt={1} pb={3} px={2}>
        <Card sx={{ p: 3, mb: 4, borderRadius: "xl", boxShadow: "lg" }}>
          <SoftTypography variant="h5" fontWeight="bold" gutterBottom>
            Configura los campos a capturar
          </SoftTypography>
          <SoftTypography variant="body2" color="text" sx={{ mb: 3 }}>
            Agrega los campos que deseas que el bot intente recolectar durante la conversación.
          </SoftTypography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <SoftInput
                placeholder="Ej: Dirección, Teléfono, Email"
                value={newField}
                onChange={(e) => setNewField(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <SoftButton color="info" fullWidth onClick={handleAddField}>
                Agregar Campo
              </SoftButton>
            </Grid>
          </Grid>

          <SoftBox sx={{ overflowX: "auto", mt: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <FixedCell>Campo</FixedCell>
                  <FixedCell>Condición</FixedCell>
                  <FixedCell>Acciones</FixedCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fields.map((field, i) => (
                  <TableRow key={field.id}>
                    <BodyCell>
                      {/* 3. Lógica de renderizado condicional para edición */}
                      {editingField.id === field.id ? (
                        <SoftInput
                          value={editingField.name}
                          onChange={(e) => setEditingField({ ...editingField, name: e.target.value })}
                          onBlur={handleSaveEdit} // Guardar al perder el foco
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()} // Guardar con Enter
                          autoFocus
                        />
                      ) : (
                        field.fieldName
                      )}
                    </BodyCell>
                    <BodyCell>
                      <Switch
                        checked={field.isRequired || false}
                        onChange={async () => {
                          const updated = { ...field, isRequired: !field.isRequired };
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
                      <SoftTypography variant="caption" ml={1} fontWeight={field.isRequired ? "bold" : "regular"} color={field.isRequired ? "success" : "text"}>
                        {field.isRequired ? "Requerido" : "Opcional"}
                      </SoftTypography>
                    </BodyCell>
                    <BodyCell>
                      {/* 4. Botón de editar */}
                      <Tooltip title="Editar Campo">
                        <IconButton color="secondary" onClick={() => setEditingField({ id: field.id, name: field.fieldName })}>
                          <Icon>edit</Icon>
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar Campo">
                        <IconButton color="error" onClick={() => handleDeleteField(field.id)}>
                          <Icon>delete</Icon>
                        </IconButton>
                      </Tooltip>
                    </BodyCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SoftBox>

          <SoftBox mt={4} display="flex" justifyContent="flex-end">
            <SoftButton variant="gradient" color="info" onClick={handleContinue}>
              Continuar al siguiente paso
            </SoftButton>
          </SoftBox>

        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default DefineCapturedData;