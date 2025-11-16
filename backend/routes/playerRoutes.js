import express from "express";
import { 
    getPlayers,
    createPlayer,
    getPlayer,
    updatePlayer,
    deletePlayer,
    getPlayerTests
} from "../controllers/playerController.js";

const router = express.Router();

//Get all players
router.get("/", getPlayers);
//Get a single player by their id
router.get("/:id", getPlayer);
//Create a new player
router.post("/", createPlayer);
//Update a player by their id
router.put("/:id", updatePlayer);
//Delete a player by their id
router.delete("/:id", deletePlayer);
//Get tests for a player by their id
router.get("/:id/tests", getPlayerTests);

export default router;