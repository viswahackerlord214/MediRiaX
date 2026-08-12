import { Request, Response } from 'express';
import * as notificationService from '../services/notification.service';

export const getUserNotificationsHandler = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const notifications = await notificationService.getUserNotifications(userId);
        res.status(200).json({ status: 'success', data: { notifications } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

export const markNotificationAsReadHandler = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = (req as any).user.userId;

        const updatedNotification = await notificationService.markNotificationAsRead(id, userId);
        res.status(200).json({ status: 'success', data: { notification: updatedNotification } });
    } catch (error: any) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};
