import 'dotenv/config';
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import connectDB from "./Config/db.js";
import authRoutes from "./routes/authNew.js";
import bikeRoutes from "./routes/bikes.js";
import accessoryRoutes from "./routes/accessories.js";
import contractRoutes from "./routes/contracts.js";
import reportRoutes from "./routes/reports.js";
import locationRoutes from "./routes/locations.js";
import uploadRoutes from "./routes/upload.js";
import userRoutes from "./routes/users.js";
import barcodeRoutes from "./routes/barcode.js";
import statsRoutes from "./routes/stats.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Aumenta il limite per le immagini base64
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servi i file statici dalla directory uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// connetti MongoDB
connectDB();

// Health check endpoint per Railway
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// routes
app.use("/api/auth", authRoutes);
app.use("/api/bikes", bikeRoutes);
app.use("/api/accessories", accessoryRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/users", userRoutes);
app.use("/api/barcode", barcodeRoutes);
app.use("/api/stats", statsRoutes);

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0'; // Espone su tutte le interfacce di rete

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server avviato sulla porta ${PORT}`);
  console.log(`📍 Local:   http://localhost:${PORT}`);
  console.log(`🌐 Network: http://192.168.1.104:${PORT}`);
  console.log(`💾 Database: MongoDB Cloud connesso`);
});
