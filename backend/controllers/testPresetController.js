import { sql } from "../config/db.js";

// Get all test presets with their locations
export const getTestPresets = async (req, res) => {
    try {
        const presets = await sql`
        SELECT 
            tp.id,
            tp.name,
            tp.key,
            tp.description,
            tp.total_shots,
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
        FROM test_preset tp
        LEFT JOIN test_preset_locations tpl ON tp.id = tpl.test_preset_id
        GROUP BY tp.id, tp.name, tp.key, tp.description, tp.total_shots
        ORDER BY tp.id
        `;

        res.status(200).json({ success: true, data: presets });
    } catch (error) {
        //Error Handling
        console.log("Error in getTestPresets: " + error.message);
        res.status(500).json({ success: false, message: "Internal Server Error: " + error.message });
    }
};

