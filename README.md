# RailBuddy - Railway Online Booking System

A comprehensive railway ticket booking system built with React, TypeScript, NodeJS, ExpressJS and PostgreSQL. This application provides a complete solution for train ticket booking with separate interfaces for users and administrators.

## Features

### User Features

-   **User Registration & Authentication**: Secure user registration and login system
-   **Train Search**: Search trains by source, destination, and travel date
-   **Station Autocomplete**: Smart station search with autocomplete functionality
-   **Ticket Booking**: Book tickets with passenger details and seat selection
-   **Multiple Classes**: Support for Sleeper (SL), 3AC, 2AC, and 1AC classes
-   **Booking Management**: View upcoming, past, and cancelled bookings
-   **Ticket Download**: Generate and download PDF tickets
-   **Profile Management**: Update personal information and change passwords
-   **Travel History**: Visual representation of travel patterns and spending

### Admin Features

-   **Admin Dashboard**: Comprehensive overview of system statistics
-   **Train Management**: Add, edit, and delete train information
-   **Booking Management**: View and manage all customer bookings
-   **Report Generation**: Generate various reports (Daily, Revenue, Performance, etc.)
-   **Export Options**: Download reports in PDF, CSV, and Excel formats
-   **Real-time Analytics**: Visual charts and graphs for business insights

## Technology Stack

### Frontend

-   **React 18** with TypeScript
-   **Tailwind CSS** for styling
-   **React Router** for navigation
-   **Chart.js** for data visualization
-   **React-hot-toast** for notifications
-   **Lucide React** for icons
-   **jsPDF** for PDF generation

### Backend

-   **NodeJs** with ExpressJs
-   **TypeScript** for type safety
-   **PostgreSQL** with Neon Database
-   **JWT** for authentication
-   **bcryptjs** for password hashing
-   **Zod** for data validation

## Prerequisites

Before running this application, make sure you have the following installed:

-   Node.js (v18 or higher)
-   npm or yarn
-   PostgreSQL database (or Neon Database account)

## Installation & Setup

### 1. Fork this and Clone your Repository

```bash
git clone https://github.com/<your-username>/rbms
cd rbms
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### 4. Environment Configuration

Create a `.env` file in the `backend` directory:

```env
# Database Configuration
DATABASE_URL=your_postgresql_connection_string

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Server Configuration
PORT=5000
NODE_ENV=development

# Email Configuration
EMAIL_PROVIDER=resend
SKIP_EMAIL_SENDING=false
RESEND_API_KEY=<resend-api-key>
FROM_EMAIL="RailBuddy" <support@example.com>
```

### 5. Database Setup

The application will automatically create the required tables on startup. The database schema includes:

-   **users**: User account information
-   **trains**: Train details and schedules
-   **train_classes**: Class configurations for each train
-   **bookings**: Booking records
-   **passengers**: Passenger details for each booking

### 6. Start the Application

#### Development Mode

Start the backend server:

```bash
cd backend
npm run dev
```

Start the frontend development server:

```bash
cd frontend
npm run dev
```

## Configuration

### Default User Account

A demo user account is available:

-   **Email**: fahad@mail.com
-   **Password**: Pass@1234

## Usage

### For Users

1. **Registration**: Create a new account or use the demo credentials
2. **Search Trains**: Enter source, destination, and travel date
3. **Book Tickets**: Select train, class, and enter passenger details
4. **Manage Bookings**: View, download tickets, or cancel bookings
5. **Profile Management**: Update personal information

### For Administrators

1. **Login**: Use admin credentials to access admin panel
2. **Manage Trains**: Add new trains or modify existing ones
3. **View Bookings**: Monitor all customer bookings
4. **Generate Reports**: Create various business reports
5. **Support Messages**: See and respond all the user support messages
6. **Analytics**: View dashboard with real-time statistics

## Project Structure

```
railway-booking-system/
├── src/                         # Frontend source code
│   ├── components/              # Reusable React components
│   │   ├── auth/                # Authentication components
│   │   ├── common/              # Common components (Navbar, Footer)
│   │   └── search/              # Search-related components
│   ├── contexts/                # React contexts
│   ├── pages/                   # Page components
│   │   ├── admin/               # Admin pages
│   │   └── user/                # User pages
│   ├── services/                # API service functions
│   ├── utils/                   # Utility functions
│   └── styles/                  # CSS and styling files
├── backend/                     # Backend source code
│   ├── src/
│   │   ├── config/              # Database configuration
│   │   ├── controllers/         # Route controllers
│   │   ├── middleware/          # Express middleware
│   │   ├── routes/              # API routes
│   │   └── utils/               # Backend utilities
│   └── package.json
├── public/                      # Static assets
└── package.json
```

## Security Features

-   **JWT Authentication**: Secure token-based authentication
-   **Password Hashing**: bcrypt for secure password storage
-   **Input Validation**: Zod schemas for data validation
-   **SQL Injection Protection**: Parameterized queries
-   **Role-based Access Control**: Separate user and admin roles

## Database Schema

### Users Table

-   id (UUID, Primary Key)
-   name (VARCHAR)
-   email (VARCHAR, Unique)
-   phone (VARCHAR)
-   password_hash (TEXT)
-   role (VARCHAR) - 'user' or 'admin'
-   created_at (TIMESTAMP)

### Trains Table

-   id (UUID, Primary Key)
-   number (VARCHAR, Unique)
-   name (VARCHAR)
-   source/destination (VARCHAR)
-   departure_time/arrival_time (TIME)
-   duration (VARCHAR)
-   distance (VARCHAR)
-   running_days (TEXT[])

### Bookings Table

-   id (UUID, Primary Key)
-   user_id (UUID, Foreign Key)
-   train_id (UUID, Foreign Key)
-   pnr (VARCHAR, Unique)
-   class_type (VARCHAR)
-   travel_date (DATE)
-   total_fare (DECIMAL)
-   status (VARCHAR)

## Deployment

### Frontend Deployment

The frontend can be deployed to platforms like:

-   Vercel
-   Netlify
-   AWS S3 + CloudFront

### Backend Deployment

The backend can be deployed to:

-   AWS EC2
-   DigitalOcean
-   Render
-   Railway

### Database

-   Neon Database

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## API Documentation

### Authentication Endpoints

-   `POST /api/auth/register` - User registration
-   `POST /api/auth/login` - User login
-   `GET /api/auth/verify` - Verify JWT token

### Train Endpoints

-   `GET /api/trains/search` - Search trains
-   `GET /api/trains/stations` - Get station suggestions
-   `POST /api/trains` - Create train (Admin only)
-   `PUT /api/trains/:id` - Update train (Admin only)
-   `DELETE /api/trains/:id` - Delete train (Admin only)

### Booking Endpoints

-   `POST /api/bookings` - Create booking
-   `GET /api/bookings/user/:userId` - Get user bookings
-   `GET /api/bookings` - Get all bookings (Admin only)
-   `PUT /api/bookings/:id/cancel` - Cancel booking

## Acknowledgments

-   React team for the amazing framework
-   Tailwind CSS for the utility-first CSS framework
-   Neon Database for the serverless PostgreSQL
-   All contributors who willing to contribute in this project

---
