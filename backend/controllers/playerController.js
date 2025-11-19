import { sql } from "../config/db.js";

//Get all players
export const getPlayers = async (req, res) => {
    try {
        const players = await sql`
        SELECT * FROM player
        ORDER BY created_at DESC
        `;

        res.status(200).json({ success: true, data: players });
    } catch (error) {
        //Error Handling
        console.log("Error in getPlayers: " + error.message);
        res.status(500).json({ success: false, message: "Internal Server Error: " + error.message });
    }
};

//Create a new player
export const createPlayer = async (req, res) => {
    //Destructure request to get name, team, and number
    const { name, team, number } = req.body;

    //Check if name is included, since it is required
     if (!name) {
        return res.status(400).json({ success: false, message: "Name is required" });
     }

    try {
        const newPlayer = await sql`
        INSERT INTO player (name, team, number)
        VALUES (${name}, ${team}, ${number})
        RETURNING *
        `;
        res.status(201).json({ success: true, data: newPlayer[0] });
    } catch (error) {
        //Error Handling
        console.log("Error in createPlayer: " + error.message);
        res.status(500).json({ success: false, message: "Internal Server Error: " + error.message });
    }
};

//Get a single player by their id
export const getPlayer = async (req, res) => {
    const { id } = req.params;

    try {
        const player = await sql`
        SELECT * FROM player
        WHERE id = ${id}
        `;

        //Check if player was not found
        if (player.length === 0) {
            return res.status(404).json({ success: false, message: "Player not found" });
        }

        res.status(200).json({ success: true, data: player[0] });
    } catch (error) {
        //Error Handling
        console.log("Error in getPlayer: " + error.message);
        res.status(500).json({ success: false, message: "Internal Server Error: " + error.message });
    }
};

//Update a player by their id
export const updatePlayer = async (req, res) => {
    const { id } = req.params;
    //Destructure request to get name, team, and number
    const { name, team, number } = req.body;

    try {
        const updatedPlayer = await sql`
        UPDATE player
        SET name = ${name}, team = ${team}, number = ${number}
        WHERE id = ${id}
        RETURNING *
        `;

        //Check if player was not found
        if (updatedPlayer.length === 0) {
            return res.status(404).json({ success: false, message: "Player not found" });
        }

        res.status(200).json({ success: true, data: updatedPlayer[0] });
    } catch (error) {
        //Error Handling
        console.log("Error in updatePlayer: " + error.message);
        res.status(500).json({ success: false, message: "Internal Server Error: " + error.message });
    }
};

//Delete a player by their id
export const deletePlayer = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedPlayer = await sql`
        DELETE FROM player
        WHERE id = ${id}
        RETURNING *
        `;

        //Check if player was not found
        if (deletedPlayer.length === 0) {
            return res.status(404).json({ success: false, message: "Player not found" });
        }

        res.status(200).json({ success: true, data: deletedPlayer[0] });
    } catch (error) {
        //Error Handling
        console.log("Error in deletePlayer: " + error.message);
        res.status(500).json({ success: false, message: "Internal Server Error: " + error.message });
    }
};

//Get tests for a player by their id
export const getPlayerTests = async (req, res) => {
    const { id } = req.params;
    try {
        const tests = await sql`
        SELECT 
            t.id,
            t.total_makes,
            t.total_attempts,
            t.started_at,
            t.completed_at,
            COALESCE(
                (SELECT SUM(COALESCE(tpl.shot_value, 0))
                 FROM shot s
                 LEFT JOIN test_preset_locations tpl ON t.test_preset_id = tpl.test_preset_id 
                     AND s.court_location = tpl.location_key
                 WHERE s.test_id = t.id AND s.made = true),
                0
            ) as total_points,
            json_build_object(
                'id', tp.id,
                'name', tp.name,
                'key', tp.key,
                'description', tp.description,
                'total_shots', tp.total_shots
            ) as test_preset
        FROM test t
        INNER JOIN test_preset tp ON t.test_preset_id = tp.id
        WHERE t.player_id = ${id}
        AND t.completed_at IS NOT NULL
        ORDER BY t.completed_at DESC
        `;

        res.status(200).json({ success: true, data: tests });
    } catch (error) {
        //Error Handling
        console.log("Error in getPlayerTests: " + error.message);
        res.status(500).json({ success: false, message: "Internal Server Error: " + error.message });
    }
};

