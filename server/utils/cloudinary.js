import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadMediaToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });

    return result;
  } catch (error) {
    console.log(error);
    throw new Error("Error uploading file to cloudinary !");
  }
};

const deleteMediaFromCloudinary = async (public_id) => {
  try {
    console.log(public_id);
    const result = await cloudinary.uploader.destroy(public_id);

    return result;
  } catch (error) {
    console.log(error);
    throw new Error("Error deleting file from cloudinary !");
  }
};

export { uploadMediaToCloudinary, deleteMediaFromCloudinary };