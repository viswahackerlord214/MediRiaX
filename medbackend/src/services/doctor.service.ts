import { prisma } from '../config/db';


export const searchDoctors = async (specialty?: string) => {
    // If a specialty is provided, filter by it. Otherwise, return all.
    const whereClause = specialty
        ? { specialization: { contains: specialty, mode: 'insensitive' as const } }
        : {};

    return await prisma.doctorProfile.findMany({
        where: whereClause,
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                },
            },
        },
    });
};