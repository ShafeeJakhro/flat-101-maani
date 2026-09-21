"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Decimal from "decimal.js";
import { NavBar } from "@/components/NavBar";

interface Month {
  id: string;
  year: number;
  month: number;
  status: "ACTIVE" | "CLOSED";
}

interface Debt {
  userId: string;
  username: string;
  displayName: string;
  amount: string | number;
}

interface UserMonthDashboard {
  deposit: string | number;
  expenseShare: string | number;
  remainingDeposit: string | number;
  youOwe: Debt[];
  owedToYou: Debt[];
  netPosition: {
    amount: string | number;
    type: "payable" | "receivable";
  };
}

interface CurrentUser {
  displayName: string;
  role: "ADMIN" | "USER";
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f8f9fa",
    padding: "0 0 80px",
  },
  header: {
    backgroundColor: "#1976d2",
    color: "white",
    padding: "24px 20px",
    marginBottom: "24px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  headerTitle: {
    maxWidth: "1200px",
    margin: "0 auto",
    fontSize: "28px",
    fontWeight: "600",
  },
  content: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 20px 40px",
  },
  selector: {
    marginBottom: "30px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  select: {
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px",
    backgroundColor: "white",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  statCard: (color: string) => ({
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    borderLeft: `4px solid ${color}`,
  }),
  statLabel: {
    fontSize: "12px",
    color: "#666",
    marginBottom: "8px",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  statValue: (color: string) => ({
    fontSize: "28px",
    fontWeight: "700",
    color,
  }),
  section: {
    marginBottom: "30px",
  },
  sectionTitle: (borderColor: string) => ({
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: `2px solid ${borderColor}`,
  }),
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableRow: (isHeader: boolean) => ({
    borderBottom: isHeader ? "2px solid #e0e0e0" : "1px solid #f0f0f0",
    backgroundColor: isHeader ? "#f8f9fa" : "white",
  }),
  tableCell: {
    padding: "14px",
    textAlign: "left",
  },
  debtLink: {
    background: "none",
    border: "none",
    color: "#1976d2",
    cursor: "pointer",
    textDecoration: "none",
    fontWeight: "500",
  },
  emptyMessage: {
    padding: "20px",
    textAlign: "center",
    color: "#999",
    fontSize: "14px",
  },
  totalRow: {
    textAlign: "right",
    fontWeight: "600",
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px solid #e0e0e0",
  },
};

export default function UserDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [months, setMonths] = useState<Month[]>([]);
  const [selectedMonthId, setSelectedMonthId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<Month | null>(null);
  const [dashboard, setDashboard] = useState<UserMonthDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
    fetchMonths();
  }, []);

  async function fetchUser() {
    try {
      const res = await fetch("/api/me");

      if (!res.ok) {
        return;
      }

      const data = await res.json();
      setUser(data.user || null);
    } catch (err) {
      console.error("Failed to fetch user:", err);
    }
  }

  async function fetchMonths() {
    try {
      const res = await fetch("/api/months?status=ACTIVE");
      const data = await res.json();
      const monthList = data.months || [];
      setMonths(monthList);

      if (monthList.length > 0) {
        setSelectedMonthId(monthList[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch months:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedMonthId) {
      fetchDashboard(selectedMonthId);
    }
  }, [selectedMonthId]);

  async function fetchDashboard(monthId: string) {
    try {
      const res = await fetch(`/api/user/dashboard?monthId=${monthId}`);
      const data = await res.json();
      setDashboard(data.dashboard);
      setSelectedMonth(data.month);
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
      setDashboard(null);
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        {user && <NavBar displayName={user.displayName} role={user.role} />}

        <div style={styles.header}>
          <div style={styles.headerTitle}>Loading...</div>
        </div>
      </div>
    );
  }

  if (months.length === 0) {
    return (
      <div style={styles.container}>
        {user && <NavBar displayName={user.displayName} role={user.role} />}

        <div style={styles.header}>
          <div style={styles.headerTitle}>My Balance</div>
        </div>

        <div style={styles.content}>
          <div style={styles.card}>
            <p>No active months. Contact admin to start a month.</p>
          </div>
        </div>
      </div>
    );
  }

  const totalOwe =
    dashboard?.youOwe.reduce(
      (sum, d) => sum + parseFloat(d.amount as any),
      0
    ) || 0;

  const totalOwed =
    dashboard?.owedToYou.reduce(
      (sum, d) => sum + parseFloat(d.amount as any),
      0
    ) || 0;

  return (
    <div style={styles.container}>
      {user && <NavBar displayName={user.displayName} role={user.role} />}

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>💰 My Balance</div>
      </div>

      <div style={styles.content}>
        {/* Month Selector */}
        <div style={styles.selector}>
          <label style={{ fontWeight: "500" }}>Month:</label>

          <select
            value={selectedMonthId}
            onChange={(e) => setSelectedMonthId(e.target.value)}
            style={styles.select}
          >
            {months.map((m) => (
              <option key={m.id} value={m.id}>
                {m.year}-{m.month.toString().padStart(2, "0")} ({m.status})
              </option>
            ))}
          </select>
        </div>

        {dashboard && selectedMonth && (
          <>
            {/* Key Metrics */}
            <div style={styles.grid2}>
              <div style={styles.statCard("#2196F3")}>
                <div style={styles.statLabel}>Starting Deposit</div>

                <div style={styles.statValue("#1976d2")}>
                  Rs. {new Decimal(dashboard.deposit).toFixed(2)}
                </div>
              </div>

              <div style={styles.statCard("#FF9800")}>
                <div style={styles.statLabel}>My Expense Share</div>

                <div style={styles.statValue("#F57C00")}>
                  Rs. {new Decimal(dashboard.expenseShare).toFixed(2)}
                </div>
              </div>

              <div style={styles.statCard("#4CAF50")}>
                <div style={styles.statLabel}>Remaining Deposit</div>

                <div style={styles.statValue("#2E7D32")}>
                  Rs. {new Decimal(dashboard.remainingDeposit).toFixed(2)}
                </div>
              </div>

              <div
                style={styles.statCard(
                  dashboard.netPosition.type === "receivable"
                    ? "#4CAF50"
                    : "#F44336"
                )}
              >
                <div style={styles.statLabel}>Net Position</div>

                <div
                  style={styles.statValue(
                    dashboard.netPosition.type === "receivable"
                      ? "#2E7D32"
                      : "#D32F2F"
                  )}
                >
                  Rs. {new Decimal(dashboard.netPosition.amount).toFixed(2)}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    marginTop: "4px",
                  }}
                >
                  {dashboard.netPosition.type === "receivable"
                    ? "Receivable"
                    : "Payable"}
                </div>
              </div>
            </div>

            {/* Settlement Details */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(400px, 1fr))",
                gap: "24px",
              }}
            >
              {/* You Owe Section */}
              <div style={{ ...styles.card, ...styles.section }}>
                <h2 style={styles.sectionTitle("#D32F2F")}>
                  💸 You Owe
                </h2>

                {dashboard.youOwe.length > 0 ? (
                  <>
                    <table style={styles.table as React.CSSProperties}>
                      <tbody>
                        {dashboard.youOwe.map((debt, idx) => (
                          <tr
                            key={idx}
                            style={
                              styles.tableRow(false) as React.CSSProperties
                            }
                          >
                            <td
                              style={
                                styles.tableCell as React.CSSProperties
                              }
                            >
                              <button
                                onClick={() =>
                                  router.push(
                                    `/transactions?monthId=${selectedMonthId}&fromUserId=${debt.userId}&toUserId=me`
                                  )
                                }
                                style={
                                  styles.debtLink as React.CSSProperties
                                }
                              >
                                {debt.displayName}
                              </button>
                            </td>

                            <td
                              style={{
                                ...styles.tableCell,
                                textAlign: "right",
                                fontWeight: "600",
                              }}
                            >
                              Rs. {new Decimal(debt.amount).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div
                      style={styles.totalRow as React.CSSProperties}
                    >
                      Total: Rs. {new Decimal(totalOwe).toFixed(2)}
                    </div>
                  </>
                ) : (
                  <div
                    style={styles.emptyMessage as React.CSSProperties}
                  >
                    ✅ You don't owe anyone
                  </div>
                )}
              </div>

              {/* Owed To You Section */}
              <div style={{ ...styles.card, ...styles.section }}>
                <h2 style={styles.sectionTitle("#4CAF50")}>
                  💸 Owed To You
                </h2>

                {dashboard.owedToYou.length > 0 ? (
                  <>
                    <table style={styles.table as React.CSSProperties}>
                      <tbody>
                        {dashboard.owedToYou.map((debt, idx) => (
                          <tr
                            key={idx}
                            style={
                              styles.tableRow(false) as React.CSSProperties
                            }
                          >
                            <td
                              style={
                                styles.tableCell as React.CSSProperties
                              }
                            >
                              <button
                                onClick={() =>
                                  router.push(
                                    `/transactions?monthId=${selectedMonthId}&fromUserId=me&toUserId=${debt.userId}`
                                  )
                                }
                                style={
                                  styles.debtLink as React.CSSProperties
                                }
                              >
                                {debt.displayName}
                              </button>
                            </td>

                            <td
                              style={{
                                ...styles.tableCell,
                                textAlign: "right",
                                fontWeight: "600",
                              }}
                            >
                              Rs. {new Decimal(debt.amount).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div
                      style={styles.totalRow as React.CSSProperties}
                    >
                      Total: Rs. {new Decimal(totalOwed).toFixed(2)}
                    </div>
                  </>
                ) : (
                  <div
                    style={styles.emptyMessage as React.CSSProperties}
                  >
                    ✅ No one owes you
                  </div>
                )}
              </div>
            </div>

            {/* Info Box */}
            <div
              style={{
                marginTop: "30px",
                padding: "16px",
                backgroundColor: "#E3F2FD",
                borderRadius: "8px",
                borderLeft: "4px solid #1976d2",
              }}
            >
              <p
                style={{
                  margin: "0",
                  fontSize: "13px",
                  color: "#1565c0",
                }}
              >
                <strong>💡 Tip:</strong> Click on any name to see the
                individual bills that make up that debt.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}