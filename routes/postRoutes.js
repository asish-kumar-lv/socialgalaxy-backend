import express from "express";
import PostController from "../controllers/postController.js";
import auth from "../middlewares/auth.js";

const router = express.Router();
router.use("/addPost", auth);
router.use("/getUserPosts", auth);
router.use("/postReact", auth);
router.use("/postComment", auth);
router.use("/getComments", auth);

router.get("/allPosts", PostController.allPosts);
//private
router.post("/addPost", PostController.addPost);
router.get("/getUserPosts", PostController.getUserPosts);
router.put("/postReact", PostController.postReact);

router.post("/postComment", PostController.postComment);
router.get("/getComments/:id", PostController.getCommentsByPostId);

export default router;
