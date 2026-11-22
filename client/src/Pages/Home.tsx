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
import { useEffect, useState } from "react";
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
    setMessage("حصل خطأ، حاول تاني");
    setShowToast(true);
  }

  useEffect(() => {
    async function getItems() {
      try {
        // 1. نتأكد الأول إن اليوزر مسجل دخول

        const response = await axios.get<GetItemsResponse>(
          `${API_URL}/api/getitems`,
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
      const result = await axios.post(`${API_URL}/api/sendTransaction`, data, {
        withCredentials: true,
      });

      setCurrentPage(1);
      setRefreshKey((prev) => prev + 1);

      setMessage(result.data.message);
      setShowToast(true);
      return true;
    } catch (error) {
      handleError(error);
      return false;
    }
  }

  async function handleDelete(id: number) {
    // if (!window.confirm("متأكد إنك عايز تمسح المعاملة؟")) return;
    try {
      const response = await axios.delete(`${API_URL}/api/deleteItem/${id}`, {
        withCredentials: true,
      });
      if (itemTransactions.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        setRefreshKey((prev) => prev + 1);
      }

      setMessage(response.data.message);
      setShowToast(true);
    } catch (error) {
      handleError(error);
    }
  }

  return (
    <>
      <Header />
      <TransactionForm sendData={sendData} />
      <Filter handleFilters={handleFilters} />
      <Toast
        message={message}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      <div className="transactions-container">
        <h3 className="section-heading">Recent Transactions</h3>
        {itemTransactions.map((item) => (
          <TransactionItem
            key={item.id}
            transaction={item}
            handleDelete={handleDelete}
          />
        ))}
        <PaginationComponent
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={onPageChange}
        />
      </div>
    </>
  );
}
