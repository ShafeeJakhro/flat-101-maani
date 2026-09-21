"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Decimal from "decimal.js";
import { NavBar } from "@/components/NavBar";

interface Transaction {
  expenseId: string;
  title: string;
  amount: string | number;
  date: Date | string;
}

interface User {
  id: string;
  displayName: string;
  username: string;
}

interface Month {
  id: string;
  year: number;
  month: number;
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
  headerContent: {
    maxWidth: "900px",
    margin: "0 auto",
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
  button: {
    padding: "10px 16px",
    backgroundColor: "#1976d2",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    marginRight: "8px",
  },
  title: {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "16px",
    color: "#333",
  },
  subtitle: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "20px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeader: {
    backgroundColor: "#f8f9fa",
    borderBottom: "2px solid #e0e0e0",
  },
  tableRow: {
    borderBottom: "1px solid #f0f0f0",
  },
  tableCell: {
    padding: "14px",
    textAlign: "left",
  },
  tableCellRight: {
    padding: "14px",
    textAlign: "right",
    fontWeight: "600",
  },
  emptyMessage: {
    padding: "40px 20px",
    textAlign: "center",
    color: "#999",
  },
  totalBox: {
    marginTop: "24px",
    padding: "16px",
    backgroundColor: "#e3f2fd",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderLeft: "4px solid #1976d2",
  },
  totalBoxLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1565c0",
  },
  totalBoxAmount: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1976d2",
  },
};

export default function TransactionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const monthId = searchParams.get("monthId");
  let fromUserId = searchParams.get("fromUserId");
  let toUserId = searchParams.get("toUserId");

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fromUser, setFromUser] = useState<User | null>(null);
  const [toUser, setToUser] = useState<User | null>(null);
  const [month, setMonth] = useState<Month | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (!monthId || !fromUserId || !toUserId) {
      setError("Missing required parameters.");
      setLoading(false);
      return;
    }

    if (fromUserId === "me" || toUserId === "me") {
      fetchAndResolveMe();
    } else {
      fetchTransactions(fromUserId, toUserId);
    }
  }, [monthId, fromUserId, toUserId]);

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

  async function fetchAndResolveMe() {
    try {
      const res = await fetch("/api/me");

      if (!res.ok) {
        setError("Failed to get current user.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      const currentUserId = data.user.id;

      const resolvedFromId =
        fromUserId === "me" ? currentUserId : fromUserId;

      const resolvedToId =
        toUserId === "me" ? currentUserId : toUserId;

      fetchTransactions(resolvedFromId!, resolvedToId!);
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to resolve current user.");
      setLoading(false);
    }
  }

  async function fetchTransactions(from: string, to: string) {
    try {
      const res = await fetch(
        `/api/transactions?monthId=${monthId}&fromUserId=${from}&toUserId=${to}`
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to load transactions.");
        setLoading(false);
        return;
      }

      const data = await res.json();

      setTransactions(data.transactions || []);
      setFromUser(data.fromUser);
      setToUser(data.toUser);
      setMonth(data.month);
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        {user && (
          <NavBar
            displayName={user.displayName}
            role={user.role}
          />
        )}

        <div style={styles.header}>
          <div style={styles.headerContent}>Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        {user && (
          <NavBar
            displayName={user.displayName}
            role={user.role}
          />
        )}

        <div style={styles.header}>
          <div style={styles.headerContent}>
            <button
              onClick={() => router.back()}
              style={styles.button}
            >
              ← Back
            </button>
          </div>
        </div>

        <div style={styles.content}>
          <div style={{ ...styles.card, color: "#d32f2f" }}>
            <strong>Error:</strong> {error}
          </div>
        </div>
      </div>
    );
  }

  if (!fromUser || !toUser || !month) {
    return (
      <div style={styles.container}>
        {user && (
          <NavBar
            displayName={user.displayName}
            role={user.role}
          />
        )}

        <div style={styles.header}>
          <div style={styles.headerContent}>
            <button
              onClick={() => router.back()}
              style={styles.button}
            >
              ← Back
            </button>
          </div>
        </div>

        <div style={styles.content}>
          <div style={styles.card}>
            Data not loaded.
          </div>
        </div>
      </div>
    );
  }

  const total = transactions.reduce(
    (sum, t) => sum.plus(new Decimal(t.amount)),
    new Decimal(0)
  );

  return (
    <div style={styles.container}>
      {user && (
        <NavBar
          displayName={user.displayName}
          role={user.role}
        />
      )}

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <button
            onClick={() => router.back()}
            style={styles.button}
          >
            ← Back
          </button>

          <h1
            style={{
              marginTop: "12px",
              marginBottom: "0",
              fontSize: "24px",
            }}
          >
            Transaction Details
          </h1>
        </div>
      </div>

      <div style={styles.content}>
        {/* Info Card */}
        <div style={styles.card}>
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "12px",
                color: "#999",
                marginBottom: "4px",
              }}
            >
              {month.year}-{month.month.toString().padStart(2, "0")}
            </div>

            <div
              style={{
                fontSize: "18px",
                fontWeight: "600",
                marginBottom: "8px",
              }}
            >
              {fromUser.displayName} → {toUser.displayName}
            </div>

            <div
              style={{
                fontSize: "13px",
                color: "#666",
              }}
            >
              Bills where {fromUser.displayName} owes{" "}
              {toUser.displayName}
            </div>
          </div>
        </div>

        {/* Transactions */}
        {transactions.length === 0 ? (
          <div style={styles.card}>
            <div
              style={
                styles.emptyMessage as React.CSSProperties
              }
            >
              📋 No transactions between these users.
            </div>
          </div>
        ) : (
          <div style={styles.card}>
            <table
              style={styles.table as React.CSSProperties}
            >
              <thead
                style={
                  styles.tableHeader as React.CSSProperties
                }
              >
                <tr>
                  <th
                    style={
                      styles.tableCell as React.CSSProperties
                    }
                  >
                    Bill
                  </th>

                  <th
                    style={
                      styles.tableCell as React.CSSProperties
                    }
                  >
                    Date
                  </th>

                  <th
                    style={
                      styles.tableCellRight as React.CSSProperties
                    }
                  >
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((t, idx) => (
                  <tr
                    key={idx}
                    style={
                      styles.tableRow as React.CSSProperties
                    }
                  >
                    <td
                      style={
                        styles.tableCell as React.CSSProperties
                      }
                    >
                      <div
                        style={{
                          fontWeight: "500",
                          marginBottom: "4px",
                        }}
                      >
                        {t.title}
                      </div>

                      <div
                        style={{
                          fontSize: "12px",
                          color: "#999",
                        }}
                      >
                        ID: {t.expenseId.slice(0, 8)}
                      </div>
                    </td>

                    <td
                      style={
                        styles.tableCell as React.CSSProperties
                      }
                    >
                      {new Date(t.date).toLocaleDateString(
                        "en-IN"
                      )}
                    </td>

                    <td
                      style={
                        styles.tableCellRight as React.CSSProperties
                      }
                    >
                      Rs. {new Decimal(t.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div
              style={
                styles.totalBox as React.CSSProperties
              }
            >
              <span
                style={
                  styles.totalBoxLabel as React.CSSProperties
                }
              >
                Total Amount
              </span>

              <span
                style={
                  styles.totalBoxAmount as React.CSSProperties
                }
              >
                Rs. {total.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}