import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.get('/health', (_req, res) =>
  res.json({ success: true, data: { status: 'ok', service: 'chipin-backend', time: new Date().toISOString() } })
);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Sprint berikutnya:
// router.use('/groups', groupRoutes);            // BL-05..08, 36, 37
// router.use('/transactions', transactionRoutes); // BL-10..19
// router.use('/receipts', receiptRoutes);         // BL-20..31 (OCR via ML service)

export default router;
