import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      select: false, // Do not return password by default
    },
  },
  {
    timestamps: true,
  }
);

// If the model exists, use it. Otherwise, create it.
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
