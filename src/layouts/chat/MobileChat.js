import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ChatWidget from "layouts/bot/style/components/ChatWidget";
import widgetAuthService from "services/widgetAuthService";
import { getBotDataWithToken } from "services/botService";
import { getCsrfToken, getCsrfHeaderName } from "services/csrfService";
import "layouts/widget/WidgetStyles.css";

const API_URL = "http://localhost:5006/api";
const INACTIVITY_TIMEOUT = 3 * 60 * 1000; // 3 minutos
const INACTIVITY_COUNTDOWN_SEC = 10; // segundos de aviso con conteo regresivo

/**
 * MobileChat — Vista móvil del chat generada desde el QR.
 *
 * Reglas de negocio:
 * - Solo accede a conversaciones activas pasadas por URL (?conversation=ID)
 * - NO crea conversaciones nuevas
 * - NO permite abrir conversaciones cerradas, expiradas o inexistentes
 * - NO muestra botón de QR (el QR está en el widget web)
 * - Soporta envío de mensajes, imágenes y documentos
 * - Timer de inactividad de 3 minutos + 30s de gracia
 */
export default function MobileChat() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const botIdRaw = searchParams.get("bot");
  const conversationId = searchParams.get("conversation");
  const botId = botIdRaw ? parseInt(botIdRaw, 10) : null;

  // Estados de inicialización
  const [phase, setPhase] = useState("loading"); // loading | valid | error | expired
  const [errorMsg, setErrorMsg] = useState("");
  const [widgetToken, setWidgetToken] = useState(null);
  const [botStyle, setBotStyle] = useState({});

  // Inactividad
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [inactivityCountdown, setInactivityCountdown] = useState(null);
  const inactivityTimerRef = useRef(null);
  const closeTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // Encuesta de resolución (se muestra ANTES del aviso de inactividad)
  const [showSurvey, setShowSurvey] = useState(false);
  const surveyTimeoutRef = useRef(null);
  const surveyAnsweredRef = useRef(false);
  const SURVEY_TIMEOUT_SEC = 15; // segundos para responder antes de cerrar sin respuesta

  // Redirigir si no hay botId válido
  useEffect(() => {
    if (!botId || isNaN(botId)) {
      navigate("/", { replace: true });
    }
  }, [botId, navigate]);

  // ─── Notificar leave-mobile al backend ───────────────────────────────────
  const notifyMobileLeft = useCallback(async (reason = "page-closed") => {
    if (!conversationId) return;
    try {
      navigator.sendBeacon(
        `${API_URL}/Conversations/${conversationId}/leave-mobile`,
        new Blob([JSON.stringify({ reason })], { type: "application/json" })
      );
    } catch (e) {}
  }, [conversationId]);

  // ─── Inicialización: validar + token + estilo + join-mobile ──────────────
  useEffect(() => {
    if (!botId || !conversationId) {
      setErrorMsg(
        !conversationId
          ? "No se proporcionó una conversación. Escanea un nuevo código QR."
          : "Parámetros de URL inválidos."
      );
      setPhase("error");
      return;
    }

    let cancelled = false;

    const init = async () => {
      try {
        // 1. Verificar que la conversación exista y esté activa
        const statusResp = await fetch(
          `${API_URL}/Conversations/${conversationId}/status`,
          { headers: { "Content-Type": "application/json" } }
        );

        if (!statusResp.ok) {
          const msg =
            statusResp.status === 404
              ? "Esta conversación no existe. Escanea un nuevo código QR."
              : statusResp.status === 410
              ? "Esta conversación ha expirado. Escanea un nuevo código QR."
              : "Conversación no disponible.";
          if (!cancelled) { setErrorMsg(msg); setPhase("error"); }
          return;
        }

        const convData = await statusResp.json();
        if (convData.status === "closed" || convData.blocked) {
          if (!cancelled) {
            setErrorMsg("Esta conversación ya fue cerrada. Escanea un nuevo código QR.");
            setPhase("error");
          }
          return;
        }

        // 2. Generar UN solo token de widget
        const token = await widgetAuthService.getWidgetToken(botId);
        if (!token) throw new Error("No se pudo generar acceso al chat.");
        if (cancelled) return;

        // 3. Cargar estilo del bot (con el token generado)
        try {
          const config = await getBotDataWithToken(botId, token);
          // Verificar flag de plan: si el bot owner no tiene mobile habilitado, bloquear
          if (config?.allowMobileVersion === false) {
            if (!cancelled) {
              setErrorMsg("El plan actual no incluye acceso a la versión móvil del chat.");
              setPhase("error");
            }
            return;
          }
          const styles = config?.styles || config?.settings?.styles || config?.style || {};
          if (!cancelled && Object.keys(styles).length > 0) setBotStyle(styles);
        } catch (_) {
          // Fallback a estilos por defecto — no bloquear el chat
        }

        if (cancelled) return;
        setWidgetToken(token);

        // 4. Notificar al backend que el móvil se unió
        const csrfToken = await getCsrfToken().catch(() => null);
        const csrfHeader = getCsrfHeaderName();
        const joinHeaders = { "Content-Type": "application/json" };
        if (csrfToken) joinHeaders[csrfHeader] = csrfToken;

        const joinResp = await fetch(
          `${API_URL}/Conversations/${conversationId}/join-mobile`,
          {
            method: "POST",
            headers: joinHeaders,
            body: JSON.stringify({ deviceType: "mobile", userAgent: navigator.userAgent }),
            credentials: "include",
          }
        );

        if (cancelled) return;

        if (!joinResp.ok) {
          let msg = "No se pudo unir a la sesión móvil.";
          if (joinResp.status === 403) msg = "Ya existe una sesión móvil activa en esta conversación.";
          else if (joinResp.status === 410) msg = "La conversación ha expirado.";
          else if (joinResp.status === 404) msg = "La conversación no existe.";
          setErrorMsg(msg);
          setPhase("error");
          return;
        }

        if (!cancelled) setPhase("valid");
      } catch (err) {
        if (!cancelled) {
          setErrorMsg("Error de conexión. Verifica tu internet e intenta de nuevo.");
          setPhase("error");
        }
      }
    };

    init();
    return () => { cancelled = true; };
  }, [botId, conversationId]);

  // ─── leave-mobile al desmontar ───────────────────────────────────────────
  useEffect(() => {
    if (phase !== "valid") return;

    const handleUnload = () => notifyMobileLeft("page-closed");
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      notifyMobileLeft("component-unmount");
    };
  }, [phase, notifyMobileLeft]);

  // ─── Timer de inactividad ────────────────────────────────────────────────
  // Registrar respuesta de encuesta en el backend
  const submitSurveyAnswer = useCallback(async (resolved) => {
    if (!conversationId) return;
    try {
      await fetch(`${API_URL}/Conversations/${conversationId}/resolution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved }),
      });
    } catch (e) { /* silencioso */ }
  }, [conversationId]);

  // Iniciar el conteo regresivo de cierre por inactividad
  const startInactivityCountdown = useCallback(() => {
    setShowInactivityWarning(true);
    setInactivityCountdown(INACTIVITY_COUNTDOWN_SEC);

    let remaining = INACTIVITY_COUNTDOWN_SEC;
    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setInactivityCountdown(remaining);
      if (remaining <= 0) clearInterval(countdownIntervalRef.current);
    }, 1000);

    closeTimerRef.current = setTimeout(() => {
      clearInterval(countdownIntervalRef.current);
      notifyMobileLeft("inactivity-expired");
      setPhase("expired");
    }, INACTIVITY_COUNTDOWN_SEC * 1000);
  }, [notifyMobileLeft]);

  const resetInactivityTimer = useCallback(() => {
    // No resetear si la encuesta está visible (el usuario interactúa con ella)
    if (surveyAnsweredRef.current) return;
    clearTimeout(inactivityTimerRef.current);
    clearTimeout(closeTimerRef.current);
    clearTimeout(surveyTimeoutRef.current);
    clearInterval(countdownIntervalRef.current);
    setShowInactivityWarning(false);
    setShowSurvey(false);
    setInactivityCountdown(null);

    inactivityTimerRef.current = setTimeout(() => {
      // Mostrar encuesta ANTES del aviso de cierre
      setShowSurvey(true);
      surveyAnsweredRef.current = false;

      // Si el usuario no responde en SURVEY_TIMEOUT_SEC, proceder sin respuesta
      surveyTimeoutRef.current = setTimeout(() => {
        setShowSurvey(false);
        startInactivityCountdown();
      }, SURVEY_TIMEOUT_SEC * 1000);
    }, INACTIVITY_TIMEOUT);
  }, [startInactivityCountdown]);

  useEffect(() => {
    if (phase !== "valid") return;

    const events = ["mousedown", "keydown", "touchstart", "click", "input"];
    const handle = () => resetInactivityTimer();
    events.forEach((e) => document.addEventListener(e, handle));
    resetInactivityTimer();

    return () => {
      events.forEach((e) => document.removeEventListener(e, handle));
      clearTimeout(inactivityTimerRef.current);
      clearTimeout(closeTimerRef.current);
      clearTimeout(surveyTimeoutRef.current);
      clearInterval(countdownIntervalRef.current);
    };
  }, [phase, resetInactivityTimer]);

  // ─── Renders de estado ───────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div style={css.fullPage}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <p style={{ fontSize: 14, color: "#666" }}>Cargando conversación...</p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div style={css.fullPage}>
        <div style={css.msgBox}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>❌</div>
          <h1 style={{ ...css.title, color: "#d32f2f" }}>Conversación No Disponible</h1>
          <p style={css.body}>{errorMsg}</p>
          <p style={css.hint}>Puedes cerrar esta ventana.</p>
        </div>
      </div>
    );
  }

  if (phase === "expired") {
    return (
      <div style={css.fullPage}>
        <div style={css.msgBox}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>⏰</div>
          <h1 style={css.title}>Sesión Expirada</h1>
          <p style={css.body}>
            La conversación se cerró por inactividad.
            <br />Escanea un nuevo código QR para continuar.
          </p>
        </div>
      </div>
    );
  }

  // phase === "valid"
  return (
    <div style={{ width: "100%", height: "100vh", overflow: "hidden", position: "relative" }}>
      {/* Encuesta de resolución — aparece ANTES del aviso de inactividad */}
      {showSurvey && (
        <div style={css.overlay}>
          <div style={css.overlayBox}>
            <div style={{ fontSize: "28px", marginBottom: "12px" }}>🤔</div>
            <div style={{ color: "#333", fontSize: "16px", fontWeight: "600", marginBottom: "8px" }}>
              ¿Resolvimos tu consulta?
            </div>
            <div style={{ color: "#888", fontSize: "12px", marginBottom: "20px" }}>
              Tu respuesta nos ayuda a mejorar
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={async () => {
                  surveyAnsweredRef.current = true;
                  clearTimeout(surveyTimeoutRef.current);
                  setShowSurvey(false);
                  await submitSurveyAnswer(true);
                  startInactivityCountdown();
                }}
                style={{
                  background: "#4caf50", color: "#fff", border: "none",
                  borderRadius: "8px", padding: "10px 20px",
                  fontSize: "15px", cursor: "pointer", fontWeight: "600",
                }}
              >
                Sí ✓
              </button>
              <button
                onClick={async () => {
                  surveyAnsweredRef.current = true;
                  clearTimeout(surveyTimeoutRef.current);
                  setShowSurvey(false);
                  await submitSurveyAnswer(false);
                  startInactivityCountdown();
                }}
                style={{
                  background: "#ef5350", color: "#fff", border: "none",
                  borderRadius: "8px", padding: "10px 20px",
                  fontSize: "15px", cursor: "pointer", fontWeight: "600",
                }}
              >
                No ✗
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerta de inactividad (overlay con conteo regresivo) */}
      {showInactivityWarning && (
        <div style={css.overlay}>
          <div style={css.overlayBox}>
            <div style={{ color: "#333", fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>
              Conversación por expirar
            </div>
            <div style={{ color: "#666", fontSize: "13px", marginBottom: "16px", lineHeight: 1.4 }}>
              Por inactividad la conversación se cerrará. Interactúa con el chat para continuar.
            </div>
            <div style={{ color: "#b71c1c", fontSize: "56px", fontWeight: "700", lineHeight: 1, marginBottom: "4px" }}>
              {inactivityCountdown ?? INACTIVITY_COUNTDOWN_SEC}
            </div>
            <div style={{ color: "#c62828", fontSize: "14px", fontWeight: "500" }}>
              segundos
            </div>
          </div>
        </div>
      )}

      {/* ChatWidget directo — sin iframe, sin WidgetFrame */}
      <ChatWidget
        botId={botId}
        userId="anon"
        widgetToken={widgetToken}
        conversationId={conversationId}
        isMobileView={true}
        style={botStyle}
        isDemo={false}
        isWidget={true}
        previewMode={true}
      />
    </div>
  );
}

const css = {
  fullPage: {
    width: "100%",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  msgBox: {
    textAlign: "center",
    padding: "40px",
    maxWidth: "400px",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    lineHeight: 1.6,
  },
  hint: {
    fontSize: 12,
    color: "#999",
  },
  overlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  overlayBox: {
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    border: "2px solid #ef5350",
    borderRadius: "16px",
    padding: "24px 28px 28px",
    maxWidth: "90%",
    textAlign: "center",
    boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
  },
};
