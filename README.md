# MediRiaX - Intelligent Healthcare Ecosystem

MediRiaX is a comprehensive full-stack healthcare platform designed to seamlessly connect patients and medical professionals. It provides a centralized hub for scheduling consultations, securely managing medical records, and facilitating communication between doctors and patients.

## 🌟 Key Features

* **Role-Based Portals**: Distinct dashboards and experiences for Patients and Doctors.
* **Secure Authentication**: Stateless JWT-based authentication with bcrypt password hashing.
* **Appointment Booking**: Patients can search for specialists and book appointments seamlessly.
* **Medical Record Management**: Patients can securely upload PDF lab reports and X-rays (powered by Supabase Storage with local fallback).
* **Clinical Notes**: Doctors can issue post-visit clinical records, diagnoses, and prescriptions directly to the patient's profile.
* **Consultation Chat**: Post-booking chat interfaces to facilitate communication before or after a consultation.

## 🛠 Tech Stack

### Frontend
* **Framework**: [Next.js](https://nextjs.org/) (App Router)
* **Language**: TypeScript
* **Styling**: Tailwind CSS
* **Icons**: Lucide React
* **State Management**: React Context API

### Backend
* **Framework**: Node.js & [Express.js](https://expressjs.com/)
* **Language**: TypeScript
* **Database**: PostgreSQL
* **ORM**: [Prisma](https://www.prisma.io/)
* **Storage**: Supabase Storage
* **Security**: JSON Web Tokens (JWT) & bcrypt

---

## 🚀 Getting Started

Follow these steps to set up the project locally. The repository is split into two separate servers for the frontend and backend.

### Prerequisites
* Node.js (v18 or higher)
* PostgreSQL database
* Supabase Account (optional, falls back to local storage if not provided)

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd medbackend

# Install dependencies
npm install

# Configure environment variables
# Create a .env file based on standard requirements
# DATABASE_URL="postgresql://user:password@localhost:5432/mediriax?schema=public"
# JWT_SECRET="your_super_secret_jwt_key"
# SUPABASE_URL="your_supabase_url"
# SUPABASE_ANON_KEY="your_supabase_anon_key"

# Apply database migrations
npx prisma db push
# Or, if you want to generate the client:
npx prisma generate

# Start the development server (runs on http://localhost:3000)
npm run dev
```

### 2. Frontend Setup

```bash
# Navigate to the frontend directory
cd medfrontend

# Install dependencies
npm install

# Configure environment variables
# Create a .env.local file
# NEXT_PUBLIC_API_URL="http://localhost:3000/api/v1"

# Start the Next.js development server (runs on http://localhost:3001)
npm run dev
```

## 📁 Repository Structure

```
mediriax/
├── medbackend/                 # Node.js / Express backend
│   ├── prisma/                 # Database schema and migrations
│   ├── src/
│   │   ├── controllers/        # HTTP route handlers
│   │   ├── middlewares/        # Express middlewares (Auth, Upload)
│   │   ├── routes/             # API route definitions
│   │   ├── services/           # Business logic and DB operations
│   │   └── app.ts              # Express application entry point
│   └── package.json
│
├── medfrontend/                # Next.js frontend
│   ├── app/                    # Next.js App Router pages and layouts
│   ├── components/             # Reusable React components
│   ├── context/                # React Context providers (AuthContext)
│   ├── lib/                    # Utilities, types, and API client
│   └── package.json
```

## 🔐 Security Note
This project uses local storage for JWT management. For a production environment, it is highly recommended to migrate to HttpOnly cookies for enhanced security against XSS attacks.
