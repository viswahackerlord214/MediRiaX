import { Router } from 'express';
import { registerPatientController, loginController, registerDoctorController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { loginSchema } from '../schemas/auth.schema';

const router = Router();

// Map a POST request on the '/register/patient' URL to our Controller
router.post('/register/patient', registerPatientController);

// Import registerDoctorController at the top, then add this line:
router.post('/register/doctor', registerDoctorController);

// Our single, validated login route
router.post('/login', validate(loginSchema), loginController);

export default router;