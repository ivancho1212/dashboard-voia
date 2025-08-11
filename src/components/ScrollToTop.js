import { useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const params = useParams();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [pathname, JSON.stringify(params)]);

  return null;
};

export default ScrollToTop;
