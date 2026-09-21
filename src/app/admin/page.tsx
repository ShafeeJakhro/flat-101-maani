"use client";

import React from "react";
import { useRouter } from "next/navigation";

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
    maxWidth: "1200px",
    margin: "0 auto",
  },
  headerTitle: {
    fontSize: "28px",
    fontWeight: "600",
    margin: "0",
  },
  headerSubtitle: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.9)",
    margin: "8px 0 0 0",
  },
  content: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 20px 40px",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
    marginBottom: "40px",
  },
  card: {
    padding: "24px",
    borderRadius: "8px",
    backgroundColor: "white",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "12px",
    color: "#333",
  },
  cardDescription: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "16px",
    flexGrow: 1,
  },
  button: {
    padding: "10px 16px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    backgroundColor: "#1976d2",
    color: "white",
  },
  section: {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "2px solid #e0e0e0",
  },
  ol: {
    lineHeight: "2",
    color: "#555",
  },
  li: {
    marginBottom: "8px",
  },
};

export default function AdminDashboardPage() {
  const router = useRouter();

  const cardWithColor = (color: string): React.CSSProperties => ({
    ...styles.card,
    borderLeft: `4px solid ${color}`,
  });

  return (
    <div style={styles.container as React.CSSProperties}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.headerTitle as React.CSSProperties}>⚙️ Admin Dashboard</h1>
          <p style={styles.headerSubtitle as React.CSSProperties}>Manage monthly accounting, deposits, and household finances</p>
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Navigation Cards */}
        <div style={styles.cardGrid as React.CSSProperties}>
          {/* Monthly Management */}
          <div style={cardWithColor("#1976d2")}>
            <h2 style={styles.cardTitle}>📅 Monthly Management</h2>
            <p style={styles.cardDescription}>Create and manage monthly accounting periods. Set start and end dates for expense tracking.</p>
            <button
              onClick={() => router.push("/admin/months")}
              style={styles.button as React.CSSProperties}
            >
              Go to Months →
            </button>
          </div>

          {/* Accounting Overview */}
          <div style={cardWithColor("#FF9800")}>
            <h2 style={styles.cardTitle}>📊 Accounting Overview</h2>
            <p style={styles.cardDescription}>View complete monthly accounting data, member ledgers, and settlement summaries.</p>
            <button
              onClick={() => router.push("/admin/accounting")}
              style={styles.button as React.CSSProperties}
            >
              View Accounting →
            </button>
          </div>

          {/* User Management */}
          <div style={cardWithColor("#4CAF50")}>
            <h2 style={styles.cardTitle}>👥 User Management</h2>
            <p style={styles.cardDescription}>Manage household members and their permissions and roles.</p>
            <button
              onClick={() => router.push("/admin/users")}
              style={styles.button as React.CSSProperties}
            >
              Go to Users →
            </button>
          </div>

          {/* Adjustments */}
          <div style={cardWithColor("#F44336")}>
            <h2 style={styles.cardTitle}>🔧 Adjustments & Settlements</h2>
            <p style={styles.cardDescription}>Record manual adjustments, refunds, and settlements between members.</p>
            <button
              onClick={() => router.push("/admin/adjustments")}
              style={styles.button as React.CSSProperties}
            >
              Go to Adjustments →
            </button>
          </div>
        </div>

        {/* Quick Start Guide */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle as React.CSSProperties}>🚀 Quick Start Guide</h2>
          <ol style={styles.ol as React.CSSProperties}>
            <li style={styles.li}>
              Go to <strong>📅 Monthly Management</strong> and create a new month for the current period
            </li>
            <li style={styles.li}>
              Go to <strong>📅 Monthly Management</strong> → Select Month → <strong>Manage Deposits</strong> to enter each member's starting deposit
            </li>
            <li style={styles.li}>
              Go to <strong>📊 Accounting Overview</strong> to add household expenses through the "Add Expense" button
            </li>
            <li style={styles.li}>
              Members can view their personal <strong>Balance Dashboard</strong> to see their deposits, expense shares, and who owes whom
            </li>
            <li style={styles.li}>
              Use the transaction drill-down to see detailed bills that make up pairwise debts
            </li>
            <li style={styles.li}>
              When ready, close the month from <strong>📊 Accounting Overview</strong> to finalize accounting
            </li>
            <li style={styles.li}>
              Export the month-end Excel report for records and reconciliation
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
