import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import {
    bookAppointmentHandler,
    getDoctorAppointmentsHandler,
    updateAppointmentStatusHandler,
    getPatientAppointmentsHandler,
    getSharedAppointmentRecordsHandler
} from '../controllers/appointment.controller';

const router = Router();

// POST /api/v1/appointments - Book a new appointment
router.post('/', requireAuth, bookAppointmentHandler);

// GET /api/v1/appointments/my-appointments - Patient dashboard
router.get('/my-appointments', requireAuth, getPatientAppointmentsHandler);

// GET /api/v1/appointments/doctor - Doctor dashboard
router.get('/doctor', requireAuth, getDoctorAppointmentsHandler);

// GET /api/v1/appointments/:id/shared-records - Privacy-scoped shared records
router.get('/:id/shared-records', requireAuth, getSharedAppointmentRecordsHandler);

// PATCH /api/v1/appointments/:id/status - Update appointment status
router.patch('/:id/status', requireAuth, updateAppointmentStatusHandler);

export default router;