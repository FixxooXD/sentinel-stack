import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TargetLatencyChart from "../components/TargetLatencyChart";

// 💡 Helper function to force JavaScript to interpret the backend string as UTC
const formatLocalTime = (isoString) => {
  if (!isoString) return "—";

  // Append "Z" if it's missing to ensure the browser knows it's a UTC timestamp
  const utcString =
    isoString.endsWith("Z") || isoString.includes("+")
      ? isoString
      : `${isoString}Z`;

  return new Date(utcString).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export default function TargetInsights() {
  const { targetId } = useParams();
  const navigate = useNavigate();

  const [targetData, setTargetData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/targets/${targetId}/history`,
      );
      if (!response.ok) {
        throw new Error("Target not found or failed to load history.");
      }
      const data = await response.json();
      setTargetData(data);
      setLogs(data.history || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
    const interval = setInterval(fetchInsights, 15000);
    return () => clearInterval(interval);
  }, [targetId]);

  if (loading && !targetData) {
    return <div style={{ padding: "2rem" }}>Loading target telemetry...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "2rem" }}>
        <button onClick={() => navigate("/")}>← Back to Dashboard</button>
        <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>
      </div>
    );
  }

  // Calculate high-level stats for this specific target
  const onlineCount = logs.filter((l) => l.status === "ONLINE").length;
  const uptimePct =
    logs.length > 0 ? ((onlineCount / logs.length) * 100).toFixed(1) : 0;

  const latencies = logs.map((l) => l.latency_ms).filter((l) => l !== null);
  const avgLatency =
    latencies.length > 0
      ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1)
      : 0;
  const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "sans-serif",
        backgroundColor: "#f4f6f8",
        minHeight: "100vh",
      }}
    >
      {/* Navigation Header */}
      <button
        onClick={() => navigate("/")}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#0f172a",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontWeight: "bold",
          marginBottom: "1.5rem",
        }}
      >
        ← Back to Overview
      </button>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h1 style={{ margin: 0, color: "#1e293b" }}>
            {targetData.target_name}
          </h1>
          <p style={{ margin: "0.25rem 0 0 0", color: "#64748b" }}>
            {targetData.target_url}
          </p>
        </div>
        <button
          onClick={fetchInsights}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Refresh Now
        </button>
      </div>

      {/* Target Metric Highlights */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: "1.25rem",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              color: "#64748b",
              textTransform: "uppercase",
            }}
          >
            Target Uptime
          </span>
          <p
            style={{
              margin: "0.5rem 0 0 0",
              fontSize: "1.8rem",
              fontWeight: "bold",
              color: "#16a34a",
            }}
          >
            {uptimePct}%
          </p>
        </div>
        <div
          style={{
            backgroundColor: "white",
            padding: "1.25rem",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              color: "#64748b",
              textTransform: "uppercase",
            }}
          >
            Avg Latency
          </span>
          <p
            style={{
              margin: "0.5rem 0 0 0",
              fontSize: "1.8rem",
              fontWeight: "bold",
              color: "#1e293b",
            }}
          >
            {avgLatency} ms
          </p>
        </div>
        <div
          style={{
            backgroundColor: "white",
            padding: "1.25rem",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              color: "#64748b",
              textTransform: "uppercase",
            }}
          >
            Peak Latency Spike
          </span>
          <p
            style={{
              margin: "0.5rem 0 0 0",
              fontSize: "1.8rem",
              fontWeight: "bold",
              color: "#dc2626",
            }}
          >
            {maxLatency} ms
          </p>
        </div>
      </div>

      {/* Interactive Line Chart */}
      <TargetLatencyChart
        targetId={targetId}
        targetUrl={targetData.target_url}
      />

      {/* Target Log Table */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          marginTop: "2rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        <div
          style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #e2e8f0" }}
        >
          <h3 style={{ margin: 0, color: "#1e293b" }}>Target Execution Logs</h3>
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <th style={{ padding: "0.75rem 1rem" }}>Status</th>
              <th style={{ padding: "0.75rem 1rem" }}>HTTP Code</th>
              <th style={{ padding: "0.75rem 1rem" }}>Latency</th>
              <th style={{ padding: "0.75rem 1rem" }}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <span
                    style={{
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      backgroundColor:
                        log.status === "ONLINE" ? "#dcfce7" : "#fee2e2",
                      color: log.status === "ONLINE" ? "#16a34a" : "#dc2626",
                    }}
                  >
                    {log.status}
                  </span>
                </td>
                <td style={{ padding: "0.75rem 1rem", color: "#475569" }}>
                  {log.http_status}
                </td>
                <td style={{ padding: "0.75rem 1rem", color: "#475569" }}>
                  {log.latency_ms ? `${log.latency_ms} ms` : "—"}
                </td>
                <td
                  style={{
                    padding: "0.75rem 1rem",
                    color: "#94a3b8",
                    fontSize: "0.85rem",
                  }}
                >
                  {/* 💡 Applied the helper function right here! */}
                  {formatLocalTime(log.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
