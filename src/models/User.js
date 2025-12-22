import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["superadmin", "admin"], required: true },
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' }
}, { timestamps: true });

// Metodo per confrontare password
UserSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.passwordHash);
};

export default mongoose.model("User", UserSchema);
