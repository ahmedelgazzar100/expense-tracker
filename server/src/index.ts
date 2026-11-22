import env from "dotenv";
import express from "express";
import type { User } from "../types/user.js";
import type { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import pg from "pg";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import session from "express-session";
env.config();

pg.types.setTypeParser(1082, (val: string) => val);

const app = express();
console.log("CLIENT URL:", process.env.CLIENT_URL);
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

const sessionSecret = process.env.SESSION_SECRET;

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

app.use(express.static("public"));

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
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "غير مسجل الدخول" });
    }
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
        [...params, req.user.id],
      );
      const transactionsCount = parseInt(count.rows[0].totaltransactions);

      const totalPages = Math.ceil(transactionsCount / limit);
      const query = await db.query(
        `select * from transactions ${condition} and user_id = $${index}
            ORDER BY id DESC     
             LIMIT $${index + 1} OFFSET $${index + 2} `,
        [...params, req.user.id, limit, offset],
      );

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
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "غير مسجل الدخول" });
  }
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
    console.log(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
});

app.delete("/api/deleteItem/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "غير مسجل الدخول" });
  }
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid ID",
    });
  }

  try {
    const result = await db.query(
      "DELETE FROM transactions WHERE id = $1 and user_id=$2 RETURNING id",
      [id, req.user.id],
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

app.get("/api/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) {
        return console.log("Error destroying session:", err);
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

app.listen(5000, () => console.log("Server running on port 5000"));
