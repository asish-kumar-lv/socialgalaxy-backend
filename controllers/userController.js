import UserModel from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import PostModel from "../models/Post.js";
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

  static addPost = async (req, res) => {
    const { content } = req.body;
    try {
      const data = new PostModel({
        content,
        postBy: req.user._id,
      });
    } catch {
      res.status(400).send({
        status: "failed",
        message: "unable to add post",
      });
    }
  };
}

export default UserController;
