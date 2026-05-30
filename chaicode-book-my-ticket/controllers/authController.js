import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export const register = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: "Email and password required" });

        const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userExists.rows.length > 0) return res.status(400).json({ error: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await pool.query("INSERT INTO users (email, password_hash) VALUES ($1, $2)", [email, hashedPassword]);
        res.status(201).json({ message: "User registered successfully" });
    } catch (ex) {
        res.status(500).json({ error: "Server Error during registration" });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });

        const validPassword = await bcrypt.compare(password, result.rows[0].password_hash);
        if (!validPassword) return res.status(401).json({ error: "Invalid password" });

        const token = jwt.sign({ id: result.rows[0].id, email }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ message: "Login successful", token });
    } catch (ex) {
        res.status(500).json({ error: "Server Error during login" });
    }
};