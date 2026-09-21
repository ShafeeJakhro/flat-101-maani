"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Decimal from "decimal.js";

interface User {
  id: string;
  displayName: string;
  username: string;
}

interface Expense {
  id: string;
  title: string;
  amount: string | number;
  paidById: string;
  paidBy: {
    id: string;
    displayName: string;
  };
  date: string | Date;
  notes?: string;
}

const styles: Record<string, React.CSSProperties> = {
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
  button: {
    padding: "8px 12px",
    backgroundColor: "rgba(255,255,255,0.2)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "12px",
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
  formTitle: {
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: "20px",
  },
  formGroup: {
    marginBottom: "16px",
  },
  formLabel: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#333",
  },
  formInput: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  checkboxGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    fontSize: "14px",
  },
  checkbox: {
    marginRight: "8px",
    cursor: "pointer",
  },
  submitButton: {
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
  emptyMessage: {
    padding: "20px",
    textAlign: "center",
    color: "#999",
  },
};

export default function AdminExpensesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const monthId = searchParams.get("monthId");

  const [users, setUsers] = useState<User[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState("");
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!monthId) {
      alert("Month not specified");
      router.back();
      return;
    }
    fetchData();
  }, [monthId]);

  async function fetchData() {
    try {
      const [usersRes, expensesRes] = await Promise.all([
        fetch("/api/users"),
        fetch(`/api/expenses?monthId=${monthId}`),
      ]);

      const usersData = await usersRes.json();
      const expensesData = await expensesRes.json();

      const activeUsers = (usersData.users || []).filter((u: User) => u.id !== "system");
      setUsers(activeUsers);
      setExpenses(expensesData.expenses || []);

      if (activeUsers.length > 0) {
        setPaidById(activeUsers[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }

  function toggleParticipant(userId: string) {
    setParticipantIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !amount || !paidById || participantIds.length === 0) {
      alert("Please fill all required fields and select at least one participant");
      return;
    }

    if (!participantIds.includes(paidById)) {
      alert("Payer must be included in participants");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthId,
          title: title.trim(),
          amount: new Decimal(amount).toFixed(2),
          paidById,
          participantIds,
          date,
          notes: notes.trim() || undefined,
        }),
      });

      if (res.ok) {
        alert("Expense added successfully");
        setTitle("");
        setAmount("");
        setPaidById(users[0]?.id || "");
        setParticipantIds([]);
        setNotes("");
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add expense");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Error adding expense");
    } finally {
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

  if (!monthId) return null;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <button onClick={() => router.back()} style={styles.button as React.CSSProperties}>
            ← Back
          </button>
          <h1 style={styles.headerTitle}>💸 Add Expense</h1>
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Form Card */}
        <div style={styles.card}>
          <h2 style={styles.formTitle}>📝 New Expense</h2>
          <form onSubmit={handleAddExpense}>
            {/* Bill Title */}
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Bill Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Groceries, Utilities, Internet"
                style={styles.formInput as React.CSSProperties}
              />
            </div>

            {/* Amount & Date Row */}
            <div style={styles.formRow as React.CSSProperties}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Amount (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  style={styles.formInput as React.CSSProperties}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={styles.formInput as React.CSSProperties}
                />
              </div>
            </div>

            {/* Paid By */}
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Paid By</label>
              <select
                value={paidById}
                onChange={(e) => setPaidById(e.target.value)}
                style={styles.formInput as React.CSSProperties}
              >
                <option value="">Select...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* Split Among */}
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Split Among (select at least one, including payer)</label>
              <div style={styles.checkboxGrid as React.CSSProperties}>
                {users.map((u) => (
                  <label key={u.id} style={styles.checkboxLabel as React.CSSProperties}>
                    <input
                      type="checkbox"
                      checked={participantIds.includes(u.id)}
                      onChange={() => toggleParticipant(u.id)}
                      style={styles.checkbox}
                    />
                    {u.displayName}
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional details about this expense..."
                style={{
                  ...styles.formInput,
                  minHeight: "80px",
                  resize: "vertical",
                } as React.CSSProperties}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              style={styles.submitButton as React.CSSProperties}
            >
              {saving ? "Adding..." : "✓ Add Expense"}
            </button>
          </form>
        </div>

        {/* Recent Expenses */}
        <div style={styles.card}>
          <h2 style={styles.formTitle}>📋 Recent Expenses</h2>
          {expenses.length === 0 ? (
            <div style={styles.emptyMessage as React.CSSProperties}>No expenses recorded yet for this month.</div>
          ) : (
            <table style={styles.table as React.CSSProperties}>
              <thead style={styles.tableHeader as React.CSSProperties}>
                <tr>
                  <th style={styles.tableHeaderCell as React.CSSProperties}>Bill</th>
                  <th style={styles.tableHeaderCell as React.CSSProperties}>Paid By</th>
                  <th style={styles.tableHeaderCell as React.CSSProperties}>Date</th>
                  <th style={{ ...styles.tableHeaderCell, textAlign: "right" } as React.CSSProperties}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp, idx) => (
                  <tr key={idx} style={styles.tableRow as React.CSSProperties}>
                    <td style={styles.tableCell as React.CSSProperties}>
                      <div style={{ fontWeight: "500", marginBottom: "4px" }}>{exp.title}</div>
                      {exp.notes && <div style={{ fontSize: "12px", color: "#999" }}>{exp.notes}</div>}
                    </td>
                    <td style={styles.tableCell as React.CSSProperties}>{exp.paidBy?.displayName || "-"}</td>
                    <td style={styles.tableCell as React.CSSProperties}>{new Date(exp.date).toLocaleDateString("en-IN")}</td>
                    <td style={{ ...styles.tableCell, textAlign: "right", fontWeight: "600" } as React.CSSProperties}>
                      Rs. {new Decimal(exp.amount).toFixed(2)}
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
