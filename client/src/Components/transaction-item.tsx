import "../styling/transactionItem.css";
import type { TransactionData } from "../types/transaction";
import Chip from "@mui/material/Chip";
import DeleteIcon from "@mui/icons-material/Delete";

interface Props {
  transaction: TransactionData;
  handleDelete: (id: number) => void;
}

export default function TransactionItem({ transaction, handleDelete }: Props) {
  const isIncome = transaction.type === "in";
  const shortDate = transaction.date.split("T")[0];

  function onDelete() {
    handleDelete(transaction.id);
  }

  return (
    <div className="transaction-item">
      <div className="transaction-info">
        <div className={`transaction-icon ${isIncome ? "in" : "out"}`}>
          {isIncome ? "+" : "-"}
        </div>

        <div className="transaction-details">
          <h4>{transaction.category || "General"}</h4>

          <span className="transaction-category">
            {transaction.description || shortDate}
          </span>

          {transaction.description && (
            <span className="transaction-date">{shortDate}</span>
          )}
        </div>
      </div>

      <div className="transaction-meta">
        <span className={`transaction-amount ${isIncome ? "in" : "out"}`}>
          {isIncome ? "+" : "-"}
          {transaction.amount} {transaction.currency}
        </span>

        {transaction.payment_method && (
          <span className="payment-badge">{transaction.payment_method}</span>
        )}
      </div>
      <Chip
        label="Delete Transaction"
        onClick={onDelete}
        onDelete={onDelete} //
        deleteIcon={<DeleteIcon />} //
        variant="outlined"
      />
    </div>
  );
}
