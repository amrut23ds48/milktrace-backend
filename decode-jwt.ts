import 'dotenv/config';
import jwt from 'jsonwebtoken';

const token = process.argv[2];
if (!token) {
  console.log("Provide token");
  process.exit(1);
}

const decoded = jwt.decode(token);
console.log(JSON.stringify(decoded, null, 2));
