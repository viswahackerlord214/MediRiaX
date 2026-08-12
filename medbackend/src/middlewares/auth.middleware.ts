import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
    try {
        // 1. Look for the "Authorization" header in the incoming request
        const authHeader = req.headers.authorization;

        // 2. Check if the header exists and starts with the word "Bearer "
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                status: 'error',
                message: 'Unauthorized: No token provided'
            });
            return;
        }

        // 3. Extract the token (e.g., "Bearer eyJhbGci..." -> "eyJhbGci...")
        const token = authHeader.split(' ')[1];

        // 4. Ensure our server secret is loaded
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('Server configuration error: JWT_SECRET is missing');
        }

        // 5. Verify the token's digital signature and check if it is expired
        const decodedPayload = jwt.verify(token, secret);

        // 6. Attach the decoded payload (userId, role) to the request so the Controller can use it!
        // (We use a tiny TypeScript hack `as any` for now to bypass strict typing on the Request object)
        (req as any).user = decodedPayload;

        // 7. The token is valid! Step aside and let the request go to the Controller.
        next();

    } catch (error: any) {
        // If jwt.verify() fails (e.g., token is fake or expired), it throws an error.
        res.status(401).json({
            status: 'error',
            message: 'Unauthorized: Invalid or expired token'
        });
    }
};