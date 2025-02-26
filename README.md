# NestJS Authentication API

A professional NestJS API with MongoDB integration, JWT authentication, and OTP verification.

## Features

- User registration with email verification
- Login with JWT authentication
- OTP validation for email verification
- Secure password hashing
- MongoDB integration
- Environment configuration
- Email service integration

## Prerequisites

- Node.js (v14 or later)
- MongoDB (running locally or accessible URL)
- SMTP server credentials for sending emails

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the values in `.env` with your configuration

## Environment Variables

- `MONGODB_URI`: MongoDB connection URL
- `JWT_SECRET`: Secret key for JWT token generation
- `JWT_EXPIRATION`: JWT token expiration time
- `SMTP_HOST`: SMTP server host
- `SMTP_PORT`: SMTP server port
- `SMTP_USER`: SMTP server username/email
- `SMTP_PASS`: SMTP server password
- `OTP_EXPIRY`: OTP expiration time in seconds

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```

- `POST /auth/login` - Login user
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

- `POST /auth/verify-otp` - Verify OTP
  ```json
  {
    "email": "john@example.com",
    "otp": "123456"
  }
  ```

- `POST /auth/resend-otp` - Resend OTP
  ```json
  {
    "email": "john@example.com"
  }
  ```

## Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Email verification required
- OTP expiration for security
- Input validation using class-validator
