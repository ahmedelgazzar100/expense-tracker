import React, { useState } from "react";
import "../styling/filter.css";
import type { TransactionFilters } from "../types/transaction";

type ChildProps = {
  handleFilters: (filter: TransactionFilters) => void;
};

export default function Filter(props: ChildProps) {
  const today = new Date().toISOString().split("T")[0];

  const [filter, setFilter] = useState<TransactionFilters>({
    date: "",
    type: "",
    currency: "",
    payment_method: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    const updatedFilter = {
      ...filter,
      [name]: value,
    };
    setFilter(updatedFilter);
    props.handleFilters(updatedFilter);
  }

  const emptyFilter: TransactionFilters = {
    date: "",
    type: "",
    currency: "",
    payment_method: "",
  };

  function handleReset() {
    setFilter(emptyFilter);
    props.handleFilters(emptyFilter);
  }

  return (
    <div className="filter-wrapper">
      <div className="filter-header">
        <h3>Filter Transactions</h3>
        <button
          type="button"
          className="reset-filter-btn"
          onClick={handleReset}
        >
          Reset
        </button>
      </div>

      <div className="filter-grid">
        <div className="filter-group">
          <label htmlFor="filter-date">Date</label>
          <input
            onChange={handleChange}
            type="date"
            id="filter-date"
            max={today}
            value={filter.date}
            name="date"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filter-type">Type</label>
          <select
            id="filter-type"
            value={filter.type}
            name="type"
            onChange={handleChange}
          >
            <option value="">All Types</option>
            <option value="in">In (Income)</option>
            <option value="out">Out (Expense)</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-currency">Currency</label>
          <select
            id="filter-currency"
            value={filter.currency}
            name="currency"
            onChange={handleChange}
          >
            <option value="">All Currencies</option>
            <option value="EGP">EGP (EG)</option>
            <option value="USD">USD ($)</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-payment">Payment Method</label>
          <select
            onChange={handleChange}
            id="filter-payment"
            value={filter.payment_method}
            name="payment_method"
          >
            <option value="">All Methods</option>
            <option value="cash">Cash</option>
            <option value="visa">Visa</option>
          </select>
        </div>
      </div>
    </div>
  );
}