//TODO Nightmare to fetch all these stats on the frontend, so putting it here in its own function but possibly not the best solution
//Get player stats
export const getPlayerStats = async (req, res) => {
    const { id } = req.params;
    try {
        const stats = await sql`
        WITH player_tests AS (
            SELECT 
                t.id,
                t.total_makes,
                t.total_attempts,
                t.completed_at
            FROM test t
            WHERE t.player_id = ${id}
            AND t.completed_at IS NOT NULL
        ),
        player_shots AS (
            SELECT 
                s.made,
                s.court_location,
                COALESCE(tpl.shot_value, 0) as shot_value
            FROM shot s
            INNER JOIN test t ON s.test_id = t.id
            LEFT JOIN test_preset_locations tpl ON t.test_preset_id = tpl.test_preset_id 
                AND s.court_location = tpl.location_key
            WHERE t.player_id = ${id}
        )
        SELECT 
            COUNT(*) as total_tests,
            COALESCE(SUM(total_attempts), 0) as total_attempts,
            COALESCE(SUM(total_makes), 0) as total_makes,
            (SELECT COALESCE(SUM(shot_value), 0) FROM player_shots WHERE made = true) as total_points,
            COALESCE(ROUND(AVG(CASE WHEN total_attempts > 0 THEN (total_makes::numeric / total_attempts::numeric) * 100 ELSE 0 END), 2), 0) as avg_accuracy,
            COALESCE(ROUND(MAX(CASE WHEN total_attempts > 0 THEN (total_makes::numeric / total_attempts::numeric) * 100 ELSE 0 END), 2), 0) as best_accuracy,
            COALESCE(ROUND(MIN(CASE WHEN total_attempts > 0 THEN (total_makes::numeric / total_attempts::numeric) * 100 ELSE 0 END), 2), 0) as worst_accuracy
        FROM player_tests
        `;

        res.status(200).json({ success: true, data: stats[0] });
    } catch (error) {
        //Error Handling
        console.log("Error in getPlayerStats: " + error.message);
        res.status(500).json({ success: false, message: "Internal Server Error: " + error.message });
    }
};

//Get leaderboard (limit to top 5 players)
export const getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await sql`
        WITH player_stats AS (
            SELECT 
                p.id,
                p.name,
                p.team,
                p.number,
                COUNT(DISTINCT t.id) FILTER (WHERE t.completed_at IS NOT NULL) as total_tests,
                COALESCE(SUM(t.total_attempts) FILTER (WHERE t.completed_at IS NOT NULL), 0) as total_attempts,
                COALESCE(SUM(t.total_makes) FILTER (WHERE t.completed_at IS NOT NULL), 0) as total_makes,
                COALESCE(
                    (SELECT SUM(COALESCE(tpl.shot_value, 0))
                     FROM shot s
                     INNER JOIN test t2 ON s.test_id = t2.id
                     LEFT JOIN test_preset_locations tpl ON t2.test_preset_id = tpl.test_preset_id 
                         AND s.court_location = tpl.location_key
                     WHERE t2.player_id = p.id AND s.made = true),
                    0
                ) as total_points,
                COALESCE(
                    ROUND(
                        AVG(CASE 
                            WHEN t.total_attempts > 0 
                            THEN (t.total_makes::numeric / t.total_attempts::numeric) * 100 
                            ELSE 0 
                        END) FILTER (WHERE t.completed_at IS NOT NULL),
                        2
                    ),
                    0
                ) as avg_accuracy
            FROM player p
            LEFT JOIN test t ON p.id = t.player_id
            GROUP BY p.id, p.name, p.team, p.number
            HAVING COUNT(DISTINCT t.id) FILTER (WHERE t.completed_at IS NOT NULL) > 0
        )
        SELECT 
            id,
            name,
            team,
            number,
            total_tests,
            total_points,
            avg_accuracy
        FROM player_stats
        ORDER BY 
            avg_accuracy DESC,
            total_points DESC,
            total_tests DESC,
            name ASC
        LIMIT 5
        `;

        res.status(200).json({ success: true, data: leaderboard });
    } catch (error) {
        //Error Handling
        console.log("Error in getLeaderboard: " + error.message);
        res.status(500).json({ success: false, message: "Internal Server Error: " + error.message });
    }
};