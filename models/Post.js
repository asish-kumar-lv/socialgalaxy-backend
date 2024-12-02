import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  userLiked: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
  ],
});

postSchema.methods.toJSON = function () {
  const postObject = this.toObject();
  delete postObject.content;
  return postObject;
};

const PostModel = mongoose.model("Posts", postSchema);
export default PostModel;
