import pool from '../config/db.js';

export const getSeats = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM seats");
        res.json(result.rows);
    } catch (ex) {
        res.status(500).json({ error: "Failed to fetch seats" });
    }
};

export const bookSeat = async (req, res) => {
    const conn = await pool.connect();
    try {
        const { id, name } = req.params;
        const userId = req.user.id;

        await conn.query("BEGIN");

        const checkSeat = await conn.query("SELECT isbooked FROM seats WHERE id = $1 FOR UPDATE", [id]);

        if (checkSeat.rows.length === 0) {
            await conn.query("ROLLBACK");
            return res.status(404).json({ error: "Seat not found" });
        }

        if (checkSeat.rows[0].isbooked === 1) {
            await conn.query("ROLLBACK");
            return res.status(400).json({ error: "Seat already booked!" });
        }

        await conn.query("UPDATE seats SET isbooked = 1, name = $1, user_id = $2 WHERE id = $3", [name, userId, id]);

        await conn.query("COMMIT");
        res.json({ message: "Seat booked successfully!" });

    } catch (ex) {
        // BUG FIXED: Now we rollback and prevent connection leaks on error!
        await conn.query("ROLLBACK");
        res.status(500).json({ error: "Error booking seat" });
    } finally {
        // BUG FIXED: Connection is always released back to the pool
        conn.release();
    }
};