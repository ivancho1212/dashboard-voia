import { useState, useEffect, useRef } from "react";
import { API_URL } from "config/environment";

// Cache en memoria para evitar múltiples fetches en la misma sesión
let _cachedFeatures = null;
let _cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

const DEFAULT_FEATURES = {
  allowCustomTheme: true,
  allowMobileVersion: true,
  analyticsDashboard: false,
  customStyles: true,
  allowTrainingUrls: true,
  fileUploadLimit: null,
  dataCaptureLimit: null,
  maxTokens: 0,
  tokensUsedThisMonth: 0,
};

/**
 * Hook que retorna los feature flags del plan activo del usuario.
 * Hace un fetch a /api/subscriptions/me y cachea el resultado en memoria 5 min.
 * Si el usuario no tiene plan activo, retorna los defaults (permisivos = true).
 */
export default function usePlanFeatures() {
  const [features, setFeatures] = useState(_cachedFeatures ?? DEFAULT_FEATURES);
  const [loading, setLoading] = useState(!_cachedFeatures);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const now = Date.now();
    if (_cachedFeatures && now - _cacheTimestamp < CACHE_TTL_MS) {
      setFeatures(_cachedFeatures);
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/subscriptions/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mountedRef.current) return;
        if (data && data.planId) {
          const f = {
            allowCustomTheme: data.planAllowCustomTheme ?? true,
            allowMobileVersion: data.planAllowMobileVersion ?? true,
            analyticsDashboard: data.planAnalyticsDashboard ?? false,
            customStyles: data.planCustomStyles ?? true,
            allowTrainingUrls: data.planAllowTrainingUrls ?? true,
            fileUploadLimit: data.planFileUploadLimit ?? null,
            dataCaptureLimit: data.planDataCaptureLimit ?? null,
            maxTokens: data.planMaxTokens ?? 0,
            tokensUsedThisMonth: data.tokensUsedThisMonth ?? 0,
          };
          _cachedFeatures = f;
          _cacheTimestamp = Date.now();
          setFeatures(f);
        }
        setLoading(false);
      })
      .catch(() => {
        if (mountedRef.current) setLoading(false);
      });
  }, []);

  return { features, loading };
}
