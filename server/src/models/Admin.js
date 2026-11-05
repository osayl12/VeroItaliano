import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    tokenVersion: { type: Number, default: 0 } // bumped on password change to log out every old token
  },
  { timestamps: true }
);

export default mongoose.model('Admin', adminSchema);
