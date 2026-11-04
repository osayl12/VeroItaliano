import dotenv from 'dotenv';
// Load .env from the server folder or from the project root (first one wins per variable)
dotenv.config({ path: ['.env', '../.env'], quiet: true });
