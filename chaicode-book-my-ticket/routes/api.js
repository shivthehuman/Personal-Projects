import express from 'express';
import { register, login } from '../controllers/authController.js';
import { getSeats, bookSeat } from '../controllers/bookingController.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

// Public Routes
router.post('/register', register);
router.post('/login', login);
router.get('/seats', getSeats);

// Protected Routes
router.put('/:id/:name', verifyToken, bookSeat);

export default router;