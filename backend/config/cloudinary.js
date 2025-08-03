import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_CLOUD_API_KEY, 
  api_secret: process.env.CLOUDINARY_CLOUD_API_SECRET 
});

export const uploadOnCloudinary = async (filePath) => {
  if (!filePath) return null;

  try {
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });

    fs.unlinkSync(filePath);
    return uploadResult.secure_url; // ✅ Already URL
  } catch (error) {
    console.error("❌ Cloudinary Upload Error:", error);
    try {
      fs.unlinkSync(filePath);
    } catch (_) {}
    return null;
  }
};
