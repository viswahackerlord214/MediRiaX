import { prisma } from '../config/db';

export const createNotification = async (userId: string, message: string) => {
    return await prisma.notification.create({
        data: {
            userId,
            message,
        },
    });
};

export const getUserNotifications = async (userId: string) => {
    return await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
};

export const markNotificationAsRead = async (id: string, userId: string) => {
    // Ensure the notification belongs to the user
    const notification = await prisma.notification.findUnique({
        where: { id },
    });

    if (!notification || notification.userId !== userId) {
        throw new Error('Notification not found or unauthorized');
    }

    return await prisma.notification.update({
        where: { id },
        data: { isRead: true },
    });
};
