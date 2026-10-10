import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateBody } from '../middlewares/validate.middleware';
import { RegisterSchema, LoginSchema, RefreshTokenSchema, LogoutSchema } from '../schemas/auth.schema';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware';
import { authRateLimiter } from '../middlewares/rate-limiter';

export function createAuthRouter(
  controller?: AuthController,
  authMiddleware = requireAuth,
  optionalAuthMiddleware = optionalAuth
): Router {
  const router = Router();
  const authController = controller || new AuthController();

  router.post(
    '/register',
    validateBody(RegisterSchema),
    authRateLimiter,
    authController.register
  );

  router.post(
    '/login',
    validateBody(LoginSchema),
    authRateLimiter,
    authController.login
  );

  router.post(
    '/refresh',
    validateBody(RefreshTokenSchema),
    authController.refresh
  );

  router.post(
    '/logout',
    optionalAuthMiddleware,
    validateBody(LogoutSchema),
    authController.logout
  );

  router.get(
    '/me',
    authMiddleware,
    authController.me
  );

  return router;
}

export const authRouter = createAuthRouter();
