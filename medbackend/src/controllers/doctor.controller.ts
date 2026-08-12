import { Request, Response } from 'express';
import * as doctorService from '../services/doctor.service';

export const searchDoctorsHandler = async (req: Request, res: Response) => {
    try {
        // Extract the 'specialty' query parameter from the URL
        const { specialty } = req.query;

        const doctors = await doctorService.searchDoctors(specialty as string);

        res.status(200).json({
            status: 'success',
            data: { doctors }
        });
    } catch (error: any) {
        res.status(400).json({
            status: 'error',
            message: error.message || 'Error fetching doctors'
        });
    }
};