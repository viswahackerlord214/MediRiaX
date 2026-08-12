import { Router } from 'express';
import { searchDoctorsHandler } from '../controllers/doctor.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/v1/doctors
// GET /api/v1/doctors?specialty=Neurosurgery
router.get('/', requireAuth, searchDoctorsHandler);

export default router;