import axios from "axios";

// Obtiene el plan actual del usuario
export const getMyPlan = async () => {
  const token = localStorage.getItem("token");

  const response = await axios.get("http://localhost:5006/api/subscriptions/me", {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  const subscription = response.data;

  // Formatea los datos combinando la info de la suscripción y del plan
  return {
    name: subscription.planName,
    description: subscription.planDescription || "Plan actual",
    price: subscription.planPrice || 0,
    maxTokens: subscription.planMaxTokens,
    botsLimit: subscription.planBotsLimit,
    isActive: subscription.status === "active",
    startedAt: subscription.startedAt,
    expiresAt: subscription.expiresAt,
    id: subscription.planId, // importante para comparar en frontend
  };
};

// Crea una nueva suscripción
export const createSubscription = async (planId) => {
  const token = localStorage.getItem("token");

  try {
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setMonth(now.getMonth() + 1); // Ejemplo: 1 mes de duración

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

// Cambiar de plan (requiere que ya exista una suscripción activa)
export const updateSubscription = async (planId) => {
  const token = localStorage.getItem("token");

  try {
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setMonth(now.getMonth() + 1);

    await axios.put(
      "http://localhost:5006/api/subscriptions/change", // ✅ URL correcta
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

    alert("Cambio de plan realizado con éxito");
  } catch (error) {
    console.error("Error al cambiar de plan:", error);
    alert(
      error.response?.data?.message ||
        "Ocurrió un error al intentar cambiar de plan."
    );
  }
};

// Obtener todos los planes disponibles
export const getAllPlans = async () => {
  const response = await axios.get("http://localhost:5006/api/plans");
  return response.data;
};
