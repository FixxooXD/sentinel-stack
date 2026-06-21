import { useState, useEffect } from "react";

function App() {
  // 1. Establish state variables to hold data, loading state, and errors
  const [history, setHistory] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. Define the core communication function to hit our /history API
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8000/history");

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      setHistory(data.history);
      setTotalRecords(data.total_records);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch operational telemetry:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Trigger the data fetch automatically the moment the page loads
  useEffect(() => {
    fetchDashboardData();
  }, []); // Empty dependency array means "run once on initial mount"

  // 4. Calculate real-time Uptime Percentage on the fly (No Vibe Coding!)
  const calculateUptime = () => {
    if (history.length === 0) return 0;
    const onlineCount = history.filter((log) => log.status === "ONLINE").length;
    return ((onlineCount / history.length) * 100).toFixed(1);
  };

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "sans-serif",
        backgroundColor: "#f4f6f8",
        minHeight: "100vh",
      }}
    >
      <header
        style={{
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ margin: 0, color: "#1e293b" }}>
            SentinelStack Command Center
          </h1>
          <p style={{ margin: "0.5rem 0 0 0", color: "#64748b" }}>
            Real-time core network infrastructure telemetry
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Refresh Telemetry
        </button>
      </header>

      {/* Analytics Summary Cards Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: "1.5rem",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              margin: 0,
              color: "#64748b",
              fontSize: "0.875rem",
              textTransform: "uppercase",
            }}
          >
            System Global Uptime
          </h3>
          <p
            style={{
              margin: "0.5rem 0 0 0",
              fontSize: "2.25rem",
              fontWeight: "bold",
              color: "#16a34a",
            }}
          >
            {calculateUptime()}%
          </p>
        </div>
        <div
          style={{
            backgroundColor: "white",
            padding: "1.5rem",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              margin: 0,
              color: "#64748b",
              fontSize: "0.875rem",
              textTransform: "uppercase",
            }}
          >
            Total Logged Checkpoints
          </h3>
          <p
            style={{
              margin: "0.5rem 0 0 0",
              fontSize: "2.25rem",
              fontWeight: "bold",
              color: "#1e293b",
            }}
          >
            {totalRecords}
          </p>
        </div>
      </div>

      {/* Main Historical Logs Table */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "1.5rem", borderBottom: "1px solid #e2e8f0" }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#1e293b" }}>
            Chronological Time-Series Records
          </h2>
        </div>

        {loading && (
          <p style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
            Querying persistent data tier...
          </p>
        )}
        {error && (
          <p style={{ padding: "2rem", textAlign: "center", color: "#dc2626" }}>
            Operational Error: {error}
          </p>
        )}

        {!loading && !error && (
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
                <th style={{ padding: "1rem" }}>Target Host</th>
                <th style={{ padding: "1rem" }}>Operational Status</th>
                <th style={{ padding: "1rem" }}>HTTP Gateway Code</th>
                <th style={{ padding: "1rem" }}>Network Latency</th>
                <th style={{ padding: "1rem" }}>Timestamp (UTC)</th>
              </tr>
            </thead>
            <tbody>
              {history.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td
                    style={{
                      padding: "1rem",
                      fontWeight: "500",
                      color: "#0f172a",
                    }}
                  >
                    {log.target}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        padding: "0.25rem 0.5rem",
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
                  <td style={{ padding: "1rem", color: "#475569" }}>
                    {log.http_status}
                  </td>
                  <td style={{ padding: "1rem", color: "#475569" }}>
                    {log.latency_ms ? `${log.latency_ms} ms` : "—"}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      color: "#94a3b8",
                      fontSize: "0.875rem",
                    }}
                  >
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;
