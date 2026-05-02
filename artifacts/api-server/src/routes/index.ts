import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import healthRouter from "./health";
import sessionsRouter from "./sessions";
import diagnosisRouter from "./diagnosis";
import scorecardRouter from "./scorecard";
import promptsRouter from "./prompts";
import opportunityRouter from "./opportunity";
import workflowsRouter from "./workflows";
import plannerRouter from "./planner";
import portfolioRouter from "./portfolio";
import enquiriesRouter from "./enquiries";
import calendarRouter from "./calendar";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);

router.use(requireAuth);

router.use(sessionsRouter);
router.use(diagnosisRouter);
router.use(scorecardRouter);
router.use(promptsRouter);
router.use(opportunityRouter);
router.use(workflowsRouter);
router.use(plannerRouter);
router.use(portfolioRouter);
router.use(enquiriesRouter);
router.use(calendarRouter);
router.use(settingsRouter);

export default router;
