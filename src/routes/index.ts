import { Router } from 'express';
import { authRouter } from './auth.routes';
import { healthRouter } from './health.routes';

export const routes = Router();

routes.use('/auth', authRouter);
routes.use('/health', healthRouter);
