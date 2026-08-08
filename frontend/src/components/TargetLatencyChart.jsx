import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 💡 Helper function to force JavaScript to interpret the backend string as UTC
const formatLocalTime = (isoString) => {
  if (!isoString) return "";

  // Append "Z" if it's missing to ensure the browser knows it's a UTC timestamp
  const utcString =
    isoString.endsWith("Z") || isoString.includes("+")
      ? isoString
      : `${isoString}Z`;

  return new Date(utcString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export default function TargetLatencyChart({ targetId, targetUrl }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/targets/${targetId}/history`,
      );
      if (response.ok) {
        const data = await response.json();

        // 💡 Format timestamps using the UTC-safe helper function
        const formattedData = data.history.map((log) => ({
          ...log,
          timeLabel: formatLocalTime(log.timestamp),
        }));

        setHistory(formattedData);
      }
    } catch (error) {
      console.error("Failed to fetch latency history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // Auto-refresh the chart data every 15 seconds
    const interval = setInterval(fetchHistory, 15000);
    return () => clearInterval(interval);
  }, [targetId]);

  if (loading) {
    return (
      <div className="p-4 text-gray-500">Loading latency telemetry...</div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 my-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{targetUrl}</h3>
          <p className="text-xs text-gray-400">
            Time-Series Latency Metrics (ms)
          </p>
        </div>
        <button
          onClick={fetchHistory}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "rgb(80, 165, 54)",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Refresh Now
        </button>
      </div>

      {history.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">
          No historical ping logs recorded yet.
        </p>
      ) : (
        <div style={{ width: "100%", height: 250 }}>
          <ResponsiveContainer>
            <LineChart
              data={history}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E5E7EB"
              />
              <XAxis dataKey="timeLabel" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} unit="ms" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                itemStyle={{ color: "#10B981" }}
                formatter={(value) => [`${value} ms`, "Latency"]}
              />
              <Line
                type="monotone"
                dataKey="latency_ms"
                stroke="#009688"
                strokeWidth={2}
                dot={{ r: 3, fill: "#009688" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
