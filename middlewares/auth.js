import jwt from "jsonwebtoken";
import UserModel from "../models/User.js";

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization");

    if (!token) {
      res.status(401).send({ status: "failed", message: "access denied" });
    } else {
      const tokenVal = token.split(" ")[1];
      const { userId } = jwt.verify(tokenVal, process.env.JWT_SECRET);
      req.user = await UserModel.findById(userId);
      next();
    }
  } catch (e) {
    res.status(401).send({ status: "failed", message: "invalid token" });
  }
};

export default auth;
