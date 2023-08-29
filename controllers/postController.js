import PostModel from "../models/Post.js";
import mongoose from "mongoose";
import UserController from "./userController.js";
import CommentModel from "../models/Comment.js";

const userController = new UserController();
class PostController {
  static addPost = async (req, res) => {
    const { content } = req.body;
    try {
      const data = new PostModel({
        content,
        user: req.user._id,
      });
      data.save();
      res.send({ status: "success" });
    } catch {
      res.status(400).send({
        status: "failed",
        message: "unable to add post",
      });
    }
  };

  static allPosts = async (req, res) => {
    const user = await userController.getUserByToken(req);
    const data = await PostModel.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 1,
          user: 1,
          content: 1,
          createdAt: 1,
          userLiked: 1,
          like: {
            $in: [user?._id, "$userLiked"],
          },
        },
      },

      //   {
      //     $addFields: {
      //       like: {
      //         $cond: {
      //           if: {
      //             $in: [req?.user?._id, "$userLiked"],
      //           },
      //           then: true,
      //           else: false,
      //         },
      //       },
      //     },
      //   },
    ]).sort({ createdAt: -1 });

    res.send({ status: "success", data });
  };

  static getUserPosts = async (req, res) => {
    const data = await PostModel.aggregate([
      { $match: { user: req?.user?._id } },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 1,
          user: 1,
          content: 1,
          createdAt: 1,
          userLiked: 1,
          like: {
            $in: [req?.user?._id, "$userLiked"],
          },
        },
      },

      //   {
      //     $addFields: {
      //       like: {
      //         $cond: {
      //           if: {
      //             $in: [req?.user?._id, "$userLiked"],
      //           },
      //           then: true,
      //           else: false,
      //         },
      //       },
      //     },
      //   },
    ]).sort({ createdAt: -1 });

    res.send({ status: "success", data });
  };

  static postReact = async (req, res) => {
    const { id } = req.body;
    const userId = req.user._id;
    const post = await PostModel.findById(id);

    if (post) {
      let data;
      if (post?.userLiked?.includes(userId)) {
        data = await PostModel.updateOne(
          { _id: id },
          {
            $pull: {
              userLiked: userId,
            },
          }
        );
      } else {
        data = await PostModel.updateOne(
          { _id: id },
          {
            $push: {
              userLiked: userId,
            },
          }
        );
      }
      console.log({ data });
      res.status(200).send({ status: "success", data });
    } else {
      res
        .status(400)
        .send({ status: "failed", message: "post reaction failed" });
    }
  };

  static getCommentsByPostId = async (req, res) => {
    const { id } = req.params;

    const comments = await CommentModel.aggregate([
      { $match: { post: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
    ]);
    res.status(200).send({ status: "success", data: comments });
  };

  static postComment = async (req, res) => {
    const { id, content } = req.body;
    const userId = req?.user?._id;

    const data = new CommentModel({
      content,
      post: new mongoose.Types.ObjectId(id),
      user: userId,
    });
    await data.save();

    res.send({ status: "success" });
  };

  static deletePostById = async (req, res) => {
    const { id } = req.params;
    if (id) {
      const data = await PostModel.deleteOne({
        _id: new mongoose.Types.ObjectId(id),
      });
      if (data.acknowledged) {
        res.status(200).send({ status: "success" });
      } else {
        res.status(400).send({ status: "failed" });
      }
    }
  };
}

export default PostController;
