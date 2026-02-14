import cloudinary from "../../config/cloudinary.js";
import Type from "../../model/services/type.schema.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { uploadToCloudinary } from "../../utils/cloudinary.js";

export const getTypeCategories = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "" } = req.query;
    const role  = req.user?.role; // ✅ safe

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // 🔥 Role-based filter
    let filter = {};

    if (!["SUPERADMIN", "ADMIN"].includes(role)) {
      filter.isDelete = false;
    }

    // 🔍 Optional search
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const [types, totalRecords] = await Promise.all([
      Type.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
      Type.countDocuments(filter),
    ]);
    console.log("🚀 ~ getTypeCategories ~ types:", types)

    return res.status(200).json({
      success: true,
      data: types,
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

export const addTypeCategories = async (req, res) => {
  try {
    const { name, description } = req.body;
    const { role, id } = req.user;
    if (!name || !req.file) {
      return res.status(400).json(
        new ApiResponse("", {
          status: "failed",
        }),
      );
    }
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "event-waale/service-type",
          resource_type: "image",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
      stream.end(req.file.buffer);
    });
    const type = await Type.create({
      name,
      description,
      addedByUser: id,
      addedByRole: role,
      image: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        resourceType: uploadResult.resource_type,
      },
    });

    return res.status(201).json(
      new ApiResponse("Service Type Added Successfully", {
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

export const updatTypeCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const { id: adminId, role } = req.user;

    const category = await Type.findById(id);
    if (!id)
      return res.json({
        error: "Id Not founed",
      });

    if (!category) {
      return res.status(404).json({
        message: "Type category not found",
      });
    }

    // 1️⃣ Update name if provided
    if (name) {
      category.name = name;
    }

    // 2️⃣ If new image uploaded → replace old image
    if (req.file) {
      // 🔥 Delete old image from Cloudinary
      if (category.image?.publicId) {
        await cloudinary.uploader.destroy(category.image.publicId);
      }
      if (adminId || role) {
        category.addedByUser = adminId;
        category.addedByRole = role;
      }

      //   🔥 Upload new image
      const uploadResult = await uploadToCloudinary({
        fileBuffer: req.file.buffer,
        folder: "event-waale/service-type",
        resourceType: "image",
      });

      category.image = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        resourceType: uploadResult.resource_type,
      };
    }

    await category.save();

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteTypeCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: adminId, role } = req.user;

    if (!id) {
      return res.status(400).json({
        error: "id is required",
      });
    }

    const type = await Type.findById(id);

    if (!type) {
      return res.status(404).json({
        error: "Type not found",
      });
    }

    // 🔥 Soft delete
    if (adminId || role) {
      type.addedBy = adminId;
      type.addedByRole = role;
      type.isDelete = true;
    }
    await type.save();

    return res.json(
      new ApiResponse("Category soft deleted successfully", type),
    );
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};
