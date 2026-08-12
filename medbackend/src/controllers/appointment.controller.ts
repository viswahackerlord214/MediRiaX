import { Request, Response } from 'express';
import * as appointmentService from '../services/appointment.service';

export const bookAppointmentHandler = async (req: Request, res: Response) => {
    try {
        const patientId = (req as any).user.userId;
        const { doctorId, dateTime, reasonForVisit, sharedRecordIds } = req.body;
        const appointment = await appointmentService.bookAppointment(
            patientId,
            doctorId,
            new Date(dateTime),
            reasonForVisit,
            sharedRecordIds
        );
        res.status(201).json({ status: 'success', data: { appointment } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

export const getDoctorAppointmentsHandler = async (req: Request, res: Response) => {
    try {
        const doctorId = (req as any).user.userId;
        const appointments = await appointmentService.getDoctorAppointments(doctorId);
        res.status(200).json({ status: 'success', data: { appointments } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

export const getSharedAppointmentRecordsHandler = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = (req as any).user.userId;
        const records = await appointmentService.getSharedAppointmentRecords(id, userId);
        res.status(200).json({ status: 'success', data: { records } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

export const updateAppointmentStatusHandler = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = (req as any).user.userId;
        const userRole = (req as any).user.role;
        const { status } = req.body;

        const updatedAppointment = await appointmentService.updateAppointmentStatus(id, userId, userRole, status);
        res.status(200).json({ status: 'success', data: { updatedAppointment } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

export const getPatientAppointmentsHandler = async (req: Request, res: Response) => {
    try {
        const patientId = (req as any).user.userId;
        const userRole = (req as any).user.role;

        if (userRole !== 'PATIENT') {
            res.status(403).json({ status: 'error', message: 'Forbidden: Only patients can access this endpoint' });
            return;
        }

        const appointments = await appointmentService.getPatientAppointments(patientId);
        res.status(200).json({ status: 'success', data: { appointments } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};