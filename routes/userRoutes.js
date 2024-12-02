import express from "express";
import UserController from "../controllers/userController.js";
import auth from "../middlewares/auth.js";
import upload from "../middlewares/multer.js";

const router = express.Router();
router.use("/me", auth);
router.use("/editProfile", auth);
router.use("/suggestedFriends", auth);
router.use("/changePassword", auth);
router.use("/requestFriend/:id", auth);
router.use("/requestFriendRollback/:id", auth);
router.use("/myFriends", auth);
router.use("/acceptRequest/:id", auth);

//public
router.post(
  "/register",
  upload.single("profileImage"),
  UserController.userRegistration
);
router.post("/login", UserController.userLogin);

//private

router.get("/me", UserController.getProfile);
router.put("/editProfile", upload.single("file"), UserController.editProfile);
router.post("/changePassword", UserController.changePassword);
router.get("/myFriends", UserController.getUserFriends);
router.get("/suggestedFriends", UserController.suggestedFriends);
router.put("/requestFriend/:id", UserController.requestFriend);
router.put("/requestFriendRollback/:id", UserController.requestFriendRollback);
router.put("/acceptRequest/:id", UserController.acceptRequest);

export default router;
