import 'dotenv/config';
import cors from 'cors';
import patientRoutes from './routes/patient.routes';
import recordRoutes from './routes/record.routes';
import express, { Request, Response } from 'express';
import authRoutes from './routes/auth.routes';
import appointmentRoutes from './routes/appointment.routes';
import doctorRoutes from './routes/doctor.routes';
import notificationRoutes from './routes/notification.routes';
import chatRoutes from './routes/chat.routes';
// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 3000;

import path from 'path';

// Middleware to parse JSON bodies (so we can read req.body)
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patient', patientRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/records', recordRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/chats', chatRoutes);

// A simple Health Check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'success',
        message: 'MediRiaX API is running smoothly!',
        timestamp: new Date().toISOString()
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});