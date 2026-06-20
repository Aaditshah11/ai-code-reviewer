import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.js";
import authRouter from "./routes/auth.js";
import repositoriesRouter from "./routes/repositories.js";
import connectRouter from "./routes/connect.js";
import webhookRouter from "./routes/webhook.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);
app.use("/webhooks/github", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(cookieParser());

// Basic status route
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// Routes
app.use("/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/repositories", repositoriesRouter);
app.use("/api/repositories", connectRouter);
app.use("/webhooks", webhookRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
