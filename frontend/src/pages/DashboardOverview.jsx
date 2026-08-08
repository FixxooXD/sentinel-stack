import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function DashboardOverview() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [targets, setTargets] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);

  const [targetName, setTargetName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/history`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
        setTargets(data.targets || []);
        setTotalRecords(data.total_records || 0);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAddTarget = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/targets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: targetName, url: targetUrl }),
      });
      if (res.ok) {
        setTargetName("");
        setTargetUrl("");
        await fetchDashboardData();
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteTarget = async (e, targetId) => {
    e.stopPropagation(); // Prevents clicking delete from navigating to insights
    if (!window.confirm("Remove target from monitoring?")) return;
    await fetch(`${API_BASE_URL}/targets/${targetId}`, {
      method: "DELETE",
    });
    fetchDashboardData();
  };

  const calculateUptime = () => {
    if (history.length === 0) return 0;
    const onlineCount = history.filter((l) => l.status === "ONLINE").length;
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
            Live Infrastructure Operational Overview
          </p>
        </div>
      </header>

      {/* Top Metrics Row */}
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
          <span
            style={{
              color: "#64748b",
              fontSize: "0.875rem",
              textTransform: "uppercase",
            }}
          >
            System Global Uptime
          </span>
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
          <span
            style={{
              color: "#64748b",
              fontSize: "0.875rem",
              textTransform: "uppercase",
            }}
          >
            Active Monitored Targets
          </span>
          <p
            style={{
              margin: "0.5rem 0 0 0",
              fontSize: "2.25rem",
              fontWeight: "bold",
              color: "#1e293b",
            }}
          >
            {targets.length}
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: "2rem",
          alignItems: "start",
        }}
      >
        {/* Left: Register Target */}
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
            <input
              type="text"
              placeholder="Friendly Name (e.g. Auth Gateway)"
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
              required
              style={{
                padding: "0.65rem",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
              }}
            />
            <input
              type="url"
              placeholder="https://example.com"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              required
              style={{
                padding: "0.65rem",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
              }}
            />
            <button
              type="submit"
              disabled={formSubmitting}
              style={{
                padding: "0.75rem",
                backgroundColor: "#0f172a",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {formSubmitting ? "Registering..." : "Add Target"}
            </button>
          </form>
        </div>

        {/* Right: Target Status Cards Grid */}
        <div>
          <h2
            style={{
              margin: "0 0 1rem 0",
              fontSize: "1.25rem",
              color: "#1e293b",
            }}
          >
            Monitored Target Nodes
          </h2>
          {targets.length === 0 ? (
            <p style={{ color: "#64748b" }}>No active targets found.</p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "1rem",
              }}
            >
              {targets.map((target) => {
                // Find latest log for status tag
                const latestLog = history.find((h) => h.target === target.url);
                const isOnline = latestLog
                  ? latestLog.status === "ONLINE"
                  : true;

                return (
                  <div
                    key={target.id}
                    onClick={() => navigate(`/targets/${target.id}`)}
                    style={{
                      backgroundColor: "white",
                      padding: "1.25rem",
                      borderRadius: "8px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      cursor: "pointer",
                      borderLeft: `5px solid ${isOnline ? "#16a34a" : "#dc2626"}`,
                      transition: "transform 0.1s ease-in-out",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "1.1rem",
                            color: "#0f172a",
                          }}
                        >
                          {target.name}
                        </h3>
                        <p
                          style={{
                            margin: "0.25rem 0 0 0",
                            fontSize: "0.8rem",
                            color: "#64748b",
                          }}
                        >
                          {target.url}
                        </p>
                      </div>
                      <span
                        style={{
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.7rem",
                          fontWeight: "bold",
                          backgroundColor: isOnline ? "#dcfce7" : "#fee2e2",
                          color: isOnline ? "#16a34a" : "#dc2626",
                        }}
                      >
                        {isOnline ? "ONLINE" : "OFFLINE"}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "1.5rem",
                      }}
                    >
                      <Link
                        to={`/targets/${target.id}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          fontSize: "0.85rem",
                          color: "#2563eb",
                          fontWeight: "bold",
                          textDecoration: "none",
                        }}
                      >
                        View Insights →
                      </Link>
                      <button
                        onClick={(e) => handleDeleteTarget(e, target.id)}
                        style={{
                          padding: "0.25rem 0.5rem",
                          backgroundColor: "#fee2e2",
                          color: "#dc2626",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
