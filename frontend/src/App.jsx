import { useState, useEffect } from "react";

function App() {
  // 1. Core System Telemetry States
  const [history, setHistory] = useState([]);
  const [targets, setTargets] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. Input Form States for Registering New Targets
  const [targetName, setTargetName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState("");

  // 3. Define the core communication function to hit our /history API
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8000/history");

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      setHistory(data.history);
      console.log("Fetched history data:", data.targets);
      setTargets(data.targets || []);
      setTotalRecords(data.total_records);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch operational telemetry:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Submit a brand new target to our automated monitoring engine
  const handleAddTarget = async (e) => {
    e.preventDefault();
    if (!targetName || !targetUrl) return;

    try {
      setFormSubmitting(true);
      setFormMessage("");

      const response = await fetch("http://localhost:8000/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: targetName, url: targetUrl }),
      });

      if (!response.ok)
        throw new Error("Failed to register monitoring target.");

      const result = await response.json();
      setFormMessage(`✅ ${result.message}`);

      setTargetName("");
      setTargetUrl("");

      // Refresh to pull updated dynamic entries immediately
      fetchDashboardData();
    } catch (err) {
      setFormMessage(`❌ Error: ${err.message}`);
    } finally {
      setFormSubmitting(false);
    }
  };

  // 5. Handle administrative target deletion routing
  const handleDeleteTarget = async (targetId) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this target from continuous monitoring?",
      )
    )
      return;

    try {
      const response = await fetch(
        `http://localhost:8000/targets/${targetId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete target.");
      }

      fetchDashboardData();
      setFormMessage(
        "🗑️ Target successfully purged from infrastructure loops.",
      );
    } catch (err) {
      console.error("Deletion failure:", err);
      alert(`Operation Failed: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Trigger the data fetch automatically on mount AND set an automated heartbeat poll
  useEffect(() => {
    // 1. Run the initial data query immediately when the dashboard mounts
    fetchDashboardData();

    // 2. Spawn a background interval to fetch fresh data every 10 seconds
    const telemetryInterval = setInterval(() => {
      console.log("🔄 [POLLING] Dashboard pulling fresh database snapshots...");
      fetchDashboardData();
    }, 10000); // 10000 milliseconds = 10 seconds

    // 3. CRITICAL CLEANUP: Clear the interval if the user leaves the page to prevent memory leaks
    return () => clearInterval(telemetryInterval);
  }, []);

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

      {/* Split Configuration Layout Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: "2rem",
          alignItems: "start",
        }}
      >
        {/* Left Column: Management Panels */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Add Target UI Form Card */}
          <div
            style={{
              backgroundColor: "white",
              padding: "1.5rem",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h2
              style={{
                margin: "0 0 1rem 0",
                fontSize: "1.25rem",
                color: "#1e293b",
              }}
            >
              Register New Target
            </h2>
            <form
              onSubmit={handleAddTarget}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.35rem",
                    color: "#475569",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                  }}
                >
                  Friendly Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Corporate API Gateway"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.65rem",
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.35rem",
                    color: "#475569",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                  }}
                >
                  Endpoint URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.65rem",
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={formSubmitting}
                style={{
                  padding: "0.75rem",
                  backgroundColor: "#0f172a",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                {formSubmitting ? "Registering..." : "Add to Monitoring Loop"}
              </button>
            </form>
            {formMessage && (
              <p
                style={{
                  marginTop: "1rem",
                  fontSize: "0.875rem",
                  color: "#334155",
                  fontWeight: "500",
                }}
              >
                {formMessage}
              </p>
            )}
          </div>

          {/* Active Registries Configuration Dashboard */}
          <div
            style={{
              backgroundColor: "white",
              padding: "1.5rem",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h2
              style={{
                margin: "0 0 1rem 0",
                fontSize: "1.25rem",
                color: "#1e293b",
              }}
            >
              Active Registries
            </h2>
            {targets.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
                No targets registered in database.
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {targets.map((target) => (
                  <div
                    key={target.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.5rem 0",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontWeight: "500",
                          color: "#0f172a",
                          display: "block",
                        }}
                      >
                        {target.name}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        {target.url}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteTarget(target.id)}
                      style={{
                        padding: "0.25rem 0.5rem",
                        backgroundColor: "#fee2e2",
                        color: "#dc2626",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Main Chronological Logs Table */}
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
            <p
              style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}
            >
              Querying persistent data tier...
            </p>
          )}
          {error && (
            <p
              style={{ padding: "2rem", textAlign: "center", color: "#dc2626" }}
            >
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
                  <th style={{ padding: "1rem" }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {history.map((log) => (
                  <tr
                    key={log.id}
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                  >
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
                          color:
                            log.status === "ONLINE" ? "#16a34a" : "#dc2626",
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
    </div>
  );
}

export default App;
