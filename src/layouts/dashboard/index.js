import { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import LinearProgress from "@mui/material/LinearProgress";
import Icon from "@mui/material/Icon";

// Soft UI Dashboard React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

// Soft UI Dashboard React examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import MiniStatisticsCard from "examples/Cards/StatisticsCards/MiniStatisticsCard";
import GradientLineChart from "examples/Charts/LineCharts/GradientLineChart";
import ReportsBarChart from "examples/Charts/BarCharts/ReportsBarChart";

// Auth
import { AuthContext } from "contexts/AuthContext";

// Services
import { getAdminOverview, getBotStats, getAllBotsAdmin } from "services/analyticsService";
import { getMyBot } from "services/botService";
import { hasRole } from "services/authService";
import { getMyPlan } from "services/planService";

// Helpers
const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function deltaColor(val) {
  if (val == null) return "text";
  return val >= 0 ? "success" : "error";
}

function deltaText(val) {
  if (val == null) return "";
  return `${val >= 0 ? "+" : ""}${val}%`;
}

// ─── PANEL DE BOT ESPECÍFICO (Admin) ─────────────────────────────────────────
function AdminBotPanel() {
  const [bots, setBots] = useState([]);
  const [selectedBotId, setSelectedBotId] = useState(null);
  const [stats, setStats] = useState(null);
  const [loadingBots, setLoadingBots] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    getAllBotsAdmin()
      .then((list) => {
        setBots(list);
        if (list.length > 0) setSelectedBotId(list[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingBots(false));
  }, []);

  useEffect(() => {
    if (!selectedBotId) return;
    setLoadingStats(true);
    getBotStats(selectedBotId)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoadingStats(false));
  }, [selectedBotId]);

  if (loadingBots) return <CircularProgress size={20} />;

  const tokenPct = stats?.performance?.tokenUsagePercent;
  const dailyLabels = (stats?.conversations?.daily || []).map((d) => {
    const dt = new Date(d.date);
    return `${dt.getDate()}/${dt.getMonth() + 1}`;
  });
  const dailyValues = (stats?.conversations?.daily || []).map((d) => d.count);
  const leadsDaily = (stats?.leads?.daily || []).map((d) => d.count);
  const conversationsChart = {
    labels: dailyLabels,
    datasets: [
      { label: "Conversaciones", color: "info", data: dailyValues },
      ...(leadsDaily.length > 0
        ? [{ label: "Leads", color: "success", data: leadsDaily }]
        : []),
    ],
  };

  return (
    <SoftBox p={3} sx={{ background: "#fff", borderRadius: 2, boxShadow: 1 }}>
      <SoftBox display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <SoftTypography variant="h6" fontWeight="medium">
          Métricas por bot
        </SoftTypography>
        <Select
          value={selectedBotId || ""}
          onChange={(e) => setSelectedBotId(e.target.value)}
          size="small"
          sx={{ minWidth: 220 }}
        >
          {bots.map((b) => (
            <MenuItem key={b.id} value={b.id}>
              {b.name} <span style={{ color: "#aaa", marginLeft: 6 }}>({b.ownerName})</span>
            </MenuItem>
          ))}
        </Select>
      </SoftBox>

      {loadingStats ? (
        <SoftBox display="flex" justifyContent="center" py={4}><CircularProgress /></SoftBox>
      ) : !stats ? (
        <SoftTypography color="text" variant="button">Sin datos disponibles.</SoftTypography>
      ) : (
        <>
          <Grid container spacing={2} mb={2}>
            {[
              { label: "Conversaciones", value: stats.conversations.thisMonth, icon: "chat", delta: stats.conversations.delta },
              { label: "Leads", value: stats.leads.thisMonth, icon: "people", delta: stats.leads.delta },
              { label: "Mensajes", value: stats.conversations.messagesThisMonth, icon: "message" },
              { label: "Resolución", value: stats.resolution.resolutionRatePercent != null ? `${stats.resolution.resolutionRatePercent}%` : "—", icon: "verified" },
              { label: "Conversión", value: `${stats.leads.conversionRatePercent}%`, icon: "trending_up" },
              { label: "Fuera scope", value: stats.resolution.outOfScopeCount, icon: "block" },
              { label: "Tokens usados", value: Number(stats.performance.tokensThisMonth).toLocaleString("es"), icon: "memory" },
              { label: "Latencia prom.", value: `${stats.performance.avgResponseMs}ms`, icon: "speed" },
            ].map((kpi, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <MiniStatisticsCard
                  title={{ text: kpi.label }}
                  count={kpi.value}
                  percentage={kpi.delta != null ? { color: deltaColor(kpi.delta), text: deltaText(kpi.delta) } : { color: "text", text: "" }}
                  icon={{ color: "info", component: kpi.icon }}
                />
              </Grid>
            ))}
          </Grid>

          {dailyValues.length > 0 && (
            <SoftBox mb={2}>
              <GradientLineChart
                title={`Actividad — ${stats.botName}`}
                description={<SoftTypography variant="button" color="text" fontWeight="regular">Últimos 30 días</SoftTypography>}
                height="16rem"
                chart={conversationsChart}
              />
            </SoftBox>
          )}

          {tokenPct != null && (
            <SoftBox>
              <SoftTypography variant="button" fontWeight="medium">
                Uso de tokens: {Number(stats.performance.tokensThisMonth).toLocaleString("es")} / {Number(stats.performance.tokensLimit).toLocaleString("es")}
              </SoftTypography>
              <LinearProgress
                variant="determinate"
                value={Math.min(tokenPct, 100)}
                color={tokenPct > 80 ? "error" : "success"}
                sx={{ mt: 0.5, borderRadius: 4, height: 8 }}
              />
              <SoftTypography variant="caption" color={tokenPct > 80 ? "error" : "text"}>
                {tokenPct}% utilizado
              </SoftTypography>
            </SoftBox>
          )}
        </>
      )}
    </SoftBox>
  );
}

// ─── VISTA ADMIN ─────────────────────────────────────────────────────────────
function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminOverview()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SoftBox display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </SoftBox>
    );
  }

  if (!data) {
    return (
      <SoftBox py={4}>
        <SoftTypography color="error">No se pudieron cargar las métricas.</SoftTypography>
      </SoftBox>
    );
  }

  // Gráfico: nuevos suscriptores por mes
  const newByMonthLabels = (data.subscriptions.newByMonth || []).map(
    (m) => `${MONTHS_ES[m.month - 1]} ${m.year}`
  );
  const newByMonthValues = (data.subscriptions.newByMonth || []).map((m) => m.count);

  const subsChart = {
    labels: newByMonthLabels,
    datasets: [{ label: "Nuevos suscriptores", color: "info", data: newByMonthValues }],
  };

  // Gráfico bar: distribución por plan
  const planLabels = (data.subscriptions.byPlan || []).map((p) => p.plan);
  const planValues = (data.subscriptions.byPlan || []).map((p) => p.count);
  const planBarItems = (data.subscriptions.byPlan || []).map((p) => ({
    icon: { color: "info", component: "people" },
    label: p.plan,
    progress: { content: `${p.count}`, percentage: planValues[0] > 0 ? Math.round((p.count / planValues[0]) * 100) : 0 },
  }));
  const planBarChart = {
    labels: planLabels,
    datasets: [{ label: "Suscriptores", data: planValues }],
  };

  // Gráfico: usuarios registrados por mes
  const usersMonthLabels = (data.platform.usersNewByMonth || []).map(
    (m) => `${MONTHS_ES[m.month - 1]} ${m.year}`
  );
  const usersMonthValues = (data.platform.usersNewByMonth || []).map((m) => m.count);
  const usersChart = {
    labels: usersMonthLabels,
    datasets: [{ label: "Usuarios registrados", color: "success", data: usersMonthValues }],
  };

  const { subscriptions, platform, llm } = data;

  return (
    <SoftBox py={3}>
      {/* Fila 1: KPIs de negocio */}
      <SoftBox mb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} xl={3}>
            <MiniStatisticsCard
              title={{ text: "MRR estimado" }}
              count={`$${Number(subscriptions.mrrEstimated).toLocaleString("es")}`}
              percentage={{ color: "success", text: `${subscriptions.paid} suscriptores pagos` }}
              icon={{ color: "info", component: "paid" }}
            />
          </Grid>
          <Grid item xs={12} sm={6} xl={3}>
            <MiniStatisticsCard
              title={{ text: "Suscriptores activos" }}
              count={subscriptions.totalActive}
              percentage={{ color: "text", text: `${subscriptions.free} free · ${subscriptions.paid} pagos` }}
              icon={{ color: "info", component: "group" }}
            />
          </Grid>
          <Grid item xs={12} sm={6} xl={3}>
            <MiniStatisticsCard
              title={{ text: "Conversaciones este mes" }}
              count={platform.conversationsThisMonth}
              percentage={{
                color: deltaColor(platform.conversationsDelta),
                text: deltaText(platform.conversationsDelta),
              }}
              icon={{ color: "info", component: "chat" }}
            />
          </Grid>
          <Grid item xs={12} sm={6} xl={3}>
            <MiniStatisticsCard
              title={{ text: "Tasa de error LLM" }}
              count={`${llm.errorRatePercent}%`}
              percentage={{ color: llm.errorRatePercent > 5 ? "error" : "success", text: `${llm.avgResponseMs}ms prom.` }}
              icon={{ color: llm.errorRatePercent > 5 ? "error" : "info", component: "psychology" }}
            />
          </Grid>
        </Grid>
      </SoftBox>

      {/* Fila 2: Tokens y plataforma */}
      <SoftBox mb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} xl={3}>
            <MiniStatisticsCard
              title={{ text: "Tokens este mes" }}
              count={Number(llm.tokensThisMonth).toLocaleString("es")}
              percentage={{
                color: deltaColor(llm.tokensDelta),
                text: deltaText(llm.tokensDelta),
              }}
              icon={{ color: "info", component: "memory" }}
            />
          </Grid>
          <Grid item xs={12} sm={6} xl={3}>
            <MiniStatisticsCard
              title={{ text: "Usuarios activos" }}
              count={platform.totalUsers}
              percentage={{ color: "text", text: `${platform.totalBots} bots` }}
              icon={{ color: "info", component: "people_alt" }}
            />
          </Grid>
          {subscriptions.expiringIn7Days?.length > 0 && (
            <Grid item xs={12} sm={6} xl={3}>
              <MiniStatisticsCard
                title={{ text: "Vencen en 7 días" }}
                count={subscriptions.expiringIn7Days.length}
                percentage={{ color: "warning", text: "suscripciones" }}
                icon={{ color: "warning", component: "warning" }}
              />
            </Grid>
          )}
        </Grid>
      </SoftBox>

      {/* Fila 3: Gráficos */}
      <SoftBox mb={3}>
        <Grid container spacing={3}>
          {newByMonthValues.length > 0 && (
            <Grid item xs={12} lg={7}>
              <GradientLineChart
                title="Nuevos suscriptores por mes"
                description={
                  <SoftTypography variant="button" color="text" fontWeight="regular">
                    Últimos {newByMonthValues.length} meses
                  </SoftTypography>
                }
                height="20.25rem"
                chart={subsChart}
              />
            </Grid>
          )}
          {planLabels.length > 0 && (
            <Grid item xs={12} lg={5}>
              <ReportsBarChart
                title="Distribución por plan"
                description={`${subscriptions.totalActive} suscriptores activos`}
                chart={planBarChart}
                items={planBarItems}
              />
            </Grid>
          )}
        </Grid>
      </SoftBox>

      {/* Fila 4: Usuarios registrados por mes */}
      {usersMonthValues.length > 0 && (
        <SoftBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={7}>
              <GradientLineChart
                title="Usuarios registrados por mes"
                description={
                  <SoftTypography variant="button" color="text" fontWeight="regular">
                    {platform.totalUsers} usuarios activos en total
                  </SoftTypography>
                }
                height="20.25rem"
                chart={usersChart}
              />
            </Grid>
            <Grid item xs={12} lg={5}>
              <SoftBox p={3} sx={{ background: "#fff", borderRadius: 2, boxShadow: 1, height: "100%" }}>
                <SoftTypography variant="h6" fontWeight="medium" mb={2}>
                  Resumen de plataforma
                </SoftTypography>
                <SoftBox display="flex" justifyContent="space-between" py={1} sx={{ borderBottom: "1px solid #eee" }}>
                  <SoftTypography variant="button" color="text">Usuarios activos</SoftTypography>
                  <SoftTypography variant="button" fontWeight="bold">{platform.totalUsers}</SoftTypography>
                </SoftBox>
                <SoftBox display="flex" justifyContent="space-between" py={1} sx={{ borderBottom: "1px solid #eee" }}>
                  <SoftTypography variant="button" color="text">Bots creados</SoftTypography>
                  <SoftTypography variant="button" fontWeight="bold">{platform.totalBots}</SoftTypography>
                </SoftBox>
                <SoftBox display="flex" justifyContent="space-between" py={1} sx={{ borderBottom: "1px solid #eee" }}>
                  <SoftTypography variant="button" color="text">Conversaciones este mes</SoftTypography>
                  <SoftTypography variant="button" fontWeight="bold">{platform.conversationsThisMonth}</SoftTypography>
                </SoftBox>
                <SoftBox display="flex" justifyContent="space-between" py={1}>
                  <SoftTypography variant="button" color="text">Tokens este mes</SoftTypography>
                  <SoftTypography variant="button" fontWeight="bold">
                    {Number(llm.tokensThisMonth).toLocaleString("es")}
                  </SoftTypography>
                </SoftBox>
              </SoftBox>
            </Grid>
          </Grid>
        </SoftBox>
      )}

      {/* Vencimientos próximos */}
      {subscriptions.expiringIn7Days?.length > 0 && (
        <SoftBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <SoftBox p={3} sx={{ background: "#fff", borderRadius: 2, boxShadow: 1 }}>
                <SoftTypography variant="h6" fontWeight="medium" mb={2}>
                  Suscripciones por vencer esta semana
                </SoftTypography>
                {subscriptions.expiringIn7Days.map((s, i) => (
                  <SoftBox key={i} display="flex" justifyContent="space-between" py={1}
                    sx={{ borderBottom: "1px solid #eee" }}>
                    <SoftTypography variant="button" fontWeight="regular">
                      {s.userName}
                    </SoftTypography>
                    <SoftTypography variant="button" color="warning" fontWeight="medium">
                      {s.planName} · {new Date(s.expiresAt).toLocaleDateString("es")}
                    </SoftTypography>
                  </SoftBox>
                ))}
              </SoftBox>
            </Grid>
          </Grid>
        </SoftBox>
      )}

      {/* Proveedores LLM */}
      {llm.byProvider?.length > 0 && (
        <SoftBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <SoftBox p={3} sx={{ background: "#fff", borderRadius: 2, boxShadow: 1 }}>
                <SoftTypography variant="h6" fontWeight="medium" mb={2}>
                  Uso por proveedor LLM (este mes)
                </SoftTypography>
                <Grid container spacing={2}>
                  {llm.byProvider.map((p, i) => (
                    <Grid item xs={12} sm={6} md={4} key={i}>
                      <SoftBox p={2} sx={{ border: "1px solid #eee", borderRadius: 2 }}>
                        <SoftTypography variant="h6">{p.provider}</SoftTypography>
                        <SoftTypography variant="button" color="text">
                          {p.calls} llamadas · {p.errors} errores
                        </SoftTypography>
                      </SoftBox>
                    </Grid>
                  ))}
                </Grid>
              </SoftBox>
            </Grid>
          </Grid>
        </SoftBox>
      )}

      {/* Modelos y plantillas más usados */}
      {(data.bots?.modelUsage?.length > 0 || data.bots?.templateUsage?.length > 0) && (
        <SoftBox mb={3}>
          <Grid container spacing={3}>
            {data.bots?.modelUsage?.length > 0 && (
              <Grid item xs={12} md={6}>
                <SoftBox p={3} sx={{ background: "#fff", borderRadius: 2, boxShadow: 1 }}>
                  <SoftTypography variant="h6" fontWeight="medium" mb={2}>
                    Modelos de IA más usados
                  </SoftTypography>
                  {data.bots.modelUsage.map((m, i) => (
                    <SoftBox key={i} display="flex" justifyContent="space-between" alignItems="center" py={1}
                      sx={{ borderBottom: "1px solid #eee" }}>
                      <SoftTypography variant="button" fontWeight="regular">{m.model}</SoftTypography>
                      <SoftBox display="flex" alignItems="center" gap={1}>
                        <SoftBox sx={{ width: 100, mr: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={data.bots.modelUsage[0]?.botsCount > 0 ? Math.round(m.botsCount / data.bots.modelUsage[0].botsCount * 100) : 0}
                            color="info"
                            sx={{ borderRadius: 4, height: 6 }}
                          />
                        </SoftBox>
                        <SoftTypography variant="button" fontWeight="bold" color="info">
                          {m.botsCount} bots
                        </SoftTypography>
                      </SoftBox>
                    </SoftBox>
                  ))}
                </SoftBox>
              </Grid>
            )}
            {data.bots?.templateUsage?.length > 0 && (
              <Grid item xs={12} md={6}>
                <SoftBox p={3} sx={{ background: "#fff", borderRadius: 2, boxShadow: 1 }}>
                  <SoftTypography variant="h6" fontWeight="medium" mb={2}>
                    Plantillas de estilo más usadas
                  </SoftTypography>
                  {data.bots.templateUsage.map((t, i) => (
                    <SoftBox key={i} display="flex" justifyContent="space-between" alignItems="center" py={1}
                      sx={{ borderBottom: "1px solid #eee" }}>
                      <SoftTypography variant="button" fontWeight="regular">{t.name}</SoftTypography>
                      <SoftBox display="flex" alignItems="center" gap={1}>
                        <SoftBox sx={{ width: 100, mr: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={data.bots.templateUsage[0]?.count > 0 ? Math.round(t.count / data.bots.templateUsage[0].count * 100) : 0}
                            color="success"
                            sx={{ borderRadius: 4, height: 6 }}
                          />
                        </SoftBox>
                        <SoftTypography variant="button" fontWeight="bold" color="success">
                          {t.count} bots
                        </SoftTypography>
                      </SoftBox>
                    </SoftBox>
                  ))}
                </SoftBox>
              </Grid>
            )}
          </Grid>
        </SoftBox>
      )}

      {/* Top bots este mes */}
      {data.bots?.topByActivity?.length > 0 && (
        <SoftBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <SoftBox p={3} sx={{ background: "#fff", borderRadius: 2, boxShadow: 1 }}>
                <SoftTypography variant="h6" fontWeight="medium" mb={2}>
                  Bots más activos este mes
                </SoftTypography>
                {data.bots.topByActivity.map((b, i) => (
                  <SoftBox key={i} display="flex" justifyContent="space-between" alignItems="center" py={1}
                    sx={{ borderBottom: i < data.bots.topByActivity.length - 1 ? "1px solid #eee" : "none" }}>
                    <SoftBox display="flex" alignItems="center" gap={1}>
                      <SoftTypography variant="button" color="text" sx={{ minWidth: 24 }}>
                        {i + 1}.
                      </SoftTypography>
                      <SoftBox>
                        <SoftTypography variant="button" fontWeight="medium">{b.name}</SoftTypography>
                        <SoftTypography variant="caption" color="text" display="block">{b.ownerName}</SoftTypography>
                      </SoftBox>
                    </SoftBox>
                    <SoftTypography variant="button" fontWeight="bold" color="info">
                      {b.conversations} conversaciones
                    </SoftTypography>
                  </SoftBox>
                ))}
              </SoftBox>
            </Grid>
          </Grid>
        </SoftBox>
      )}

      {/* Drill-down por bot */}
      <SoftBox mb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <AdminBotPanel />
          </Grid>
        </Grid>
      </SoftBox>
    </SoftBox>
  );
}

// ─── VISTA SIN BOTS ───────────────────────────────────────────────────────────
function NoBotsDashboard({ plan }) {
  const navigate = useNavigate();

  const tokenLimit = plan?.maxTokens ?? 0;
  const features = [
    { icon: "smart_toy", label: `${plan?.botsLimit ?? "∞"} asistente(s) virtual(es)`, ok: true },
    { icon: "psychology", label: "Respuestas con inteligencia artificial", ok: !!plan?.allowAiWidget },
    { icon: "description", label: "Aprendizaje desde documentos", ok: !!plan?.allowVectorSearch },
    { icon: "language", label: "Entrenamiento con páginas web", ok: !!plan?.allowTrainingUrls },
    { icon: "bar_chart", label: "Panel de analíticas", ok: !!plan?.analyticsDashboard },
    { icon: "palette", label: "Personalización visual del widget", ok: !!plan?.customStyles },
    { icon: "phone_android", label: "Versión móvil", ok: plan?.allowMobileVersion !== false },
    { icon: "api", label: "API de integración externa", ok: !!plan?.integrationApi },
  ];

  return (
    <SoftBox py={3}>
      {/* Hero card */}
      <Card sx={{ mb: 3, p: 0, overflow: "hidden", borderRadius: 3, boxShadow: 4 }}>
        <SoftBox
          sx={{
            background: "linear-gradient(135deg, #00bcd4 0%, #006064 100%)",
            p: { xs: 3, md: 5 },
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            gap: 4,
          }}
        >
          <SoftBox flex={1}>
            <SoftTypography variant="h4" fontWeight="bold" sx={{ color: "#fff", mb: 1 }}>
              ¡Bienvenido al panel de control!
            </SoftTypography>
            <SoftTypography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", mb: 3, maxWidth: 480 }}>
              Aún no tienes un asistente virtual configurado. Crea tu primer bot y empieza a automatizar la atención a tus clientes.
            </SoftTypography>
            <Button
              variant="contained"
              onClick={() => navigate("/bots")}
              sx={{
                background: "#fff",
                color: "#00838f",
                fontWeight: "bold",
                borderRadius: 6,
                px: 4,
                py: 1,
                fontSize: 15,
                textTransform: "none",
                "&:hover": { background: "#e0f7fa" },
              }}
            >
              Crear mi primer asistente
            </Button>
          </SoftBox>
          <SoftBox sx={{ fontSize: 120, lineHeight: 1, opacity: 0.3, userSelect: "none", display: { xs: "none", md: "block" } }}>
            🤖
          </SoftBox>
        </SoftBox>
      </Card>

      <Grid container spacing={3}>
        {/* Plan actual */}
        <Grid item xs={12} md={5}>
          <Card sx={{ p: 3, height: "100%", borderRadius: 3 }}>
            <SoftTypography variant="h6" fontWeight="bold" mb={2}>
              Tu plan actual
            </SoftTypography>
            <SoftBox display="flex" alignItems="center" gap={1} mb={2}>
              <SoftBox
                sx={{
                  background: "linear-gradient(90deg, #00bcd4, #006064)",
                  borderRadius: 2,
                  px: 2,
                  py: 0.5,
                }}
              >
                <SoftTypography variant="button" fontWeight="bold" sx={{ color: "#fff", textTransform: "uppercase" }}>
                  {plan?.name ?? "Sin plan"}
                </SoftTypography>
              </SoftBox>
              <SoftTypography variant="h5" fontWeight="bold" color="info">
                ${plan?.price ?? 0}
                <SoftTypography component="span" variant="caption" color="text">/mes</SoftTypography>
              </SoftTypography>
            </SoftBox>

            {/* Recurso: tokens */}
            {tokenLimit > 0 && (
              <SoftBox mb={2}>
                <SoftBox display="flex" justifyContent="space-between" mb={0.5}>
                  <SoftTypography variant="caption" fontWeight="medium">Tokens disponibles este mes</SoftTypography>
                  <SoftTypography variant="caption" color="info" fontWeight="bold">
                    {tokenLimit >= 1000 ? `${Math.round(tokenLimit / 1000)}K` : tokenLimit}
                  </SoftTypography>
                </SoftBox>
                <SoftBox sx={{ background: "#eee", borderRadius: 4, height: 6 }}>
                  <SoftBox sx={{ background: "#00bcd4", borderRadius: 4, height: 6, width: "0%", transition: "width 0.5s" }} />
                </SoftBox>
                <SoftTypography variant="caption" color="text">0% utilizado — sin actividad aún</SoftTypography>
              </SoftBox>
            )}

            <SoftTypography variant="caption" color="text" sx={{ fontStyle: "italic" }}>
              {plan?.description || "Comienza a automatizar la atención al cliente."}
            </SoftTypography>
          </Card>
        </Grid>

        {/* Qué incluye tu plan */}
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 3, height: "100%", borderRadius: 3 }}>
            <SoftTypography variant="h6" fontWeight="bold" mb={2}>
              Lo que incluye tu plan
            </SoftTypography>
            <Grid container spacing={1}>
              {features.map((f, i) => (
                <Grid item xs={12} sm={6} key={i}>
                  <SoftBox display="flex" alignItems="center" gap={1} py={0.5}>
                    <Icon sx={{ fontSize: 18, color: f.ok ? "#00bcd4" : "#ccc" }}>{f.icon}</Icon>
                    <SoftTypography
                      variant="caption"
                      sx={{ color: f.ok ? "#333" : "#bbb", textDecoration: f.ok ? "none" : "line-through", fontSize: 13 }}
                    >
                      {f.label}
                    </SoftTypography>
                  </SoftBox>
                </Grid>
              ))}
            </Grid>
          </Card>
        </Grid>

        {/* Qué verás cuando tengas bots */}
        <Grid item xs={12}>
          <Card sx={{ p: 3, borderRadius: 3, background: "#f9fafb" }}>
            <SoftTypography variant="h6" fontWeight="bold" mb={2}>
              Métricas que verás cuando actives tu asistente
            </SoftTypography>
            <Grid container spacing={2}>
              {[
                { icon: "chat", label: "Conversaciones", desc: "Cuántos chats inicia tu bot por día, semana y mes" },
                { icon: "people", label: "Captación de datos", desc: "Leads y datos recopilados de tus visitantes" },
                { icon: "verified", label: "Resolución", desc: "% de consultas resueltas sin intervención humana" },
                { icon: "trending_up", label: "Conversión", desc: "De cuántas conversaciones se captura un lead" },
                { icon: "memory", label: "Consumo de tokens", desc: "Uso real vs. límite de tu plan en tiempo real" },
                { icon: "speed", label: "Velocidad de respuesta", desc: "Latencia promedio del modelo de IA" },
              ].map((item, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <SoftBox display="flex" gap={1.5} alignItems="flex-start">
                    <SoftBox
                      sx={{ background: "#e0f7fa", borderRadius: 2, p: 0.8, display: "flex", alignItems: "center", flexShrink: 0 }}
                    >
                      <Icon sx={{ fontSize: 20, color: "#00838f" }}>{item.icon}</Icon>
                    </SoftBox>
                    <SoftBox>
                      <SoftTypography variant="button" fontWeight="medium" display="block">{item.label}</SoftTypography>
                      <SoftTypography variant="caption" color="text">{item.desc}</SoftTypography>
                    </SoftBox>
                  </SoftBox>
                </Grid>
              ))}
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </SoftBox>
  );
}

