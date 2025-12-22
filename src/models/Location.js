import mongoose from 'mongoose';
const LocationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  logoUrl: String
}, { timestamps: true });
export default mongoose.model('Location', LocationSchema);
