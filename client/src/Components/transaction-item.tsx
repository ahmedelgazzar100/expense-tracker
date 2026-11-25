import "../styling/transactionItem.css";
import type { TransactionData } from "../types/transaction";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import Button from "@mui/material/Button";
import EditIcon from "@mui/icons-material/Edit";

interface Props {
  transaction: TransactionData;
  handleDelete: (id: number) => void;
  onEdit: (transactionData: TransactionData) => void;
}

export default function TransactionItem({
  transaction,
  handleDelete,
  onEdit,
}: Props) {
  const isIncome = transaction.type === "in";
  const shortDate = transaction.date.split("T")[0];

  function onDelete() {
    handleDelete(transaction.id);
  }

  function handleClick() {
    console.log(transaction);
    onEdit(transaction);
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
      <IconButton aria-label="Delete transaction" onClick={onDelete}>
        <DeleteIcon />
      </IconButton>
      <Button variant="outlined" startIcon={<EditIcon />} onClick={handleClick}>
        Edit
      </Button>
    </div>
  );
}
