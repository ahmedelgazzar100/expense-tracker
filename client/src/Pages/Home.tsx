import { API_URL } from "../config.ts";
import Header from "../Components/Header";
import TransactionForm from "../Components/Form";
import Toast from "../Components/Toast";
import type { CreateTransactionData } from "../types/transaction";
import type { TransactionData } from "../types/transaction";
import type { TransactionFilters } from "../types/transaction";
import type { GetItemsResponse } from "../types/transaction";
import TransactionItem from "../Components/transaction-item";
import PaginationComponent from "../Components/pagination";
import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import Filter from "../Components/Filter";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);
  const [message, setMessage] = useState("");
  const [itemTransactions, setItemTransactions] = useState<TransactionData[]>(
    [],
  );
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filters, setFilters] = useState<TransactionFilters>({
    date: "",
    type: "",
    currency: "",
    payment_method: "",
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [editing, setEditing] = useState<TransactionData | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  function onPageChange(page: number) {
    console.log(page);
    setCurrentPage(page);
  }

  function handleFilters(filters: TransactionFilters) {
    setFilters(filters);
    setCurrentPage(1);
  }

  function handleError(error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      navigate("/");
      return;
    }
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      notify("طلبات كتير، حاول تاني بعد شوية", "error");
      return;
    }
    notify("حصل خطأ أثناء تنفيذ العملية", "error");
  }

  function notify(msg: string, type: "success" | "error" = "success") {
    setMessage(msg);
    setToastType(type);
    setShowToast(true);
  }
  const closeToast = useCallback(() => {
    setShowToast(false);
  }, []);

  useEffect(() => {
    async function getItems() {
      try {
        // 1. نتأكد الأول إن اليوزر مسجل دخول

        const response = await axios.get<GetItemsResponse>(
          `${API_URL}/api/transactions`,
          {
            params: {
              ...filters,
              page: currentPage,
            },
            withCredentials: true,
          },
        );
        setTotalPages(response.data.totalPages);
        setItemTransactions(response.data.transactions);
      } catch (error) {
        handleError(error);
      }
    }
    getItems();
  }, [filters, currentPage, refreshKey]);

  async function sendData(data: CreateTransactionData): Promise<boolean> {
    try {
      const result = editing
        ? await axios.patch(`${API_URL}/api/transactions/${editing.id}`, data, {
            withCredentials: true,
          })
        : await axios.post(`${API_URL}/api/transactions`, data, {
            withCredentials: true,
          });
      if (editing) setEditing(null);
      else setCurrentPage(1);
      setRefreshKey((prev) => prev + 1); //old val depend of new val

      notify(result.data.message);
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("متأكد إنك عايز تمسح المعاملة؟")) return;
    try {
      const response = await axios.delete(`${API_URL}/api/transactions/${id}`, {
        withCredentials: true,
      });
      if (itemTransactions.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        setRefreshKey((prev) => prev + 1);
      }

      notify(response.data.message);
    } catch (error) {
      handleError(error);
    }
  }

  async function handleLogout() {
    try {
      await axios.post(`${API_URL}/api/logout`, {}, { withCredentials: true });
      navigate("/");
    } catch (error) {
      handleError(error);
    }
  }

  function onEdit(transactionData: TransactionData) {
    setEditing(transactionData);
  }

  return (
    <>
      <Header />
      <TransactionForm
        sendData={sendData}
        key={editing?.id ?? "new"}
        initialData={editing ?? undefined}
      />
      <Filter handleFilters={handleFilters} />
      <Toast
        message={message}
        isVisible={showToast}
        onClose={closeToast}
        type={toastType}
      />

      <div className="transactions-container">
        <h3 className="section-heading">Recent Transactions</h3>
        {itemTransactions.map((item) => (
          <TransactionItem
            key={item.id}
            transaction={item}
            handleDelete={handleDelete}
            onEdit={onEdit}
          />
        ))}
        <PaginationComponent
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={onPageChange}
        />
      </div>
      <div className="bottom-btn-wrapper">
        <button
          type="button"
          className="bottom-action-btn"
          onClick={handleLogout}
        >
          Log Out
        </button>
      </div>
    </>
  );
}
