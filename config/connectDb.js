import mongoose from "mongoose";

const connectDb = async (DB_URL) => {
  try {
    const DB_OPTIONS = {
      dbName: "socialGalaxy",
    };
    await mongoose.connect(DB_URL, DB_OPTIONS);
    console.log("conncted successfully");
  } catch (e) {
    console.log(e);
  }
};

export default connectDb;
