import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import type { Options } from "pino-http";
import type { IncomingMessage, ServerResponse } from "http";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";

const app: Express = express();

const pinoOptions: Options = {
  logger,
  serializers: {
    req(req: IncomingMessage) {
      return {
        id: req.id,
        method: req.method,
        url: req.url?.split("?")[0],
      };
    },
    res(res: ServerResponse) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
};

app.use(pinoHttp(pinoOptions));
app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(authMiddleware);

app.use("/api", router);

export default app;
