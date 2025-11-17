import express from "express";
import {
    getTests,
    getTest,
    createTest,
    completeTest,
    recordPlayerShot,
    getTestShots
} from "../controllers/testController.js";

const router = express.Router();

// Get all tests
router.get("/", getTests);
// Get a single test by its id
router.get("/:id", getTest);
// Start a new test
router.post("/", createTest);
// Mark a test as complete
router.patch("/:id/complete", completeTest);
//Record a shot
router.post("/:id/shots", recordPlayerShot);
//Get all shots for a test by its id
router.get("/:id/shots", getTestShots);

export default router;