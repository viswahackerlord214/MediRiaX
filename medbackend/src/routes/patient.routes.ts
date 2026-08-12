import { Router, Request, Response } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// 👉 We insert the 'requireAuth' bouncer right in the middle!
router.get('/profile', requireAuth, (req: Request, res: Response) => {

    // Thanks to our middleware, we now safely have access to req.user!
    const user = (req as any).user;

    res.status(200).json({
        status: 'success',
        message: 'Welcome to your secure patient dashboard!',
        data: {
            // We know this is safe because the token was mathematically verified
            userId: user.userId,
            role: user.role
        }
    });
});

export default router;