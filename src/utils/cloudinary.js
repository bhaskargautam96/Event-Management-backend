
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

/**
 * Upload buffer to Cloudinary
 */
export const uploadToCloudinary = async ({
  fileBuffer,
  folder,
  resourceType = "auto", // image | video | raw | auto
}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};


export const generateCloudinarySignature = ({
  folder="event-waale",
  resourceType = "image",
}) => {
  const timestamp = Math.round(Date.now() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder,
    },
    process.env.CLOUDINARY_API_SECRET,
  );

  return {
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_NAME,
    folder,
    resourceType,
  };
};
