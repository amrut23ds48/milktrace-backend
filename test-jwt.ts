import 'dotenv/config';
import { requireAuth } from './src/middleware/auth';
import { generateTestToken } from './src/__tests__/helpers/auth';

console.log("Middleware JWT_SECRET (indirect):", process.env.JWT_SECRET);
const token = generateTestToken('SUPER_ADMIN');
console.log("Token:", token);
