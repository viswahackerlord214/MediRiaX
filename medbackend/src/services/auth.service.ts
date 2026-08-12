import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { prisma } from '../config/db';
import { Role } from '@prisma/client';

// Initialize Prisma Client with the new v7 Postgres Adapter


const SALT_ROUNDS = 10;

export const registerPatient = async (email: string, plainTextPassword: string, firstName: string, lastName: string, dateOfBirth: Date, contactNumber: string) => {

    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        throw new Error('User with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(plainTextPassword, SALT_ROUNDS);
    console.log(passwordHash);

    const newUser = await prisma.user.create({
        data: {
            email,
            passwordHash,
            role: Role.PATIENT,
            patientProfile: {
                create: {
                    firstName,
                    lastName,
                    dateOfBirth,
                    contactNumber
                }
            }
        }
    });

    return newUser;
}; // 👈 Notice that registerPatient strictly ends right here!

export const loginUser = async (email: string, plainTextPassword: string) => {
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(plainTextPassword, user.passwordHash);

    if (!isPasswordValid) {
        throw new Error('Invalid email or password');
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('Server configuration error: JWT_SECRET is missing.');
    }

    const token = jwt.sign(
        {
            userId: user.id,
            role: user.role
        },
        jwtSecret,
        { expiresIn: '1h' }
    );

    return { user, token };
};

export const registerDoctor = async (email: string, plainTextPassword: string, firstName: string, lastName: string, specialization: string, licenseNumber: string) => {

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error('User already exists.');

    const passwordHash = await bcrypt.hash(plainTextPassword, SALT_ROUNDS);

    const newDoctor = await prisma.user.create({
        data: {
            email,
            passwordHash,
            role: Role.DOCTOR,
            doctorProfile: {
                create: {
                    firstName,
                    lastName,
                    specialization,
                    licenseNumber
                }
            }
        }
    });

    return newDoctor;
};