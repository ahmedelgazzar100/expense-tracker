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

export default function Home() {
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

  useEffect(() => {
    async function getItems() {
      try {
        const response = await axios.get<GetItemsResponse>(
          "http://localhost:5000/api/getitems",
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
        console.log(error);
      }
    }
    getItems();
  }, [filters, currentPage, refreshKey]);

  async function sendData(data: CreateTransactionData) {
    try {
      const result = await axios.post(
        "http://localhost:5000/api/sendTransaction",
        data,
        {
          withCredentials: true,
        },
      );
      setItemTransactions((prev) => [result.data.transaction, ...prev]);
      setCurrentPage(1);
      setRefreshKey((prev) => prev + 1);
      setMessage(result.data.message);
      setShowToast(true);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async function handleDelete(id: number) {
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/deleteItem/${id}`,
        {
          withCredentials: true,
        },
      );
      setItemTransactions((prev) => prev.filter((item) => item.id !== id));
      setRefreshKey((prev) => prev + 1);
      setMessage(response.data.message);
      setShowToast(true);
    } catch (error) {
      console.log(error);
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
