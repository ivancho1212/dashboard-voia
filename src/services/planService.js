import axios from "axios";

// Obtiene el plan actual del usuario
export const getMyPlan = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get("http://localhost:5006/api/plans/my-plan", {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
  return response.data;
};

// Crea una nueva suscripción para el usuario autenticado
export const createSubscription = async (planId) => {
  const token = localStorage.getItem("token");
  try {
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setMonth(now.getMonth() + 1); // por ejemplo, 1 mes

    await axios.post(
      "http://localhost:5006/api/subscriptions/subscribe",
      {
        planId,
        startedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert("Suscripción realizada con éxito");
  } catch (error) {
    console.error("Error al suscribirse:", error);
    alert(
      error.response?.data?.message ||
        "Ocurrió un error al intentar suscribirte al plan."
    );
  }
};
