import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function AuditTrail() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAuditTrail();
  }, []);

  const fetchAuditTrail = async () => {
    try {
      const response = await api.get("/audit-trail");
      setTransactions(response.data);
    } catch (error) {
      console.error("Failed to fetch audit trail:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Date",
      "Reference",
      "Tenant/Entity",
      "Type",
      "Description",
      "Amount",
      "Debit/Credit",
    ];
    
    const rows = filteredTransactions.map((tx) => [
      new Date(tx.date).toLocaleDateString(),
      tx.reference || "-",
      tx.tenant_name,
      tx.type,
      `"${tx.description}"`, // Quote to handle commas in description
      `₦${parseFloat(tx.amount || 0).toLocaleString()}`,
      tx.is_credit ? "Credit" : "Debit",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial_audit_trail_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const filteredTransactions = transactions.filter((tx) => {
    // Basic filter
    if (filter === "Payments" && tx.source !== "Payment") return false;
    if (filter === "Wallet Events" && tx.source !== "Wallet") return false;
    
    // Search
    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        return (
            (tx.tenant_name && tx.tenant_name.toLowerCase().includes(lowerSearch)) ||
            (tx.reference && tx.reference.toLowerCase().includes(lowerSearch)) ||
            (tx.description && tx.description.toLowerCase().includes(lowerSearch))
        );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 p-4 bg-light">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">Financial Audit Trail</h1>
          <p className="text-muted mb-0">Master chronological ledger of all system transactions</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/payments" className="btn btn-outline-secondary">
             <i className="bi bi-arrow-left me-2"></i>
             Back to Payments
          </Link>
          <button onClick={handleExportCSV} className="btn btn-dark">
             <i className="bi bi-download me-2"></i>
             Export Ledger
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card shadow-sm border-0 mb-4">
         <div className="card-body">
            <div className="row g-3">
               <div className="col-md-6 col-lg-4">
                  <div className="input-group">
                     <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-search text-muted"></i>
                     </span>
                     <input 
                         type="text" 
                         className="form-control bg-light border-start-0" 
                         placeholder="Search tenant, ref, or description..."
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                     />
                  </div>
               </div>
               <div className="col-md-6 col-lg-3">
                  <select 
                     className="form-select bg-light" 
                     value={filter} 
                     onChange={(e) => setFilter(e.target.value)}
                  >
                     <option value="All">All Transactions</option>
                     <option value="Payments">User Payments</option>
                     <option value="Wallet Events">Wallet Deductions</option>
                  </select>
               </div>
            </div>
         </div>
      </div>

      {/* Audit Table */}
      <div className="card border-0 shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="bg-light">
              <tr>
                <th className="ps-4 text-muted fw-bold">Date</th>
                <th className="text-muted fw-bold">Reference</th>
                <th className="text-muted fw-bold">Tenant/Entity</th>
                <th className="text-muted fw-bold">Transaction Detail</th>
                <th className="text-muted fw-bold text-end pe-4">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                   <td colSpan="5" className="text-center py-5 text-muted">
                      <i className="bi bi-journal-x fs-1 d-block mb-3"></i>
                      No transaction history found
                   </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id}>
                     <td className="ps-4">
                        <span className="fw-medium">{new Date(tx.date).toLocaleDateString()}</span>
                        <div className="small text-muted">{new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                     </td>
                     <td>
                        <span className="badge bg-light text-dark border font-monospace">
                            {tx.reference || '-'}
                        </span>
                     </td>
                     <td className="fw-medium text-dark">{tx.tenant_name}</td>
                     <td>
                        <span className={`badge ${tx.source === 'Wallet' ? 'bg-secondary bg-opacity-10 text-secondary' : 'bg-primary bg-opacity-10 text-primary'} me-2`}>
                            {tx.type}
                        </span>
                        <span>{tx.description}</span>
                     </td>
                     <td className="text-end pe-4 align-middle">
                        <span className={`fw-bold ${tx.is_credit ? 'text-success' : 'text-danger'}`}>
                            {tx.is_credit ? '+' : '-'}₦{parseFloat(tx.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </span>
                     </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
