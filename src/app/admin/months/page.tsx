"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Decimal from "decimal.js";

interface Month {
  id: string;
  year: number;
  month: number;
  status: "ACTIVE" | "CLOSED";
  deposits: Deposit[];
  expenses: any[];
  createdAt: string;
}

interface Deposit {
  id: string;
  userId: string;
  amount: Decimal | string | number;
  user: { id: string; displayName: string; username: string };
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#1976d2",
    color: "white",
    padding: "24px 20px",
    marginBottom: "24px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  headerContent: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  backButton: {
    padding: "8px 12px",
    backgroundColor: "rgba(255,255,255,0.2)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "12px",
    fontSize: "14px",
  },
  headerTitle: {
    marginTop: "0",
    marginBottom: "0",
    fontSize: "28px",
    fontWeight: "600",
  },
  content: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 20px 40px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    marginBottom: "24px",
  },
  formSection: {
    marginBottom: "24px",
    borderBottom: "2px solid #e0e0e0",
    paddingBottom: "24px",
  },
  formTitle: {
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: "16px",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "16px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column" as const,
  },
  formLabel: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "8px",
    color: "#333",
  },
  formInput: {
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px",
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeader: {
    backgroundColor: "#f8f9fa",
    borderBottom: "2px solid #e0e0e0",
  },
  tableHeaderCell: {
    padding: "12px",
    textAlign: "left",
    fontWeight: "600",
    fontSize: "14px",
  },
  tableRow: {
    borderBottom: "1px solid #f0f0f0",
  },
  tableCell: {
    padding: "12px",
    fontSize: "14px",
  },
  actionButton: {
    padding: "6px 12px",
    marginRight: "8px",
    fontSize: "13px",
    fontWeight: "500",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  manageButton: {
    backgroundColor: "#1976d2",
    color: "white",
  },
  closeButton: {
    backgroundColor: "#F44336",
    color: "white",
  },
  statusBadge: {
    padding: "6px 12px",
    borderRadius: "4px",
    fontSize: "13px",
    fontWeight: "600",
  },
  emptyMessage: {
    padding: "40px 20px",
    textAlign: "center",
    color: "#999",
  },
};

export default function AdminMonthsPage() {
  const router = useRouter();
  const [months, setMonths] = useState<Month[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newMonth, setNewMonth] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });

  useEffect(() => {
    fetchMonths();
  }, []);

  async function fetchMonths() {
    try {
      const res = await fetch("/api/months");
      const data = await res.json();
      const sorted = (data.months || []).sort((a: Month, b: Month) => b.year - a.year || b.month - a.month);
      setMonths(sorted);
    } catch (err) {
      console.error("Failed to fetch months:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartMonth() {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/months", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMonth),
      });
      if (res.ok) {
        alert("Month created successfully");
        fetchMonths();
        setNewMonth({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
      } else {
        const data = await res.json();
        alert(data.error || "Failed to start month");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Error starting month");
    } finally {
      setCreating(false);
    }
  }

  async function handleCloseMonth(monthId: string) {
    if (!confirm("Close this month? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/months/${monthId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthId }),
      });
      if (res.ok) {
        alert("Month closed successfully");
        fetchMonths();
      } else {
        alert("Failed to close month");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Error closing month");
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.headerContent}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <button onClick={() => router.back()} style={styles.backButton}>
            ← Back
          </button>
          <h1 style={styles.headerTitle}>📅 Monthly Management</h1>
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Start New Month Card */}
        <div style={styles.card}>
          <div style={styles.formSection}>
            <h2 style={styles.formTitle}>➕ Start New Month</h2>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Year</label>
                <input
                  type="number"
                  value={newMonth.year}
                  onChange={(e) => setNewMonth({ ...newMonth, year: parseInt(e.target.value) })}
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Month (1-12)</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={newMonth.month}
                  onChange={(e) => setNewMonth({ ...newMonth, month: parseInt(e.target.value) })}
                  style={styles.formInput}
                />
              </div>
            </div>
            <button
              onClick={handleStartMonth}
              disabled={creating}
              style={styles.button}
            >
              {creating ? "Creating..." : "✓ Start Month"}
            </button>
          </div>
        </div>

        {/* Months List */}
        <div style={styles.card}>
          <h2 style={{ ...styles.formTitle, borderBottom: "2px solid #e0e0e0", paddingBottom: "16px", marginBottom: "16px" }}>
            📋 All Months
          </h2>

          {months.length === 0 ? (
            <div style={styles.emptyMessage as React.CSSProperties}>No months yet. Start a new month to begin.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table as React.CSSProperties}>
                <thead style={styles.tableHeader as React.CSSProperties}>
                  <tr>
                    <th style={styles.tableHeaderCell as React.CSSProperties}>Month</th>
                    <th style={styles.tableHeaderCell as React.CSSProperties}>Status</th>
                    <th style={styles.tableHeaderCell as React.CSSProperties}>Deposits</th>
                    <th style={styles.tableHeaderCell as React.CSSProperties}>Expenses</th>
                    <th style={styles.tableHeaderCell as React.CSSProperties}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((month) => (
                    <tr key={month.id} style={styles.tableRow as React.CSSProperties}>
                      <td style={styles.tableCell as React.CSSProperties}>
                        <div style={{ fontWeight: "600" }}>
                          {month.year}-{month.month.toString().padStart(2, "0")}
                        </div>
                      </td>
                      <td style={styles.tableCell as React.CSSProperties}>
                        <span
                          style={{
                            ...styles.statusBadge,
                            backgroundColor: month.status === "ACTIVE" ? "#E8F5E9" : "#F5F5F5",
                            color: month.status === "ACTIVE" ? "#2E7D32" : "#666",
                          } as React.CSSProperties}
                        >
                          {month.status}
                        </span>
                      </td>
                      <td style={styles.tableCell as React.CSSProperties}>{month.deposits.length} members</td>
                      <td style={styles.tableCell as React.CSSProperties}>{month.expenses.length} expenses</td>
                      <td style={styles.tableCell as React.CSSProperties}>
                        <button
                          onClick={() => router.push(`/admin/months/${month.id}`)}
                          style={{
                            ...styles.actionButton,
                            ...styles.manageButton,
                          }}
                        >
                          Manage
                        </button>
                        {month.status === "ACTIVE" && (
                          <button
                            onClick={() => handleCloseMonth(month.id)}
                            style={{
                              ...styles.actionButton,
                              ...styles.closeButton,
                            }}
                          >
                            Close
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
