import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// @mui components
import CircularProgress from "@mui/material/CircularProgress";
import Card from "@mui/material/Card";

// Soft UI components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

// Services
import { getMyPlan, cancelMyPlan } from "services/planService";

function MyPlanCard() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Navegación

  useEffect(() => {
    const fetchData = async () => {
      try {
        const planData = await getMyPlan();
        setPlan(planData);
        setError(null);
      } catch (error) {
        console.error("Error al cargar plan:", error);
        setError(error.response?.data?.message || "Hubo un error al obtener el plan.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Card>
      <SoftBox pt={2} px={2}>
        <SoftTypography variant="h6" fontWeight="medium" textTransform="capitalize">
          Mi plan actual
        </SoftTypography>
      </SoftBox>

      <SoftBox pt={1.5} pb={2} px={2} lineHeight={1.25}>
        {loading ? (
          <SoftBox display="flex" justifyContent="center" py={2}>
            <CircularProgress />
          </SoftBox>
        ) : error ? (
          <SoftTypography color="error" variant="body2">
            {error}
          </SoftTypography>
        ) : plan && plan.isActive ? (
          <>
            <SoftTypography
              variant="caption"
              fontWeight="bold"
              color="text"
              textTransform="uppercase"
              mb={1}
            >
              detalles del plan
            </SoftTypography>

            <SoftBox py={1}>
              <SoftTypography variant="button" fontWeight="regular" color="text">
                <strong>Nombre:</strong> {plan.name}
              </SoftTypography>
            </SoftBox>

            <SoftBox py={1}>
              <SoftTypography variant="button" fontWeight="regular" color="text">
                <strong>Descripción:</strong> {plan.description}
              </SoftTypography>
            </SoftBox>

            <SoftBox py={1}>
              <SoftTypography variant="button" fontWeight="regular" color="text">
                <strong>Precio:</strong> ${plan.price}
              </SoftTypography>
            </SoftBox>

            <SoftBox py={1}>
              <SoftTypography variant="button" fontWeight="regular" color="text">
                <strong>Máx Tokens:</strong> {plan.maxTokens}
              </SoftTypography>
            </SoftBox>

            <SoftBox py={1}>
              <SoftTypography variant="button" fontWeight="regular" color="text">
                <strong>Límite de Bots:</strong> {plan.botsLimit ?? "Ilimitado"}
              </SoftTypography>
            </SoftBox>

            <SoftBox py={1}>
              <SoftTypography variant="button" fontWeight="regular" color="text">
                <strong>Activo:</strong> {plan.isActive ? "Sí" : "No"}
              </SoftTypography>
            </SoftBox>

            <SoftBox py={1}>
              <SoftTypography variant="button" fontWeight="regular" color="text">
                <strong>Inicio:</strong>{" "}
                {plan.startedAt ? new Date(plan.startedAt).toLocaleDateString() : "N/A"}
              </SoftTypography>
            </SoftBox>

            <SoftBox py={1}>
              <SoftTypography variant="button" fontWeight="regular" color="text">
                <strong>Vence:</strong>{" "}
                {plan.expiresAt ? new Date(plan.expiresAt).toLocaleDateString() : "N/A"}
              </SoftTypography>
            </SoftBox>

            <SoftBox mt={3} display="flex" flexDirection="column" alignItems="flex-start" gap={1}>
              <SoftButton
                variant="text"
                onClick={() => navigate("/plans", { state: { currentPlanId: plan?.id } })}
                sx={{
                  color: "#1a73e8",
                  fontWeight: "bold",
                  textTransform: "none",
                  padding: 0,
                  minHeight: "auto",
                  minWidth: "auto",
                  "&:hover": {
                    textDecoration: "underline",
                    backgroundColor: "transparent",
                    color: "#0f5bb5",
                  },
                }}
              >
                Cambiar plan
              </SoftButton>

              <SoftButton
                variant="text"
                onClick={async () => {
                  if (window.confirm("¿Estás seguro de cancelar tu plan?")) {
                    try {
                      setLoading(true);
                      await cancelMyPlan(plan.id); // Llama al servicio para cancelar
                
                      // Refrescar el plan después de cancelar
                      const updatedPlan = await getMyPlan();
                      setPlan(updatedPlan);
                      setError(null);
                    } catch (error) {
                      setError(error.response?.data?.message || "Error al cancelar el plan.");
                    } finally {
                      setLoading(false);
                      // 🔄 Recargar la página para actualizar el header
                      window.location.reload();
                    }
                  }
                }}
                
                sx={{
                  color: "#1a73e8",
                  fontWeight: "bold",
                  textTransform: "none",
                  padding: 0,
                  minHeight: "auto",
                  minWidth: "auto",
                  "&:hover": {
                    textDecoration: "underline",
                    backgroundColor: "transparent",
                    color: "#0f5bb5",
                  },
                }}
              >
                Cancelar plan
              </SoftButton>
            </SoftBox>
          </>
        ) : (
          <SoftTypography variant="body2">
            {plan?.message || "No tienes un plan activo."}
          </SoftTypography>
        )}
      </SoftBox>
    </Card>
  );
}

export default MyPlanCard;
