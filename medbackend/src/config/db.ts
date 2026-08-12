import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

// 👉 Load the environment variables FIRST
dotenv.config();

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString,
    ssl: connectionString?.includes('localhost') || connectionString?.includes('127.0.0.1')
        ? false
        : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle pg pool client:', err);
});

export const prisma = globalForPrisma.prisma || new PrismaClient({
    adapter: new PrismaPg(pool)
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
