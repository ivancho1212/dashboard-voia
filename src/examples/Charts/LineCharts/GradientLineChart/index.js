/**
=========================================================
* Soft UI Dashboard React - v4.0.1
=// Typechecking props for the GradientLineChart
GradientLineChart.propTypes = {
  title: PropTypes.string,
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  height: PropTypes.string,
  chart: PropTypes.objectOf(PropTypes.array).isRequired,
};==========================================

* Product Page: https://www.creative-tim.com/product/soft-ui-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useRef, useEffect, useState } from "react";

// porp-types is a library for typechecking of props
import PropTypes from "prop-types";

// chart.js
import Chart from 'chart.js/auto';
import {
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// @mui material components
import Card from "@mui/material/Card";

// Soft UI Dashboard React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

// Soft UI Dashboard React helper functions
import gradientChartLine from "assets/theme/functions/gradientChartLine";

// GradientLineChart configurations
import configs from "examples/Charts/LineCharts/GradientLineChart/configs";

// Soft UI Dashboard React base styles
import colors from "assets/theme/base/colors";

function GradientLineChart({ title, description, height = "19.125rem", chart }) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [chartData, setChartData] = useState({});
  const { data, options } = chartData;

  useEffect(() => {
    // Cleanup function to destroy chart instance
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const initChart = async () => {
      if (chartRef.current && chartRef.current.children[0]) {
        const chartDatasets = chart.datasets
          ? chart.datasets.map((dataset) => ({
              ...dataset,
              tension: 0.4,
              pointRadius: 0,
              borderWidth: 3,
              borderColor: colors[dataset.color]
                ? colors[dataset.color || "dark"].main
                : colors.dark.main,
              fill: true,
              maxBarThickness: 6,
              backgroundColor: gradientChartLine(
                chartRef.current.children[0],
                colors[dataset.color] ? colors[dataset.color || "dark"].main : colors.dark.main
              ),
            }))
          : [];

        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
        }

        const ctx = chartRef.current.children[0].getContext('2d');
        const newChartData = configs(chart.labels || [], chartDatasets);
        setChartData(newChartData);

        chartInstanceRef.current = new Chart(ctx, {
          type: 'line',
          data: newChartData.data,
          options: newChartData.options
        });
      }
    };

    initChart();
  }, [chart]);

  const renderChart = (
    <SoftBox p={2}>
      {title || description ? (
        <SoftBox px={description ? 1 : 0} pt={description ? 1 : 0}>
          {title && (
            <SoftBox mb={1}>
              <SoftTypography variant="h6">{title}</SoftTypography>
            </SoftBox>
          )}
          <SoftBox mb={2}>
            <SoftTypography component="div" variant="button" fontWeight="regular" color="text">
              {description}
            </SoftTypography>
          </SoftBox>
        </SoftBox>
      ) : null}
      <SoftBox ref={chartRef} sx={{ height }}>
        <canvas />
      </SoftBox>
    </SoftBox>
  );

  return title || description ? <Card>{renderChart}</Card> : renderChart;
}

// Typechecking props for the GradientLineChart
GradientLineChart.propTypes = {
  title: PropTypes.string,
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  chart: PropTypes.objectOf(PropTypes.array).isRequired,
};

export default GradientLineChart;
