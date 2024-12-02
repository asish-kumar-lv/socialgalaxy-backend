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
              profileImage: req.file ? `/uploads/${req.file.filename}` : null,
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

  static editProfile = async (req, res) => {
    const { name, occupation } = req.body;
    console.log(req.file);
    const id = req.user._id;

    const user = await UserModel.findOne({ _id: id });
    if (!user)
      res.status(400).send({ status: "failed", message: "user not found" });

    if (name) {
      try {
        user.name = name;
        user.occupation = occupation;
        if (req.file) user.profileImage = `/uploads/${req.file.filename}`;
        await user.save();
        res.send({
          status: "success",
          data: user,
          message: "edited successfully",
        });
      } catch (e) {
        res.status(400).send({ status: "failed", message: e });
      }
    } else {
      res
        .status(400)
        .send({ status: "failed", message: "all fields required" });
    }
  };

  static changePassword = async (req, res) => {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;
    const id = req.user._id;

    const user = await UserModel.findOne({ _id: id });
    if (!user)
      res.status(400).send({ status: "failed", message: "user not found" });

    if (oldPassword && newPassword && confirmNewPassword) {
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (isMatch) {
        if (newPassword === confirmNewPassword) {
          try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            user.password = hashedPassword;
            await user.save();
            res.send({
              status: "success",
              data: user,
              message: "password changed successfully",
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
          .send({ status: "failed", message: "old password does not match" });
      }
    } else {
      res
        .status(400)
        .send({ status: "failed", message: "all fields required" });
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

    try {
      const data = await UserModel.find({
        $and: [{ _id: { $ne: user?._id } }, { _id: { $nin: user?.friends } }],
      }).lean();

      const usersWithFlag = data.map((item) => {
        return {
          ...item,
          isRequestReceived: user?.requests
            ?.map((user) => user.toString())
            ?.includes(item._id?.toString()), // Check if this user's ID is in the logged-in user's requests
          isRequestSent: item?.requests
            ?.map((user) => user.toString())
            ?.includes(user._id?.toString()), // Check if the logged-in user ID is in this user's requests
        };
      });

      res.status(200).send({
        status: "success",
        data: usersWithFlag,
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
      const friends = await UserModel.find({ _id: user?.friends });
      const requests = await UserModel.find({ _id: user?.requests });
      res.status(200).send({
        status: "success",
        friends,
        requests,
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
    const sender = await UserModel.findById(user?._id);
    const receiver = await UserModel.findById(id);
    if (!receiver)
      res.status(400).send({
        status: "failed",
        message: "unable to find requested user",
      });
    if (receiver.requests.includes(sender._id)) {
      res.status(400).send({
        status: "failed",
        message: "request already sent",
      });
    }
    try {
      receiver.requests.push(sender._id);
      await receiver.save();
      res.status(200).send({
        status: "success",
        data: receiver,
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
    const sender = await UserModel.findById(user?._id);
    const receiver = await UserModel.findById(id);

    if (!receiver)
      res.status(400).send({
        status: "failed",
        message: "unable to find specific user",
      });
    if (!receiver.requests.includes(sender._id)) {
      res.status(400).send({
        status: "failed",
        message: "request not sent",
      });
    }
    try {
      const requestIndex = receiver.requests.indexOf(sender._id);
      receiver.requests.splice(requestIndex, 1);
      await receiver.save();
      res.status(200).send({
        status: "success",
        data: receiver,
      });
    } catch (e) {
      console.log(e);
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
      const currentUser = await UserModel.findById(user?._id);
      const senderUser = await UserModel.findById(id);
      currentUser.friends.push(senderUser._id);
      senderUser.friends.push(currentUser._id);

      const requestIndex = currentUser.requests.indexOf(senderUser._id);
      if (requestIndex === -1) {
        return res.status(400).json({ message: "No friend request found" });
      }
      currentUser.requests.splice(requestIndex, 1);
      await currentUser.save();
      await senderUser.save();
      res.status(200).send({
        status: "success",
        data: currentUser,
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
