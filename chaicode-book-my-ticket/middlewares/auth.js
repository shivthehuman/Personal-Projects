import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ error: "Server misconfiguration: JWT secret is missing" });
    }

    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ error: "No token provided!" });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(403).json({ error: "Token format invalid!" });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Unauthorized! Invalid Token." });
        req.user = decoded;
        next();
    });
};