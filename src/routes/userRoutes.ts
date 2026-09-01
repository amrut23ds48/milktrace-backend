import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth';
import { createUser, getUsers, updateUser, deleteUser } from '../services/userService';
import { CreateUserInput } from '../types/user.types';

export const userRoutes = Router();

userRoutes.post('/', requireAuth, requirePermission('user.create'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input: CreateUserInput = req.body as CreateUserInput;
    const user = await createUser(input);
    res.status(201).json(user);
  } catch (err) {
    next(err); 
  }
});

userRoutes.get('/', requireAuth, requirePermission('user.view'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await getUsers();
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
});

userRoutes.put('/:id', requireAuth, requirePermission('user.update'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await updateUser(req.params.id as string, req.body);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
});

userRoutes.delete('/:id', requireAuth, requirePermission('user.delete'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await deleteUser(req.params.id as string);
    res.status(200).json({ message: 'User suspended', user });
  } catch (err) {
    next(err);
  }
});
