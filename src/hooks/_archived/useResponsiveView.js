import { useState, useEffect } from 'react';

/**
 * 🎯 Hook para detectar automáticamente si es vista móvil
 * 
 * Usa SOLO el ancho del viewport (< 768px = móvil)
 * Esto es lo más confiable y evita falsos positivos con laptops con touch
 * 
 * Retorna: isMobileView (boolean)
 */
export const useResponsiveView = () => {
  const [isMobileView, setIsMobileView] = useState(() => {
    // SSR-safe: solo evaluar en cliente
    if (typeof window === 'undefined') return false;
    
    // Única métrica confiable: ancho del viewport
    return window.innerWidth < 768;
  });

  useEffect(() => {
    // Listener para cambios de viewport
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setIsMobileView(isMobile);
    };

    // Listener para cambios de orientación
    const handleOrientationChange = () => {
      // Pequeño delay para que el viewport se actualice
      setTimeout(() => {
        const isMobile = window.innerWidth < 768;
        setIsMobileView(isMobile);
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return isMobileView;
};

export default useResponsiveView;
