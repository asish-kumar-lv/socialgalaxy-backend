import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  occupation: {
    type: String,
    trim: true,
  },
  friends: [
    {
      friendId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
      },
      requested: { type: Boolean, default: true },
      confirmed: {
        type: Boolean,
        default: false,
      },
    },
  ],
});
const UserModel = mongoose.model("Users", userSchema);
export default UserModel;
