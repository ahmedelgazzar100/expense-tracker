import env from "dotenv";
import type { ErrorRequestHandler } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import express from "express";
import type { User } from "../types/user.js";
import type { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import pg from "pg";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import session from "express-session";
import type { RequestHandler } from "express";
env.config();

pg.types.setTypeParser(1082, (val: string) => val);

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(helmet());

const sessionSecret = process.env.SESSION_SECRET;
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    message: "حدث خطأ في السيرفر",
  });
};

if (!sessionSecret) {
  throw new Error("SESSION_SECRET is missing");
}

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false, //   false أماناً عشان ما يخزنش جلسات فاضية بلا داعي
    cookie: {
      secure: false, //  خليها true لو طلعت على سيرفر حقيقي بيشتغل بـ HTTPS، وخليها false لو شغالين Localhost
      sameSite: "lax", //   السطر ده عشان المتصفح يسمح للكوكي تفضل محفوظة مع التنقلات والـ Refresh
      httpOnly: true, //  بتمنع الجافاسكريبت في الفرونت إند إنه يوصل للكوكي (حماية ضد سرقة الجلسة)
      maxAge: 1000 * 60 * 60 * 24 * 7, // الجلسة تفضل شغالة أسبوع مثلاً
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });

app.use(bodyParser.urlencoded({ extended: true }));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 })); //every 15 min u have 300 req

app.use(express.static("public"));

type TransactionQuery = {
  date?: string;
  type?: string;
  currency?: string;
  payment_method?: string;
  page?: string;
};

const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({
      message: "غير مسجل الدخول",
    });

    return;
  }

  next();
};

app.use("/api/transactions", requireAuth);

app.get(
  "/api/transactions",
  async (req: Request<{}, {}, {}, TransactionQuery>, res: Response, next) => {
    try {
      const { date, type, currency, payment_method, page } = req.query;
      const currentPage = Math.max(1, Number(page) || 1);

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
        `select count(*) as totaltransactions from transactions ${condition} and user_id = $${index}`,
        [...params, req.user!.id],
      );
      const transactionsCount = parseInt(count.rows[0].totaltransactions);

      const totalPages = Math.ceil(transactionsCount / limit);
      const query = await db.query(
        `select * from transactions ${condition} and user_id = $${index}
            ORDER BY date DESC, id DESC    
             LIMIT $${index + 1} OFFSET $${index + 2} `,
        [...params, req.user!.id, limit, offset],
      );

      res.status(200).json({
        transactions: query.rows,
        currentpage: currentPage,
        totalPages: totalPages,
      });
    } catch (error) {
      next(error);
    }
  },
);

function validateTransaction(body: any): string | null {
  const { date, type, amount, currency, payment_method } = body;
  if (!date || !amount || !currency || !type) return "Missing required fields";
  if (isNaN(Number(amount)) || Number(amount) <= 0) return "Invalid amount";
  if (!["in", "out"].includes(type)) return "Invalid type";
  if (!["EGP", "USD"].includes(currency)) return "Invalid currency";
  if (!["cash", "visa"].includes(payment_method))
    return "Invalid payment method";
  return null;
}

app.post("/api/transactions", async (req, res, next) => {
  try {
    const error = validateTransaction(req.body);

    if (error) {
      return res.status(400).json({
        message: error,
      });
    }
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

    const result = await db.query(
      `INSERT INTO transactions
  (date, type, amount, currency, category, description, payment_method, notes,user_id)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8,$9)
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
        req.user?.id,
      ],
    );

    return res.status(201).json({
      message: "Transaction added successfully",
      transaction: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/transactions/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid ID" });
  }
  const error = validateTransaction(req.body);
  if (error) return res.status(400).json({ message: error });

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
  try {
    const result = await db.query(
      `UPDATE transactions
       SET date=$1, type=$2, amount=$3, currency=$4, category=$5,
           description=$6, payment_method=$7, notes=$8
       WHERE id=$9 AND user_id=$10
       RETURNING *`,
      [
        date,
        type,
        amount,
        currency,
        category,
        description ?? null,
        payment_method,
        notes ?? null,
        id,
        req.user!.id,
      ],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.json({
      message: "Transaction updated successfully",
      transaction: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

app.delete("/api/transactions/:id", async (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid ID",
    });
  }

  try {
    const result = await db.query(
      "DELETE FROM transactions WHERE id = $1 and user_id=$2 RETURNING id",
      [id, req.user!.id],
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
    next(error);
  }
});

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error("Google OAuth credentials are missing");
}

// app.get("/api/check-auth", (req, res) => {
//   if (req.isAuthenticated()) {
//     res.json({ isAuthenticated: true, user: req.user });
//   } else {
//     res
//       .status(401)
//       .json({ isAuthenticated: false, message: "غير مسجل الدخول" });
//   }
// });

app.post("/api/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.clearCookie("connect.sid");
      return res.json({ message: "تم تسجيل الخروج بنجاح" });
    });
  });
});

app.get(
  "/api/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: process.env.CLIENT_URL,
  }),
  (req, res) => {
    res.redirect(`${process.env.CLIENT_URL}/home`);
  },
);

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return cb(new Error("Google account has no email"));
        }

        const result = await db.query<User>(
          "SELECT * FROM users WHERE email = $1",
          [email],
        );

        if (result.rows.length === 0) {
          const newUser = await db.query<User>(
            `INSERT INTO users (email, user_password)
             VALUES ($1, $2) RETURNING *`,
            [email, "google"],
          );

          return cb(null, newUser.rows[0]);
        }

        return cb(null, result.rows[0]);
      } catch (err) {
        return cb(
          err instanceof Error
            ? err
            : new Error("Google authentication failed"),
        );
      }
    },
  ),
);

passport.serializeUser((user, cb) => {
  cb(null, user.id);
});

passport.deserializeUser(async (id, cb) => {
  try {
    const result = await db.query<User>("SELECT * FROM users WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return cb(null, false);
    }

    return cb(null, result.rows[0]);
  } catch (err) {
    return cb(
      err instanceof Error ? err : new Error("Failed to deserialize user"),
    );
  }
});

//error middleware
app.use(errorHandler);

app.listen(5000, () => console.log("Server running on port 5000"));
