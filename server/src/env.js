import dotenv from 'dotenv';
// Load .env from the server folder or from the project root (first one wins per variable)
dotenv.config({ path: ['.env', '../.env'], quiet: true });

// Atlas (mongodb+srv) needs SRV DNS lookups, and some home routers/ISPs refuse them.
import dns from 'node:dns';
if (process.env.MONGO_URI?.startsWith('mongodb+srv://')) {
  dns.setServers(['1.1.1.1', '8.8.8.8']);
}
