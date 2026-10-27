import app from './app.js';
import { connectDatabase, isDatabaseReady } from './config/database.js';
import { config } from './config/env.js';
import { expireDueDonations } from './services/expirationService.js';

async function startServer() {
  if (!config.jwtSecret) {
    console.warn('JWT_SECRET is not set. Authentication endpoints will return a configuration error.');
  }

  try {
    const connected = await connectDatabase();
    console.log(connected ? 'MongoDB connected.' : 'MongoDB is not configured; starting in limited mode.');
    if (connected) {
      try {
        const expired = await expireDueDonations();
        if (expired) console.log(`Expired ${expired} donations past their collection deadline.`);
      } catch {
        console.error('Initial donation expiration sweep failed; scheduled sweeps will retry.');
      }
      const expirationTimer = setInterval(() => {
        if (isDatabaseReady()) {
          expireDueDonations().catch(() => console.error('Scheduled donation expiration failed.'));
        }
      }, 60_000);
      expirationTimer.unref();
    }
  } catch {
    console.error('MongoDB connection failed. Check backend/.env and your Atlas network access; starting in limited mode.');
  }

  app.listen(config.port, () => {
    console.log(`ShareMeal API listening at http://localhost:${config.port}`);
  });
}

startServer();
