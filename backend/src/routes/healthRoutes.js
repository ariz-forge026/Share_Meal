import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/', (request, response) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  response.status(200).json({
    success: true,
    status: 'ok',
    database: { connected: databaseConnected, status: databaseConnected ? 'connected' : 'unavailable' },
    timestamp: new Date().toISOString(),
  });
});

export default router;
