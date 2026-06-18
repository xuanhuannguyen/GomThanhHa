import cors from "cors";
import express from "express";
import helmet from "helmet";
import { allowedOrigins, env } from "./config/env.js";
import { adminRouter } from "./routes/admin.js";
import { publicRouter } from "./routes/public.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin không được phép"));
    }
  })
);
app.use(express.json({ limit: "1mb" }));

app.use(publicRouter);
app.use("/admin", adminRouter);

app.listen(env.PORT, () => {
  console.log(`API ready on port ${env.PORT}`);
});
