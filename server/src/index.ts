import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import pg from "pg";
pg.types.setTypeParser(1082, (val: string) => val);

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

const db = new pg.Pool({
  user: "postgres",
  host: "localhost",
  database: "expensetracker",
  password: "123456",
  port: 5432,
});

app.use(bodyParser.urlencoded({ extended: true }));

type TransactionQuery = {
  date?: string;
  type?: string;
  currency?: string;
  payment_method?: string;
  page?: string;
};

app.get(
  "/api/getitems",
  async (req: Request<{}, {}, {}, TransactionQuery>, res: Response) => {
    try {
      const { date, type, currency, payment_method, page } = req.query;
      const currentPage = Math.max(1, Number(page) || 1);
      console.log(date);

      let condition = "where 1=1";
      let params: (string | number)[] = [];
      let index = 1;
      const limit = 5;
      const offset = (currentPage - 1) * limit;

      if (date) {
        condition += ` AND date = $${index}`;
        params.push(date);
        index++;
      }
      if (type) {
        condition += ` and type = $${index}`;
        params.push(type);
        index++;
      }
      if (currency) {
        condition += ` and currency = $${index}`;
        params.push(currency);
        index++;
      }
      if (payment_method) {
        condition += ` and payment_method = $${index}`;
        params.push(payment_method);
        index++;
      }

      const count = await db.query(
        `select count(*) as totaltransactions from transactions ${condition}`,
        params,
      );
      const transactionsCount = parseInt(count.rows[0].totaltransactions);
      const totalPages = Math.ceil(transactionsCount / limit);
      const query = await db.query(
        `select * from transactions ${condition} 
            ORDER BY id DESC     
             LIMIT $${index} OFFSET $${index + 1} `,
        [...params, limit, offset],
      );

      console.log(query.rows);

      res.status(200).json({
        transactions: query.rows,
        currentpage: currentPage,
        totalPages: totalPages,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Server Error" });
    }
  },
);

app.post("/api/sendTransaction", async (req, res) => {
  try {
    const {
      date,
      type,
      amount,
      currency,
      category,
      description,
      payment_method,
      notes,
    } = req.body;

    // Check required fields
    if (!date || !amount || !currency || !type) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    // Check amount
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({
        message: "Invalid amount",
      });
    }

    // Check type
    if (!["in", "out"].includes(type)) {
      return res.status(400).json({
        message: "Invalid type",
      });
    }

    // Check currency
    if (!["EGP", "USD"].includes(currency)) {
      return res.status(400).json({
        message: "Invalid currency",
      });
    }

    // Check payment method
    if (!["cash", "visa"].includes(payment_method)) {
      return res.status(400).json({
        message: "Invalid payment method",
      });
    }

    const result = await db.query(
      `INSERT INTO transactions
  (date, type, amount, currency, category, description, payment_method, notes)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  RETURNING *`,
      [
        date,
        type,
        amount,
        currency,
        category,
        description ?? null,
        payment_method ?? null,
        notes ?? null,
      ],
    );

    return res.status(201).json({
      message: "Transaction added successfully",
      transaction: result.rows[0],
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
});

app.delete("/api/deleteItem/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid ID",
    });
  }

  try {
    const result = await db.query(
      "DELETE FROM transactions WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    return res.status(200).json({
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
