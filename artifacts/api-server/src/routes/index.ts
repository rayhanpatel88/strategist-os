import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sessionsRouter from "./sessions";
import diagnosisRouter from "./diagnosis";
import scorecardRouter from "./scorecard";
import promptsRouter from "./prompts";
import opportunityRouter from "./opportunity";
import workflowsRouter from "./workflows";
import plannerRouter from "./planner";
import portfolioRouter from "./portfolio";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sessionsRouter);
router.use(diagnosisRouter);
router.use(scorecardRouter);
router.use(promptsRouter);
router.use(opportunityRouter);
router.use(workflowsRouter);
router.use(plannerRouter);
router.use(portfolioRouter);

export default router;
