import { sql } from "../config/db.js";

//Get all players
export const getPlayers = async (req, res) => {
    try {
        const players = await sql`
        SELECT * FROM player
        ORDER BY created_at DESC
        `;

        console.log("Fetched players");
        res.status(200).json({ success: true, data: players });
    } catch (error) {
        //Error Handling
        console.log("Error in getPlayers: " + error.message);
        res.status(500).json({ success: false, message: "Internal Server Error: " + error.message });
    }
};

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

export const getPlayer = async (req, res) => {
    const { id } = req.params;

    try {
        const player = await sql`
        SELECT * FROM player
        WHERE id = ${id}
        `;

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

export const getPlayerTests = async (req, res) => {
    const { id } = req.params;
    try {
        const tests = await sql`
        SELECT * FROM test
        WHERE player_id = ${id}
        `;

        //Check if tests were not found
        if (tests.length === 0) {
            return res.status(404).json({ success: false, message: "Tests not found" });
        }

        res.status(200).json({ success: true, data: tests });
    } catch (error) {
        //Error Handling
        console.log("Error in getPlayerTests: " + error.message);
        res.status(500).json({ success: false, message: "Internal Server Error: " + error.message });
    }
};