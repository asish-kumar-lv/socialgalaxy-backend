import UserModel from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import PostModel from "../models/Post.js";
import mongoose from "mongoose";
class UserController {
  getUserByToken = async (req) => {
    const token = req.header("Authorization");

    try {
      if (!token) {
        return null;
      } else {
        const tokenVal = token.split(" ")[1];
        const { userId } = jwt.verify(tokenVal, process.env.JWT_SECRET);

        const user = await UserModel.findById(userId).select("-password -__v");
        return user;
      }
    } catch (e) {
      console.log(e);
      return null;
    }
  };
  static userRegistration = async (req, res) => {
    const { name, email, password, password_confirm, occupation } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
      if (email && name && password && password_confirm) {
        if (password === password_confirm) {
          try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const data = new UserModel({
              email,
              name,
              password: hashedPassword,
              occupation,
            });
            await data.save();
            res.send({
              status: "success",
              message: "registration successfull",
            });
          } catch (e) {
            res.status(400).send({ status: "failed", message: e });
          }
        } else {
          res
            .status(400)
            .send({ status: "failed", message: "password does not match" });
        }
      } else {
        res
          .status(400)
          .send({ status: "failed", message: "all fields required" });
      }
    } else {
      res
        .status(400)
        .send({ status: "failed", message: "user already exists" });
    }
  };

  static userLogin = async (req, res) => {
    const { email, password } = req.body;
    if (email && password) {
      const user = await UserModel.findOne({ email });
      if (user) {
        const isMatch = await bcrypt.compare(password, user.password);

        if (user.email === email && isMatch) {
          try {
            const token = jwt.sign(
              { userId: user._id },
              process.env.JWT_SECRET,
              {
                expiresIn: 10 * 60 * 60,
              }
            );
            res.status(200).send({ status: "success", token });
          } catch (e) {
            res.status(400).send({ status: "failed", message: "login failed" });
          }
        } else {
          res.status(400).send({
            status: "failed",
            message: "email or password does not match",
          });
        }
      } else {
        res
          .status(400)
          .send({ status: "failed", message: "email is not registered" });
      }
    } else {
      res
        .status(400)
        .send({ status: "failed", message: "all fields required" });
    }
  };

  static getProfile = async (req, res) => {
    res.send({ status: "success", user: req.user });
  };

  static suggestedFriends = async (req, res) => {
    const user = req.user;
    const loginUser = await UserModel.findById(user?.id);

    try {
      let data = await UserModel.aggregate([
        {
          $match: {
            _id: {
              $ne: user?._id,
            },
          },
        },
        {
          $addFields: {
            friends: {
              $cond: {
                if: {
                  $ne: [
                    {
                      $type: "$friends",
                    },
                    "array",
                  ],
                },
                then: [],
                else: "$friends",
              },
            },
          },
        },
      ]);

      data = data.filter((item) => {
        const userIdinFriendList = item.friends.find((item) => {
          console.log(item.friendId, user?._id);
          return item.friendId.toString() == user?._id.toString();
        });
        console.log({ userIdinFriendList });
        if (userIdinFriendList) {
          if (userIdinFriendList?.requested) item.isRequested = true;
          if (userIdinFriendList?.confirmed) item.isConfirmed = true;
        }
        return !item.isConfirmed;
      });

      res.status(200).send({
        status: "success",
        data,
      });
    } catch (e) {
      console.log(e);
      res.status(400).send({
        status: "failed",
        message: "unable to fetch users",
      });
    }
  };

  static getUserFriends = async (req, res) => {
    const user = req.user;

    try {
      const data = await UserModel.aggregate([
        {
          $match: { _id: user?._id },
        },
        {
          $unwind: "$friends",
        },
        {
          $lookup: {
            from: "users",
            as: "friendDetail",
            foreignField: "_id",
            localField: "friends.friendId",
          },
        },
        {
          $unwind: "$friendDetail",
        },
        {
          $group: {
            _id: "$_id",
            friend: {
              $push: {
                friendId: "$friends.friendId",
                isRequested: "$friends.requested",
                isConfirmed: "$friends.confirmed",
                email: "$friendDetail.email",
                name: "$friendDetail.name",
                occupation: "$friendDetail.occupation",
              },
            },
          },
        },
        {
          $unwind: "$friend",
        },
      ]);

      res.status(200).send({
        status: "success",
        data,
      });
    } catch (e) {
      console.log(e);
      res.status(400).send({
        status: "failed",
        message: "unable to fetch users",
      });
    }
  };

  static requestFriend = async (req, res) => {
    const user = req.user;
    const { id } = req.params;
    const requestedUser = await UserModel.findById(user?._id);
    if (!requestedUser)
      res.status(400).send({
        status: "failed",
        message: "unable to find requested user",
      });
    try {
      const data = await UserModel.updateOne(
        {
          _id: new mongoose.Types.ObjectId(id),
        },
        {
          $push: {
            friends: {
              friendId: user?._id,
            },
          },
        }
      );
      res.status(200).send({
        status: "success",
        data,
      });
    } catch {
      res.status(400).send({
        status: "failed",
        message: "unable to request user",
      });
    }
  };
  static requestFriendRollback = async (req, res) => {
    const user = req.user;
    const { id } = req.params;
    const requestedUser = await UserModel.findById(user?._id);
    if (!requestedUser)
      res.status(400).send({
        status: "failed",
        message: "unable to find requested user",
      });
    try {
      const data = await UserModel.updateOne(
        {
          _id: new mongoose.Types.ObjectId(id),
        },
        {
          $pull: {
            friends: {
              friendId: requestedUser._id,
            },
          },
        }
      );
      const data2 = await UserModel.updateOne(
        {
          _id: requestedUser._id,
        },
        {
          $pull: {
            friends: {
              friendId: new mongoose.Types.ObjectId(id),
            },
          },
        }
      );
      res.status(200).send({
        status: "success",
        data,
      });
    } catch {
      res.status(400).send({
        status: "failed",
        message: "unable to request user",
      });
    }
  };

  static acceptRequest = async (req, res) => {
    const user = req.user;
    const { id } = req.params;

    try {
      //update current user friend list
      const data = await UserModel.updateOne(
        {
          _id: user?._id,
          "friends.friendId": new mongoose.Types.ObjectId(id),
        },
        {
          $set: {
            "friends.$.confirmed": true,
            "friends.$.requested": false,
          },
        }
      );
      // update sender user friend list
      const sData = await UserModel.updateOne(
        {
          _id: new mongoose.Types.ObjectId(id),
          "friends.friendId": { $ne: new mongoose.Types.ObjectId(user?._id) },
        },
        {
          $push: {
            friends: {
              friendId: user?._id,
              confirmed: true,
              requested: false,
            },
          },
        }
      );
      console.log(sData);
      res.status(200).send({
        status: "success",
        data,
      });
    } catch (e) {
      console.log(e);
      res.status(400).send({
        status: "failed",
        message: "unable to request user",
      });
    }
  };
}

export default UserController;
