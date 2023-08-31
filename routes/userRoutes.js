import express from "express";
import UserController from "../controllers/userController.js";
import auth from "../middlewares/auth.js";

const router = express.Router();
router.use("/me", auth);
router.use("/suggestedFriends", auth);
router.use("/requestFriend/:id", auth);
router.use("/requestFriendRollback/:id", auth);
router.use("/myFriends", auth);
router.use("/acceptRequest/:id", auth);

//public
router.post("/register", UserController.userRegistration);
router.post("/login", UserController.userLogin);

//private

router.get("/me", UserController.getProfile);
router.get("/myFriends", UserController.getUserFriends);

router.get("/suggestedFriends", UserController.suggestedFriends);
router.put("/requestFriend/:id", UserController.requestFriend);
router.put("/requestFriendRollback/:id", UserController.requestFriendRollback);
router.put("/acceptRequest/:id", UserController.acceptRequest);

export default router;
