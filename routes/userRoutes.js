import express from "express";
import UserController from "../controllers/userController.js";
import auth from "../middlewares/auth.js";

const router = express.Router();
router.use("/me", auth);

//public
router.post("/register", UserController.userRegistration);
router.post("/login", UserController.userLogin);

//private

router.get("/me", UserController.getProfile);

export default router;
