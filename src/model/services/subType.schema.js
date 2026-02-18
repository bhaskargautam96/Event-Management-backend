import mongoose from "mongoose";

const subTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  typeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Type",
    required: true,
  },
  description: {
    type: String,
  },
  image: {
    url: String,
    publicId: String,
  },
  isDelete: {
    type: Boolean,
    default: false,
  },
  addedByUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // must match your User model name
    required: true,
  },
  addedByRole: {
    type: String,
    enum: ["ORGANIZER", "ADMIN", "SUPERADMIN"],
    required: true,
  },
});

const SubType = mongoose.model("SubType", subTypeSchema);
export default SubType;
