import express from "express";
import { getTestPresets } from "../controllers/testPresetController.js";

const router = express.Router();

// Get all test presets
router.get("/", getTestPresets);

export default router;

