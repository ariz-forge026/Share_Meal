import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import donationRoutes from './routes/donationRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import ngoRoutes from './routes/ngoRoutes.js';
import userRoutes from './routes/userRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import collectionTaskRoutes from './routes/collectionTaskRoutes.js';
import donationRequestRoutes from './routes/donationRequestRoutes.js';
import distributionRoutes from './routes/distributionRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { csrfProtection } from './middleware/csrfProtection.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: config.frontendUrl, credentials: true, methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'] }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(csrfProtection);
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/donation-requests', donationRequestRoutes);
app.use('/api/collection-tasks', collectionTaskRoutes);
app.use('/api/distributions', distributionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ngos', ngoRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/contact', contactRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
