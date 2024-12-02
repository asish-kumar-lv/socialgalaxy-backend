import mongoose from "mongoose";

const connectDb = async (DB_URL) => {
  try {
    const DB_OPTIONS = {
      dbName: "socialGalaxy",
    };
    await mongoose.connect(
      "mongodb+srv://asishkumar:admin%406969@cluster0.ayipn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
      DB_OPTIONS
    );
    console.log("conncted successfully");
  } catch (e) {
    console.log(e);
  }
};

export default connectDb;
