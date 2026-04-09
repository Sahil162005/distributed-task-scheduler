import express from "express";
import { CreateJob } from "../controller/job.controller.js";
import { GetJobById } from "../controller/job.controller.js";
import { AuthMiddle } from "../middleware/authMiddleware.js";
import { validateJobtype } from "../middleware/jobValidation.js";

const router = express.Router();

router.post("/", AuthMiddle, validateJobtype, CreateJob);
router.get("/:id", AuthMiddle, GetJobById);

export default router;
