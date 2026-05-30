import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();

// SECURITY FIX: Restricted CORS to only our frontend domain
app.use(cors({
    origin: 'http://localhost:8080',
    optionsSuccessStatus: 200
}));

app.use(express.json());

// Serve frontend static files from 'public' folder
app.use(express.static('public'));

// Connect all routes
app.use('/', apiRoutes);

// Global Error Handler for unexpected crashes
app.use((err, req, res, next) => {
    console.error("Unhandled Global Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Secure Server running on port ${PORT}`));