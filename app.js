const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const userRoutes = require("./routes/user");
const assetRoutes = require("./routes/asset");
const p2pRoutes = require("./routes/p2p");
const historyRoutes = require("./routes/history");
const cronRoutes = require("./routes/cron");

const checkAuth = require("./middleware/auth");
const cacheProvider = require("./utils/cache-provider");
const MongoStore = require("connect-mongo");

const app = express();

// Start cache provider
cacheProvider.start(function (err) {
  if (err) console.error(err);
});

const mongoUrl = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.e1w4v.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl,
      collectionName: "sessions",
      ttl: 14 * 24 * 60 * 60,
      autoRemove: "native",
    }),
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: "Lax",
    },
  })
);

// Parse JSON bodies
app.use(bodyParser.json());

// CORS configuration
app.use((req, res, next) => {
  const allowedOrigins = ["https://finport.telesto.dev", "http://localhost:3006"];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, x-client-key, x-client-token, x-client-secret, x-cyclic, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});

// Middleware to exclude certain paths from authentication
const unless =
  (middleware, ...paths) =>
  (req, res, next) =>
    paths.some((path) => new RegExp(`^${path}$`).test(req.path))
      ? next()
      : middleware(req, res, next);

// Apply authentication middleware (except for excluded paths)
app.use(
  unless(
    checkAuth,
    "/api/users/login",
    "/api/users/signup",
    "/api/users/verify",
    "/api/users/reset",
    "/api/users/changePassword"
  )
);

// Routes
app.use("/cron", cronRoutes);
app.use("/api/users", userRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/p2p", p2pRoutes);
app.use("/api/history", historyRoutes);

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500).json({
    message: error.message || "An unknown error occurred!",
  });
});

mongoose
  .connect(mongoUrl)
  .then(() => {
    app.listen(process.env.PORT || 3005);
  })
  .catch((err) => {
    console.log(err);
  });
