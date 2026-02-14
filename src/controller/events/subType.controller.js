
import cloudinary from "../../config/cloudinary.js";
import SubType from "../../model/services/subType.schema.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { uploadToCloudinary } from "../../utils/cloudinary.js";

export const getSubTypeCategories = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "" } = req.query;
    const { role } = req.user;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    let filter = {};

    if (!["SUPERADMIN", "ADMIN"].includes(role)) {
      filter.isDeleted = false;
    }
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }
    const [subTypes, totalRecords] = await Promise.all([
      SubType.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
      SubType.countDocuments(filter),
    ]);
    return res.status(200).json({
      success: true,
      data: subTypes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        totalRecords,
        limit,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const addSubTypeCategories = async (req, res) => {
  try {
    const { name, description,typeId } = req.body;
    const {role,id}=req.user

    if (!name || !req.file) {
      return res.status(400).json(
        new ApiResponse("", {
          status: "failed",
        }),
      );
    }
    const uploadResult = await uploadToCloudinary({
      fileBuffer: req.file.buffer,
      folder: "event-waale/service-subtype",
      resourceType:"image"
    });
    const type = await SubType.create({
      name,
      description,
      typeId,
      addedByRole:role,
      addedByUser:id,
      image: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        resourceType: uploadResult.resource_type,
      },
    });

    return res.status(201).json(
      new ApiResponse("Service SubType Added Successfully", {
        data: type,
      }),
    );
  } catch (error) {
    return res.json(
      new ApiError("Error", {
        error,
      }),
    );
  }
};

export const updatSubTypeCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name,description } = req.body;
    const {role,id:adminId} =req.user

    const subCategory = await SubType.findById(id);
    if (!id)
      return res.json({
        error: "Id Not founed",
      });

    if (!subCategory) {
      return res.status(404).json({
        message: "SubType  not found",
      });
    }

    // 1️⃣ Update name if provided
    if (name||description) {
      subCategory.name=name;
      subCategory.description=description
      subCategory.addedByRole=role,
      subCategory.addedByUser=adminId
    }

    // 2️⃣ If new image uploaded → replace old image
    if (req.file) {
      // 🔥 Delete old image from Cloudinary
      if (subCategory.image?.publicId) {
        await cloudinary.uploader.destroy(subCategory.image.publicId);
      }

      //   🔥 Upload new image
      const uploadResult = await uploadToCloudinary({
        fileBuffer: req.file.buffer,
        folder: "event-waale/service-subtype",
        resourceType: "image",
      });

      subCategory.image = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        resourceType: uploadResult.resource_type,
      };
    }

    await subCategory.save();

    res.json({
      success: true,
      data: subCategory,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteSubTypeCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const {id:adminId,role}=req.user;

    if (!id) {
      return res.status(400).json({
        error: "id is required",
      });
    }

    const subType = await SubType.findById(id);

    if (!subType) {
      return res.status(404).json({
        error: "SubType not found",
      });
    }

    // 🔥 Soft delete
    subType.isDelete = true;
    subType.addedByRole=role,
    subType.addedByUser=adminId;
    await subType.save();

    return res.json(
      new ApiResponse("Category soft deleted successfully", subType),
    );
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};

