import { sql } from "../config/db.js";

// Get all tests
export const getTests = async (req, res) => {
    try {
        const tests = await sql`
        SELECT 
            t.id,
            t.total_makes,
            t.total_attempts,
            t.started_at,
            t.completed_at,
            json_build_object(
                'id', p.id,
                'name', p.name,
                'team', p.team,
                'number', p.number
            ) as player,
            json_build_object(
                'id', tp.id,
                'name', tp.name,
                'key', tp.key,
                'description', tp.description,
                'total_shots', tp.total_shots
            ) as test_preset
        FROM test t
        INNER JOIN player p ON t.player_id = p.id
        INNER JOIN test_preset tp ON t.test_preset_id = tp.id
        WHERE t.completed_at IS NOT NULL
        ORDER BY t.started_at DESC
        LIMIT 20
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
        SELECT 
            t.id,
            t.player_id,
            t.test_preset_id,
            t.total_makes,
            t.total_attempts,
            t.started_at,
            t.completed_at,
            json_build_object(
                'id', p.id,
                'name', p.name,
                'team', p.team,
                'number', p.number
            ) as player,
            json_build_object(
                'id', tp.id,
                'name', tp.name,
                'key', tp.key,
                'description', tp.description,
                'total_shots', tp.total_shots
            ) as test_preset,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', tpl.id,
                        'location_name', tpl.location_name,
                        'location_key', tpl.location_key,
                        'shot_order', tpl.shot_order,
                        'planned_shots', tpl.planned_shots
                    ) ORDER BY tpl.shot_order
                ) FILTER (WHERE tpl.id IS NOT NULL),
                '[]'::json
            ) as locations
        FROM test t
        INNER JOIN player p ON t.player_id = p.id
        INNER JOIN test_preset tp ON t.test_preset_id = tp.id
        LEFT JOIN test_preset_locations tpl ON tp.id = tpl.test_preset_id
        WHERE t.id = ${id}
        GROUP BY t.id, t.player_id, t.test_preset_id, t.total_makes, t.total_attempts, t.started_at, t.completed_at, p.id, p.name, p.team, p.number, tp.id, tp.name, tp.key, tp.description, tp.total_shots
        `;

        //Check if test was not found
        if (test.length === 0) {
            return res.status(404).json({ success: false, message: "Test not found" });
        }

        res.status(200).json({ success: true, data: test[0] });
    } catch (error) {
        //Error Handling
        console.log("Error in getTest: " + error.message);
        res.status(500).json({ success: false, message: "Internal Server Error: " + error.message });
    }
};

// Create a new test
export const createTest = async (req, res) => {
    const { player_id, test_preset_id } = req.body;

    if (!player_id || !test_preset_id) {
        return res.status(400).json({ success: false, message: "player_id and test_preset_id are required" });
    }

    try {
        const newTest = await sql`
        INSERT INTO test (player_id, test_preset_id)
        VALUES (${player_id}, ${test_preset_id})
        RETURNING *
        `;

        const test = await sql`
        SELECT 
            t.id,
            t.player_id,
            t.test_preset_id,
            t.total_makes,
            t.total_attempts,
            t.started_at,
            t.completed_at,
            json_build_object(
                'id', p.id,
                'name', p.name,
                'team', p.team,
                'number', p.number
            ) as player,
            json_build_object(
                'id', tp.id,
                'name', tp.name,
                'key', tp.key,
                'description', tp.description,
                'total_shots', tp.total_shots
            ) as test_preset,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', tpl.id,
                        'location_name', tpl.location_name,
                        'location_key', tpl.location_key,
                        'shot_order', tpl.shot_order,
                        'planned_shots', tpl.planned_shots
                    ) ORDER BY tpl.shot_order
                ) FILTER (WHERE tpl.id IS NOT NULL),
                '[]'::json
            ) as locations
        FROM test t
        INNER JOIN player p ON t.player_id = p.id
        INNER JOIN test_preset tp ON t.test_preset_id = tp.id
        LEFT JOIN test_preset_locations tpl ON tp.id = tpl.test_preset_id
        WHERE t.id = ${newTest[0].id}
        GROUP BY t.id, t.player_id, t.test_preset_id, t.total_makes, t.total_attempts, t.started_at, t.completed_at, p.id, p.name, p.team, p.number, tp.id, tp.name, tp.key, tp.description, tp.total_shots
        `;

        res.status(201).json({ success: true, data: test[0] });
    } catch (error) {
        //Error Handling
        console.log("Error in createTest: " + error.message);
        res.status(500).json({ success: false, message: "Internal Server Error: " + error.message });
    }
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

//Record all shots for a test
export const recordPlayerShot = async (req, res) => {
    const { id } = req.params;
    const { shots } = req.body;

    if (!shots || !Array.isArray(shots) || shots.length === 0) {
        return res.status(400).json({ success: false, message: "shots array is required" });
    }

    try {
        let totalMakes = 0;
        let totalAttempts = shots.length;

        for (const shot of shots) {
            const { shot_index, court_location, made } = shot;
            
            if (made) {
                totalMakes++;
            }

            await sql`
            INSERT INTO shot (test_id, shot_index, court_location, made)
            VALUES (${id}, ${shot_index}, ${court_location}, ${made})
            `;
        }

        const updatedTest = await sql`
        UPDATE test
        SET total_makes = ${totalMakes}, total_attempts = ${totalAttempts}
        WHERE id = ${id}
        RETURNING *
        `;

        res.status(200).json({ success: true, data: updatedTest[0] });
    } catch (error) {
        //Error Handling
        console.log("Error in recordPlayerShot: " + error.message);
        res.status(500).json({ success: false, message: "Internal Server Error: " + error.message });
    }
};

//Get all shots for a test by its id
export const getTestShots = async (req, res) => {};

