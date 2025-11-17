import { sql } from "../config/db.js";

// Get all tests
export const getTests = async (req, res) => {
    try {
        const tests = await sql`
        SELECT * FROM test
        ORDER BY created_at DESC
        `;

        res.status(200).json({ success: true, data: tests });
    } catch (error) {
        //Error Handling
        console.log("Error in getTests: " + error.message);
        res.status(500).json({ success: false, message: "Internal Server Error: " + error.message });
    }
};

// Get a single test by its id
export const getTest = async (req, res) => {
    const { id } = req.params;

    try {
        const test = await sql`
        SELECT * FROM test
        WHERE id = ${id}
        `;

        //Check if test was not found
        if (test.length === 0) {
            return res.status(404).json({ success: false, message: "Test not found" });
        }

        res.status(200).json({ success: true, data: test });
    } catch (error) {
        //Error Handling
        console.log("Error in getTest: " + error.message);
        res.status(500).json({ success: false, message: "Internal Server Error: " + error.message });
    }
};

// Create a new test
export const createTest = async (req, res) => {
    
};

// Mark a test as complete
export const completeTest = async (req, res) => {
    const { id } = req.params;
    try {
        const test = await sql`
        UPDATE test
        SET completed_at = NOW()
        WHERE id = ${id}
        RETURNING *
        `;

        res.status(200).json({ success: true, data: test });
    } catch (error) {
        //Error Handling
        console.log("Error in completeTest: " + error.message);
        res.status(500).json({ success: false, message: "Internal Server Error: " + error.message });
    }
};

//Record a shot
export const recordPlayerShot = async (req, res) => {};

//Get all shots for a test by its id
export const getTestShots = async (req, res) => {};

