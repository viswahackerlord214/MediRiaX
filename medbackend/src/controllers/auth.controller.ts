import { Request, Response } from 'express';
import { registerPatient, loginUser, registerDoctor } from '../services/auth.service';

export const registerPatientController = async (req: Request, res: Response) => {
    try {
        // 1. Extract data from the incoming HTTP Request body
        const { email, password, firstName, lastName, dateOfBirth, contactNumber } = req.body;

        if (!email || !password || !firstName || !lastName || !dateOfBirth || !contactNumber) {
            res.status(400).json({
                status: 'error',
                message: 'All fields (email, password, firstName, lastName, dateOfBirth, contactNumber) are required.'
            });
            return;
        }

        const dobDate = new Date(dateOfBirth);
        if (isNaN(dobDate.getTime())) {
            res.status(400).json({
                status: 'error',
                message: 'Invalid dateOfBirth format provided.'
            });
            return;
        }

        // 2. Pass the data to our Service Layer (The Brain)
        const newUser = await registerPatient(
            email.trim().toLowerCase(),
            password,
            firstName.trim(),
            lastName.trim(),
            dobDate, // Convert string to Date object for Prisma
            contactNumber.trim()
        );

        // 3. Send a successful HTTP Response back to the client
        res.status(201).json({
            status: 'success',
            message: 'Patient registered successfully',
            data: {
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    role: newUser.role
                }
            }
        });
    } catch (error: any) {
        // 4. Handle any errors (like if the email already exists)
        res.status(400).json({
            status: 'error',
            message: error.message || 'An error occurred during registration'
        });
    }
};

export const loginController = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const { user, token } = await loginUser(email, password);

        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            data: {
                token, // 👈 Here is the JWT!
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role
                }
            }
        });
    } catch (error: any) {
        res.status(401).json({
            status: 'error',
            message: error.message || 'Invalid credentials'
        });

    }
};

// Don't forget to import registerDoctor at the top!
export const registerDoctorController = async (req: Request, res: Response) => {
    try {
        const { email, password, firstName, lastName, specialization, licenseNumber } = req.body;

        if (!email || !password || !firstName || !lastName || !specialization || !licenseNumber) {
            res.status(400).json({
                status: 'error',
                message: 'All fields (email, password, firstName, lastName, specialization, licenseNumber) are required.'
            });
            return;
        }

        const newDoctor = await registerDoctor(
            email.trim().toLowerCase(),
            password,
            firstName.trim(),
            lastName.trim(),
            specialization.trim(),
            licenseNumber.trim()
        );

        res.status(201).json({
            status: 'success',
            data: { user: { id: newDoctor.id, role: newDoctor.role } }
        });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};