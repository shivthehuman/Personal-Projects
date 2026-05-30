# 🎟️ ChaiCode Hackathon - Book My Ticket (Enterprise Backend Edition)

This repository contains the backend and frontend implementation for the ChaiCode "Book My Ticket" hackathon. The goal was to extend an existing production codebase by adding an authentication layer and protected booking flow without breaking existing endpoints. 

**🏆 Hackathon Result:** Secured Rank 69. 
*Note: Post-evaluation, this repository was heavily refactored from a monolithic MVP into a secure, modular MVC architecture based on strict production-grade feedback.*

## 🏗️ Architecture V2 (Post-Evaluation Refactor)
Following the initial judge evaluation, the codebase was upgraded to meet enterprise standards:
- **MVC Pattern:** Extracted logic from a single file into `controllers/`, `routes/`, and `middlewares/` for scalability.
- **Leak-Proof Transactions:** Added explicit `conn.release()` and `ROLLBACK` within the `catch/finally` blocks to strictly prevent database connection leaks during failed booking attempts.
- **Hardened Security:** Moved all database credentials to `.env` and restricted CORS to specific whitelisted origins.

## 🚀 Features Implemented
- **User Authentication:** Secure Registration and Login using `bcrypt` and `jsonwebtoken`.
- **Protected Routes:** Custom Express middleware (`verifyToken`) to ensure only logged-in users can book seats.
- **Data Integrity:** Used PostgreSQL `UNIQUE` constraints and `FOR UPDATE` transactions to strictly prevent duplicate seat bookings and race conditions.
- **🌟 Premium Frontend Integration:** Built a fully responsive, modern UI using Tailwind CSS grid layouts (replacing the old table structure) and integrated an official **Dark Mode** toggle.

## 🧠 Challenges Faced & Learnings (My Experience)
- **The Evaluation Reality Check:** Scoring 29/50 initially taught me the difference between code that "works" and code that is "production-ready". Fixing the DB connection leak in the `catch` block was my biggest learning in transaction management.
- **The Duplicate Booking Bug:** Initially, my booking API was failing when two requests hit at the exact same millisecond. Revising the SQL class notes on Transactions and `FOR UPDATE` row-level locks helped me fix this race condition!
- **Token Management:** It took me some time to figure out how to pass the JWT from `localStorage` into the `fetch` API headers seamlessly in the frontend.

## 🛠️ Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (`pg` package)
- **Security:** bcrypt, jsonwebtoken, dotenv, cors
- **Frontend:** HTML, Tailwind CSS, Vanilla JavaScript (Fetch API)

## ⚙️ Setup & Installation

**1. Clone the repository**
```bash
git clone [https://github.com/shivthehuman/chaicode-book-my-ticket.git](https://github.com/shivthehuman/chaicode-book-my-ticket.git)
cd chai-book-ticket-hackathon