import cron from 'node-cron';
import { startLifecycleScheduler } from './lifecycleScheduler.js';

export const scheduler = {
  start() {
    cron.schedule('*/5 * * * *', () => {
      console.log('LifeVault scheduler tick');
    });
    startLifecycleScheduler();
  }
};
