import express from "express";
import {
  getAllLogs,
  getAdminUsersWithLogs,
  getLogActionTypes,
} from "../controllers/adminLogController.js";
import { protect, admin } from "../../middleware/authMiddleware.js";

const router = express.Router();

// All routes here are protected and for admins only
router.use(protect);
router.use(admin);

router.route("/").get(getAllLogs);
router.route("/admins").get(getAdminUsersWithLogs);
router.route("/actions").get(getLogActionTypes);

export default router;
