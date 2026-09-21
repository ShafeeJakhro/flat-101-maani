"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Decimal from "decimal.js";

interface Month {
  id: string;
  year: number;
  month: number;
  status: "ACTIVE" | "CLOSED";
  createdAt: string;
}

interface Summary {
  totalDeposits: string | number;
  totalExpenses: string | number;
  totalSettlements: string | number;
}

interface Ledger {
  userId: string;
  displayName: string;
  username: string;
  deposit: string | number;
  expenseShare: string | number;
  remainingDeposit: string | number;
}

export default function AdminAccountingPage() {
  const router = useRouter();
  const [months, setMonths] = useState<Month[]>([]);
  const [selectedMonthId, setSelectedMonthId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<Month | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function handleExportReport() {
    if (!selectedMonthId) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/exports/month?monthId=${selectedMonthId}`);
      if (!res.ok) {
        alert("Failed to export report");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `monthly_report_${selectedMonth?.year}-${selectedMonth?.month.toString().padStart(2, "0")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error:", err);
      alert("Error exporting report");
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
    fetchMonths();
  }, []);

  async function fetchMonths() {
    try {
      const res = await fetch("/api/months");
      const data = await res.json();
      const monthList = (data.months || []).sort(
        (a: Month, b: Month) =>
          b.year - a.year || b.month - a.month
      );
      setMonths(monthList);

      // Auto-select first month
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
      fetchAccounting(selectedMonthId);
    }
  }, [selectedMonthId]);

  async function fetchAccounting(monthId: string) {
    try {
      const res = await fetch(`/api/admin/accounting?monthId=${monthId}`);
      const data = await res.json();
      setSelectedMonth(data.month);
      setSummary(data.summary);
      setLedgers(data.ledgers || []);
    } catch (err) {
      console.error("Failed to fetch accounting:", err);
    }
  }

  async function handleCloseMonth() {
    if (!selectedMonthId) return;
    if (!confirm("Close this month? This cannot be undone.")) return;

    setClosing(true);
    try {
      const res = await fetch(`/api/months/${selectedMonthId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthId: selectedMonthId }),
      });

      if (res.ok) {
        alert("Month closed successfully");
        fetchMonths();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to close month");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Error closing month");
    } finally {
      setClosing(false);
    }
  }

  if (loading) return <div style={{ padding: "20px" }}>Loading months...</div>;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      {/* Header */}
      <div style={{ backgroundColor: "#1976d2", color: "white", padding: "24px 20px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <button
            onClick={() => router.back()}
            style={{
              marginBottom: "12px",
              padding: "8px 12px",
              backgroundColor: "rgba(255,255,255,0.2)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            ← Back
          </button>
          <h1 style={{ marginTop: "0", marginBottom: "0", fontSize: "28px", fontWeight: "600" }}>📊 Monthly Accounting</h1>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 20px" }}>
        {/* Month Selector */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ fontWeight: "500", marginRight: "12px" }}>Select Month:</label>
          <select
            value={selectedMonthId}
            onChange={(e) => setSelectedMonthId(e.target.value)}
            style={{
              padding: "10px 12px",
              border: "1px solid #ddd",
              borderRadius: "6px",
              fontSize: "14px",
              backgroundColor: "white",
            }}
          >
            {months.map((m) => (
              <option key={m.id} value={m.id}>
                {m.year}-{m.month.toString().padStart(2, "0")} ({m.status})
              </option>
            ))}
          </select>
        </div>

        {selectedMonth && summary && (
          <div>
            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px", marginBottom: "30px" }}>
              <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderLeft: "4px solid #2196F3" }}>
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px", textTransform: "uppercase", fontWeight: "500" }}>Total Deposits</div>
                <div style={{ fontSize: "28px", fontWeight: "700", color: "#1976d2" }}>
                  Rs. {new Decimal(summary.totalDeposits).toFixed(2)}
                </div>
              </div>

              <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderLeft: "4px solid #FF9800" }}>
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px", textTransform: "uppercase", fontWeight: "500" }}>Total Expenses</div>
                <div style={{ fontSize: "28px", fontWeight: "700", color: "#F57C00" }}>
                  Rs. {new Decimal(summary.totalExpenses).toFixed(2)}
                </div>
              </div>

              <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderLeft: "4px solid #4CAF50" }}>
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px", textTransform: "uppercase", fontWeight: "500" }}>Total Settlements</div>
                <div style={{ fontSize: "28px", fontWeight: "700", color: "#2E7D32" }}>
                  Rs. {new Decimal(summary.totalSettlements).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Individual Ledgers */}
            <div style={{ backgroundColor: "white", borderRadius: "8px", padding: "24px", marginBottom: "30px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
              <h2 style={{ marginTop: "0", marginBottom: "20px", fontSize: "18px", fontWeight: "600" }}>Individual Ledgers</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #e0e0e0" }}>
                      <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>Member</th>
                      <th style={{ padding: "12px", textAlign: "right", fontWeight: "600", fontSize: "14px" }}>Deposit</th>
                      <th style={{ padding: "12px", textAlign: "right", fontWeight: "600", fontSize: "14px" }}>Expense Share</th>
                      <th style={{ padding: "12px", textAlign: "right", fontWeight: "600", fontSize: "14px" }}>Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgers.map((ledger, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "12px" }}>{ledger.displayName}</td>
                        <td style={{ padding: "12px", textAlign: "right" }}>Rs. {new Decimal(ledger.deposit).toFixed(2)}</td>
                        <td style={{ padding: "12px", textAlign: "right", color: "#F57C00" }}>Rs. {new Decimal(ledger.expenseShare).toFixed(2)}</td>
                        <td
                          style={{
                            padding: "12px",
                            textAlign: "right",
                            fontWeight: "600",
                            color: new Decimal(ledger.remainingDeposit).greaterThanOrEqualTo(0) ? "#2E7D32" : "#D32F2F",
                          }}
                        >
                          Rs. {new Decimal(ledger.remainingDeposit).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Month-End Controls */}
            <div style={{ backgroundColor: "white", borderRadius: "8px", padding: "24px", marginBottom: "30px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderLeft: `4px solid ${selectedMonth.status === "ACTIVE" ? "#FFC107" : "#9E9E9E"}` }}>
              <h2 style={{ marginTop: "0", marginBottom: "16px", fontSize: "18px", fontWeight: "600" }}>Month Status & Actions</h2>
              <div style={{ marginBottom: "16px" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "6px 12px",
                    borderRadius: "4px",
                    backgroundColor: selectedMonth.status === "ACTIVE" ? "#E8F5E9" : "#F5F5F5",
                    color: selectedMonth.status === "ACTIVE" ? "#2E7D32" : "#666",
                    fontWeight: "600",
                    fontSize: "13px",
                  }}
                >
                  {selectedMonth.status}
                </span>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <button
                  onClick={handleExportReport}
                  disabled={exporting}
                  style={{
                    marginRight: "10px",
                    marginBottom: "10px",
                    padding: "10px 16px",
                    backgroundColor: "#1976d2",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  {exporting ? "Exporting..." : "📥 Export as Excel"}
                </button>

                {selectedMonth.status === "ACTIVE" && (
                  <button
                    onClick={handleCloseMonth}
                    disabled={closing}
                    style={{
                      marginRight: "10px",
                      marginBottom: "10px",
                      padding: "10px 16px",
                      backgroundColor: "#D32F2F",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "500",
                    }}
                  >
                    {closing ? "Closing..." : "🔒 Close Month"}
                  </button>
                )}
              </div>

              <p style={{ margin: "0", fontSize: "14px", color: "#666" }}>
                {selectedMonth.status === "ACTIVE"
                  ? "This month is active. Add deposits and expenses. Close when ready to finalize."
                  : "This month is closed. No changes allowed. Export the report for records."}
              </p>
            </div>

            {/* Quick Actions */}
            <div style={{ backgroundColor: "white", borderRadius: "8px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
              <h2 style={{ marginTop: "0", marginBottom: "16px", fontSize: "18px", fontWeight: "600" }}>Quick Actions</h2>
              <button
                onClick={() => router.push(`/admin/months/${selectedMonthId}`)}
                style={{
                  marginRight: "10px",
                  marginBottom: "10px",
                  padding: "10px 16px",
                  backgroundColor: "#1976d2",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Manage Deposits
              </button>
              <button
                onClick={() => router.push(`/admin/expenses?monthId=${selectedMonthId}`)}
                style={{
                  marginRight: "10px",
                  marginBottom: "10px",
                  padding: "10px 16px",
                  backgroundColor: "#1976d2",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Add Expense
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
