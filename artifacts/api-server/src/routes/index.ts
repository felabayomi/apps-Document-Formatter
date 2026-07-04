import { Router, type IRouter } from "express";
import healthRouter from "./health";
import formatRouter from "./format";
import extractRouter from "./extract";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/format", formatRouter);
router.use("/format/extract", extractRouter);

export default router;