NoBotsDashboard.propTypes = { plan: PropTypes.object };

// ─── VISTA USUARIO / BOT OWNER ───────────────────────────────────────────────
function UserDashboard({ user }) {
  const [bots, setBots] = useState([]);
  const [selectedBotId, setSelectedBotId] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);

  // Cargar plan del usuario
  useEffect(() => {
    getMyPlan().then(setPlan).catch(() => {});
  }, []);

  // Cargar bots del usuario
  useEffect(() => {
    getMyBot()
      .then((bot) => {
        const list = Array.isArray(bot) ? bot.filter(Boolean) : (bot ? [bot] : []);
        setBots(list);
        if (list.length > 0) {
          setSelectedBotId(list[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  // Cargar stats del bot seleccionado
  useEffect(() => {
    if (!selectedBotId) return;
    setLoading(true);
    getBotStats(selectedBotId)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [selectedBotId]);

  if (loading) {
    return (
      <SoftBox display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </SoftBox>
    );
  }

  // Sin bots: mostrar dashboard de bienvenida con info del plan
  if (bots.length === 0) {
    return <NoBotsDashboard plan={plan} />;
  }

  // Gráfico: conversaciones por día
  const dailyLabels = (stats?.conversations?.daily || []).map((d) => {
    const dt = new Date(d.date);
    return `${dt.getDate()}/${dt.getMonth() + 1}`;
  });
  const dailyValues = (stats?.conversations?.daily || []).map((d) => d.count);
  const leadsDaily = (stats?.leads?.daily || []).map((d) => d.count);

  const conversationsChart = {
    labels: dailyLabels,
    datasets: [
      { label: "Conversaciones", color: "info", data: dailyValues },
      ...(leadsDaily.length > 0
        ? [{ label: "Leads capturados", color: "success", data: leadsDaily }]
        : []),
    ],
  };

  const tokenPct = stats?.performance?.tokenUsagePercent;

  return (
    <SoftBox py={3}>
      {/* Selector de bot */}
      {bots.length > 1 && (
        <SoftBox mb={3} display="flex" alignItems="center" gap={2}>
          <SoftTypography variant="button" fontWeight="medium">Asistente:</SoftTypography>
          <Select
            value={selectedBotId || ""}
            onChange={(e) => setSelectedBotId(e.target.value)}
            size="small"
            sx={{ minWidth: 220 }}
          >
            {bots.map((b) => (
              <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
            ))}
          </Select>
        </SoftBox>
      )}

      {!stats ? (
        <SoftBox p={3} sx={{ background: "#fff", borderRadius: 2, boxShadow: 1 }}>
          <SoftTypography color="text" variant="button">
            Sin actividad registrada aún para este asistente.
          </SoftTypography>
        </SoftBox>
      ) : (
        <>
          {stats.conversations?.thisMonth === 0 && (
            <SoftBox mb={3} p={2} sx={{
              background: "linear-gradient(90deg, #e3f2fd 0%, #f1f8ff 100%)",
              borderRadius: 2,
              border: "1px solid #bbdefb",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}>
              <Icon sx={{ color: "#1976d2", fontSize: 22 }}>info</Icon>
              <SoftTypography variant="button" color="text" fontWeight="regular">
                Tu asistente está activo. Las métricas aparecerán cuando reciba su primera conversación.
              </SoftTypography>
            </SoftBox>
          )}
          {/* Fila 1: Conversaciones y captación */}
          <SoftBox mb={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} xl={3}>
                <MiniStatisticsCard
                  title={{ text: "Conversaciones este mes" }}
                  count={stats.conversations.thisMonth}
                  percentage={{ color: deltaColor(stats.conversations.delta), text: deltaText(stats.conversations.delta) }}
                  icon={{ color: "info", component: "chat" }}
                />
              </Grid>
              <Grid item xs={12} sm={6} xl={3}>
                <MiniStatisticsCard
                  title={{ text: "Leads capturados" }}
                  count={stats.leads.thisMonth}
                  percentage={{ color: deltaColor(stats.leads.delta), text: deltaText(stats.leads.delta) }}
                  icon={{ color: "success", component: "people" }}
                />
              </Grid>
              <Grid item xs={12} sm={6} xl={3}>
                <MiniStatisticsCard
                  title={{ text: "Tasa de conversión" }}
                  count={`${stats.leads.conversionRatePercent}%`}
                  percentage={{ color: "text", text: "chats → leads" }}
                  icon={{ color: "info", component: "trending_up" }}
                />
              </Grid>
              <Grid item xs={12} sm={6} xl={3}>
                <MiniStatisticsCard
                  title={{ text: "Mensajes procesados" }}
                  count={stats.conversations.messagesThisMonth}
                  percentage={{ color: "text", text: "este mes" }}
                  icon={{ color: "info", component: "message" }}
                />
              </Grid>
            </Grid>
          </SoftBox>

          {/* Fila 2: Resolución y rendimiento */}
          <SoftBox mb={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} xl={3}>
                <MiniStatisticsCard
                  title={{ text: "Consultas resueltas" }}
                  count={stats.resolution.resolutionRatePercent != null ? `${stats.resolution.resolutionRatePercent}%` : "—"}
                  percentage={{
                    color: stats.resolution.resolutionRatePercent == null ? "text"
                      : stats.resolution.resolutionRatePercent >= 70 ? "success" : "warning",
                    text: stats.resolution.resolutionRatePercent == null ? "sin datos aún" : "de las conversaciones",
                  }}
                  icon={{ color: "success", component: "verified" }}
                />
              </Grid>
              <Grid item xs={12} sm={6} xl={3}>
                <MiniStatisticsCard
                  title={{ text: "Fuera de alcance" }}
                  count={stats.resolution.outOfScopeCount}
                  percentage={{
                    color: stats.resolution.outOfScopeRatePercent > 20 ? "warning" : "success",
                    text: `${stats.resolution.outOfScopeRatePercent}% del total`,
                  }}
                  icon={{ color: "warning", component: "help_outline" }}
                />
              </Grid>
              <Grid item xs={12} sm={6} xl={3}>
                <MiniStatisticsCard
                  title={{ text: "Tokens consumidos" }}
                  count={Number(stats.performance.tokensThisMonth).toLocaleString("es")}
                  percentage={{
                    color: tokenPct != null && tokenPct > 80 ? "warning" : "success",
                    text: tokenPct != null ? `${tokenPct}% del límite` : "Sin límite",
                  }}
                  icon={{ color: "info", component: "memory" }}
                />
              </Grid>
              <Grid item xs={12} sm={6} xl={3}>
                <MiniStatisticsCard
                  title={{ text: "Velocidad de respuesta" }}
                  count={`${stats.performance.avgResponseMs}ms`}
                  percentage={{
                    color: stats.performance.avgResponseMs > 5000 ? "warning" : "success",
                    text: stats.performance.avgResponseMs > 5000 ? "lento" : "óptimo",
                  }}
                  icon={{ color: "info", component: "speed" }}
                />
              </Grid>
            </Grid>
          </SoftBox>

          {/* Gráfico + resumen lateral */}
          {dailyValues.length > 0 && (
            <SoftBox mb={3}>
              <Grid container spacing={3}>
                <Grid item xs={12} lg={8}>
                  <GradientLineChart
                    title={`Actividad — ${stats.botName}`}
                    description={
                      <SoftTypography variant="button" color="text" fontWeight="regular">
                        Conversaciones y leads · últimos 30 días
                      </SoftTypography>
                    }
                    height="20rem"
                    chart={conversationsChart}
                  />
                </Grid>
                <Grid item xs={12} lg={4}>
                  <SoftBox p={3} sx={{ background: "#fff", borderRadius: 2, boxShadow: 1, height: "100%" }}>
                    <SoftTypography variant="h6" fontWeight="medium" mb={2}>Resumen del mes</SoftTypography>
                    {[
                      { label: "Conversaciones totales", value: stats.conversations.thisMonth },
                      { label: "Leads capturados", value: stats.leads.thisMonth },
                      { label: "Mensajes enviados", value: stats.conversations.messagesThisMonth },
                      { label: "Resueltas por el bot", value: stats.resolution.resolutionRatePercent != null ? `${stats.resolution.resolutionRatePercent}%` : "—" },
                      { label: "Fuera de alcance", value: stats.resolution.outOfScopeCount },
                    ].map((row, i) => (
                      <SoftBox key={i} display="flex" justifyContent="space-between" py={0.8}
                        sx={{ borderBottom: "1px solid #f0f0f0" }}>
                        <SoftTypography variant="caption" color="text">{row.label}</SoftTypography>
                        <SoftTypography variant="caption" fontWeight="bold">{row.value}</SoftTypography>
                      </SoftBox>
                    ))}
                  </SoftBox>
                </Grid>
              </Grid>
            </SoftBox>
          )}

          {/* Consumo del plan */}
          {tokenPct != null && (
            <SoftBox mb={3}>
              <Card sx={{ p: 3, borderRadius: 2 }}>
                <SoftTypography variant="h6" fontWeight="medium" mb={2}>
                  Consumo del plan este mes
                </SoftTypography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <SoftBox mb={0.5} display="flex" justifyContent="space-between">
                      <SoftTypography variant="button" fontWeight="medium">Tokens</SoftTypography>
                      <SoftTypography variant="button" color={tokenPct > 80 ? "error" : "info"} fontWeight="bold">
                        {Number(stats.performance.tokensThisMonth).toLocaleString("es")} / {Number(stats.performance.tokensLimit).toLocaleString("es")}
                      </SoftTypography>
                    </SoftBox>
                    <SoftBox sx={{ width: "100%", height: 8, borderRadius: 4, background: "#f0f0f0", overflow: "hidden" }}>
                      {tokenPct > 0 && (
                        <SoftBox sx={{
                          width: `${Math.min(tokenPct, 100)}%`,
                          height: "100%",
                          borderRadius: 4,
                          background: tokenPct > 80 ? "#f44336" : "#4caf50",
                          transition: "width 0.4s ease",
                        }} />
                      )}
                    </SoftBox>
                    <SoftTypography variant="caption" color={tokenPct > 80 ? "error" : "text"}>
                      {tokenPct}% utilizado
                      {tokenPct > 80 && " — considera actualizar tu plan"}
                    </SoftTypography>
                  </Grid>
                </Grid>
              </Card>
            </SoftBox>
          )}
        </>
      )}
    </SoftBox>
  );
}

UserDashboard.propTypes = {
  user: PropTypes.object,
};

// ─── DASHBOARD PRINCIPAL ──────────────────────────────────────────────────────
function Dashboard() {
  const { user } = useContext(AuthContext);
  const isAdmin = hasRole("Super Admin");

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={1}>
        <SoftTypography variant="h5" fontWeight="bold" mb={1}>
          {isAdmin ? "Panel de control — Negocio" : "Panel de control — Mi bot"}
        </SoftTypography>
      </SoftBox>
      {isAdmin ? <AdminDashboard /> : <UserDashboard user={user} />}
      <Footer />
    </DashboardLayout>
  );
}

export default Dashboard;
