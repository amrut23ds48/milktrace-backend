import { Router, Request, Response, NextFunction } from 'express';
import { transferService } from '../services/transferService';
import { CreateTransferRequest } from '../types/transfer.types';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: CreateTransferRequest = req.body;
    const transfer = await transferService.createTransfer(data);
    
    res.status(201).json({
      success: true,
      data: transfer
    });
  } catch (error) {
    next(error);
  }
});

export { router as transferRoutes };
