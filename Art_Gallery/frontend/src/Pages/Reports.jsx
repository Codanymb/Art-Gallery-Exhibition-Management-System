import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Chart, ArcElement, Tooltip, Legend, PieController } from "chart.js";

Chart.register(ArcElement, Tooltip, Legend, PieController);

const Reports = () => {
  const [exRegData, setExRegData] = useState([]);
  const [artAvailabilityData, setArtAvailabilityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const exRegChartRef = useRef(null);
  const artAvailChartRef = useRef(null);
  const exRegChart = useRef(null);
  const artAvailChart = useRef(null);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28BFE", "#FF6B6B"];

  // Fetch backend data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const exRegResponse = await axios.get("http://localhost:3000/api/reports/exhibition-registrations");
        const artAvailResponse = await axios.get("http://localhost:3000/api/reports/art-availability");

        setExRegData(exRegResponse.data);
        setArtAvailabilityData(artAvailResponse.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Render Exhibition Registrations chart
  useEffect(() => {
    if (exRegChartRef.current && exRegData.length) {
      if (exRegChart.current) exRegChart.current.destroy();

      const ctx = exRegChartRef.current.getContext("2d");
      exRegChart.current = new Chart(ctx, {
        type: "pie",
        data: {
          labels: exRegData.map(item => item.ex_category),
          datasets: [{
            data: exRegData.map(item => item.total_registrations),
            backgroundColor: COLORS.slice(0, exRegData.length),
            borderWidth: 2,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom" },
            tooltip: {
              callbacks: {
                label: context => {
                  const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                  const percentage = ((context.parsed / total) * 100).toFixed(1);
                  return `${context.label}: ${percentage}%`;
                }
              }
            }
          }
        }
      });
    }
  }, [exRegData]);

  // Render Art Availability chart
  useEffect(() => {
    if (artAvailChartRef.current && artAvailabilityData.length) {
      if (artAvailChart.current) artAvailChart.current.destroy();

      const ctx = artAvailChartRef.current.getContext("2d");
      artAvailChart.current = new Chart(ctx, {
        type: "pie",
        data: {
          labels: artAvailabilityData.map(item => item.category),
          datasets: [{
            data: artAvailabilityData.map(item => item.available_artworks),
            backgroundColor: COLORS.slice(0, artAvailabilityData.length),
            borderWidth: 2,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom" },
            tooltip: {
              callbacks: {
                label: context => {
                  const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                  const percentage = ((context.parsed / total) * 100).toFixed(1);
                  return `${context.label}: ${percentage}%`;
                }
              }
            }
          }
        }
      });
    }
  }, [artAvailabilityData]);

  // Cleanup charts on unmount
  useEffect(() => {
    return () => {
      if (exRegChart.current) exRegChart.current.destroy();
      if (artAvailChart.current) artAvailChart.current.destroy();
    };
  }, []);

  if (loading) return <p>Loading reports data...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Reports Dashboard</h1>

      <div style={{ marginBottom: "40px", height: "400px" }}>
        <h2>Exhibition Registrations by Category</h2>
        {exRegData.length ? <canvas ref={exRegChartRef} /> : <p>No data available</p>}
      </div>

      <div style={{ marginBottom: "40px", height: "400px" }}>
        <h2>Art Piece Availability by Category</h2>
        {artAvailabilityData.length ? <canvas ref={artAvailChartRef} /> : <p>No data available</p>}
      </div>
    </div>
  );
};

export default Reports;
