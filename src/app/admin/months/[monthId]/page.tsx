"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Decimal from "decimal.js";

interface User {
  id: string;
  displayName: string;
  username: string;
  isActive: boolean;
}

interface Deposit {
  id: string;
  userId: string;
  monthId: string;
  amount: string;
  user: { id: string; displayName: string; username: string };
}

interface Month {
  id: string;
  year: number;
  month: number;
  status: "ACTIVE" | "CLOSED";
  deposits: Deposit[];
  expenses: any[];
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
    maxWidth: "900px",
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
    maxWidth: "900px",
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
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: "16px",
    paddingBottom: "12px",
  },
  description: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "16px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "16px",
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
  inputField: {
    padding: "8px 12px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px",
    width: "120px",
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
  alertBox: (type: string) => ({
    padding: "16px",
    borderRadius: "8px",
    borderLeft: `4px solid ${type === "warning" ? "#FFC107" : "#4CAF50"}`,
    backgroundColor: type === "warning" ? "#FFF8E1" : "#E8F5E9",
    marginTop: "16px",
  }),
  emptyMessage: {
    padding: "20px",
    textAlign: "center",
    color: "#999",
    fontSize: "14px",
  },
};

export default function MonthDetailPage({ params }: { params: Promise<{ monthId: string }> }) {
  const router = useRouter();
  const { monthId } = use(params);
  const [month, setMonth] = useState<Month | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deposits, setDeposits] = useState<{ [userId: string]: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [monthId]);

  async function fetchData() {
    try {
      const [monthRes, usersRes, depositsRes] = await Promise.all([
        fetch(`/api/months/${monthId}`),
        fetch("/api/users"),
        fetch(`/api/deposits?monthId=${monthId}`),
      ]);

      const monthData = await monthRes.json();
      const usersData = await usersRes.json();
      const depositsData = await depositsRes.json();

      setMonth(monthData.month);
      setUsers((usersData.users || []).filter((u: User) => u.isActive));

      // Initialize deposits state
      const depositMap: { [userId: string]: string } = {};
      for (const dep of depositsData.deposits || []) {
        depositMap[dep.userId] = dep.amount.toString();
      }
      setDeposits(depositMap);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveDeposits() {
    if (saving) return;
    setSaving(true);

    try {
      for (const userId of Object.keys(deposits)) {
        const amount = deposits[userId];
        if (!amount || new Decimal(amount).isZero()) continue;

        const res = await fetch("/api/deposits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            monthId,
            userId,
            amount,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          alert(`Failed to save deposit for user: ${data.error}`);
          setSaving(false);
          return;
        }
      }
      alert("Deposits saved successfully");
      fetchData();
    } catch (err) {
      console.error("Error:", err);
      alert("Error saving deposits");
      setSaving(false);
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

  if (!month) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <button onClick={() => router.back()} style={styles.backButton}>
              ← Back
            </button>
            <h1 style={styles.headerTitle}>Month Not Found</h1>
          </div>
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
          <h1 style={styles.headerTitle}>
            💰 {month.year}-{month.month.toString().padStart(2, "0")} — {month.status}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Manage Deposits (if ACTIVE) */}
        {month.status === "ACTIVE" && (
          <div style={styles.card}>
            <div style={styles.formSection}>
              <h2 style={styles.sectionTitle}>✏️ Manage Deposits</h2>
              <p style={styles.description}>
                Enter each member's starting deposit amount for this month (leave blank for no deposit):
              </p>

              <table style={styles.table as React.CSSProperties}>
                <thead style={styles.tableHeader as React.CSSProperties}>
                  <tr>
                    <th style={styles.tableHeaderCell as React.CSSProperties}>Member</th>
                    <th style={styles.tableHeaderCell as React.CSSProperties}>Deposit Amount (Rs.)</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={styles.tableRow as React.CSSProperties}>
                      <td style={styles.tableCell as React.CSSProperties}>{user.displayName}</td>
                      <td style={styles.tableCell as React.CSSProperties}>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={deposits[user.id] || ""}
                          onChange={(e) => setDeposits({ ...deposits, [user.id]: e.target.value })}
                          placeholder="0.00"
                          style={styles.inputField}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button onClick={handleSaveDeposits} disabled={saving} style={styles.button}>
                {saving ? "Saving..." : "✓ Save Deposits"}
              </button>
            </div>
          </div>
        )}

        {/* Current Deposits */}
        <div style={styles.card}>
          <h2 style={{ ...styles.sectionTitle, borderBottom: "2px solid #e0e0e0", paddingBottom: "12px" }}>
            📋 Current Deposits
          </h2>
          {month.deposits.length > 0 ? (
            <table style={styles.table as React.CSSProperties}>
              <thead style={styles.tableHeader as React.CSSProperties}>
                <tr>
                  <th style={styles.tableHeaderCell as React.CSSProperties}>Member</th>
                  <th style={{ ...styles.tableHeaderCell, textAlign: "right" } as React.CSSProperties}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {month.deposits.map((dep) => (
                  <tr key={dep.id} style={styles.tableRow as React.CSSProperties}>
                    <td style={styles.tableCell as React.CSSProperties}>{dep.user.displayName}</td>
                    <td style={{ ...styles.tableCell, textAlign: "right", fontWeight: "600" } as React.CSSProperties}>
                      Rs. {new Decimal(dep.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={styles.emptyMessage as React.CSSProperties}>No deposits entered yet for this month.</div>
          )}
        </div>

        {/* Summary Info */}
        <div style={styles.card}>
          <h2 style={{ ...styles.sectionTitle, borderBottom: "2px solid #e0e0e0", paddingBottom: "12px" }}>
            📊 Month Summary
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <div style={{ fontSize: "12px", color: "#666", fontWeight: "600", marginBottom: "4px" }}>
                EXPENSES RECORDED
              </div>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#F57C00" }}>
                {month.expenses.length}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#666", fontWeight: "600", marginBottom: "4px" }}>
                MEMBERS WITH DEPOSITS
              </div>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#2E7D32" }}>
                {month.deposits.length}
              </div>
            </div>
          </div>
        </div>

        {/* Status Alert */}
        {month.status === "CLOSED" && (
          <div style={styles.alertBox("warning")}>
            <strong style={{ color: "#F57F17" }}>🔒 This month is closed.</strong> No further changes can be made. All data is locked for archival and reporting.
          </div>
        )}
      </div>
    </div>
  );
}
