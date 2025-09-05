# Backend - MERN Auth & Chatbot

This is the backend for the MERN Auth & Integrated Chatbot project. It provides REST APIs for authentication, user management, email verification, password reset, and chatbot integration.

## Features

- User registration & login (email/password)
- Google OAuth 2.0 login
- Email verification (with secure token)
- Password reset (OTP via email)
- JWT-based session management
- Nodemailer for email delivery
- MongoDB with Mongoose
- Passport.js for OAuth

## Setup

1. `cd backend`
2. `npm install`
3. Create a `.env` file (see `.env.example`):
   - `MONGO_URI=...`
   - `PORT=8000`
   - `MAIL_USER=...`
   - `MAIL_PASS=...`
   - `SECRET_KEY=...`
   - `GOOGLE_CLIENT_ID=...`
   - `GOOGLE_CLIENT_SECRET=...`
   - `CLIENT_URL=http://localhost:5173`
4. `npm start`

## Folder Structure

- `controllers/` - Auth, user, email logic
- `models/` - Mongoose schemas
- `routes/` - API endpoints
- `emailVerify/` - Email templates & logic
- `config/` - Passport, env

## Future Add-ons

- Role-based access
- User profile & avatar
- Chatbot conversation history
- Tests & CI/CD

---

MIT License
