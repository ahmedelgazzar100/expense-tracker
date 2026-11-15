import React, { useState } from "react";
import "../styling/transactionForm.css";

interface TransactionData {
  date: string;
  type: "in" | "out";
  amount: string;
  currency: "EGP" | "USD";
  category: string;
  description: string;
  paymentMethod: "cash" | "visa";
  notes: string;
}

export default function TransactionForm() {
  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState<TransactionData>({
    date: today,
    type: "out",
    amount: "",
    currency: "EGP",
    category: "",
    description: "",
    paymentMethod: "cash",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted Transaction:", formData);
  };

  return (
    <section className="form-wrapper">
      <div className="form-card">
        <h2 className="form-title">Add New Transaction</h2>

        <form onSubmit={handleSubmit} className="transaction-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Type (Optional)</label>
              <div className="toggle-group">
                <button
                  type="button"
                  className={`toggle-btn ${formData.type === "in" ? "active-in" : ""}`}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, type: "in" }))
                  }
                >
                  + In (Income)
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${formData.type === "out" ? "active-out" : ""}`}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, type: "out" }))
                  }
                >
                  - Out (Expense)
                </button>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="amount">
                Amount <span className="required-star">*</span>
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                placeholder="0.00"
                step="any"
                min="0"
                required
                value={formData.amount}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="currency">Currency</label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
              >
                <option value="EGP">EGP (EG)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <input
                type="text"
                id="category"
                name="category"
                placeholder="e.g., Food, Bills, Salary..."
                value={formData.category}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="paymentMethod">Payment Method</label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
              >
                <option value="cash">Cash</option>
                <option value="visa">Visa</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <input
              type="text"
              id="description"
              name="description"
              placeholder="Short description of the transaction"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Any extra details or remarks..."
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="submit-btn">
            Save Transaction
          </button>
        </form>
      </div>
    </section>
  );
}
