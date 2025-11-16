import express from "express";
import { getPlayers, createPlayer } from "../controllers/playerController.js";

const router = express.Router();

router.get("/", getPlayers);
router.post("/", createPlayer);

export default router;