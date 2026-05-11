import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true, index: true },
  displayName: String,
  photoURL: String,
  lastSeen: { type: Date, default: Date.now }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
