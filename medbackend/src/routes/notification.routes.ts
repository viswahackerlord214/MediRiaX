import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import {
    getUserNotificationsHandler,
    markNotificationAsReadHandler
} from '../controllers/notification.controller';

const router = Router();

// GET /api/v1/notifications
router.get('/', requireAuth, getUserNotificationsHandler);

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', requireAuth, markNotificationAsReadHandler);

export default router;
