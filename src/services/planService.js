import axios from "axios";

// Obtiene el plan actual del usuario
export const getMyPlan = async () => {
  const token = localStorage.getItem("token");

  try {
    const response = await axios.get("http://localhost:5006/api/subscriptions/me", {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    const subscription = response.data;

    if (
      !subscription ||
      subscription.status === "cancelled" ||
      subscription.status === "inactive"
    ) {
      return {
        isActive: false,
        message: "No tienes un plan activo. Puedes suscribirte nuevamente.",
      };
    }

    return {
      name: subscription.planName || "Plan actual",
      description: subscription.planDescription || "Sin descripción disponible",
      price: subscription.planPrice != null ? subscription.planPrice : 0,
      maxTokens: subscription.planMaxTokens != null ? subscription.planMaxTokens : 0,
      botsLimit: subscription.planBotsLimit != null ? subscription.planBotsLimit : 1,
      isActive: subscription.status === "active",
      startedAt: subscription.startedAt ? new Date(subscription.startedAt) : null,
      expiresAt: subscription.expiresAt ? new Date(subscription.expiresAt) : null,
      id: subscription.planId,
    };
  } catch (error) {
    console.error("Error al obtener el plan del usuario:", error);
    return {
      isActive: false,
      message: error.response?.data?.message || "No tienes un plan activo o hubo un error.",
    };
  }
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
    alert(error.response?.data?.message || "Ocurrió un error al intentar suscribirte al plan.");
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
    alert(error.response?.data?.message || "Ocurrió un error al intentar cambiar de plan.");
  }
};

// Obtener todos los planes disponibles
export const getAllPlans = async () => {
  const response = await axios.get("http://localhost:5006/api/plans");
  return response.data;
};

export const createPlan = async (plan) => {
  const token = localStorage.getItem("token");
  const response = await axios.post(API_URL, plan, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updatePlan = async (id, plan) => {
  const token = localStorage.getItem("token");
  await axios.put(`${API_URL}/${id}`, plan, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const deletePlan = async (id) => {
  const token = localStorage.getItem("token");
  await axios.delete(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const cancelMyPlan = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("No estás autenticado.");
    return;
  }

  try {
    await axios.put(
      "http://localhost:5006/api/subscriptions/cancel",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    alert("Suscripción cancelada correctamente");
  } catch (error) {
    console.error("Error al cancelar el plan:", error);
    alert(error.response?.data?.message || "Error al cancelar la suscripción.");
  }
};
