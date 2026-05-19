import { Router, type IRouter } from "express";
import healthRouter from "./health";
import diseasesRouter from "./diseases";
import symptomsRouter from "./symptoms";
import bmiRouter from "./bmi";
import openaiRouter from "./openai";
import authRouter from "./auth";
import historyRouter from "./history";
import dietRouter from "./diet";

const router: IRouter = Router();

router.use(healthRouter);
router.use(diseasesRouter);
router.use(symptomsRouter);
router.use(bmiRouter);
router.use(openaiRouter);
router.use(authRouter);
router.use(historyRouter);
router.use(dietRouter);

export default router;
