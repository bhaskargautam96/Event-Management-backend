
import mongoose from "mongoose"

const typeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    image: {
      url: String,
      publicId: String,
    },
    addedByUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // must match your User model name
      required: true,
    },

    // 🔥 Store role snapshot (optional but recommended)
    addedByRole: {
      type: String,
      enum: ["ORGANIZER", "ADMIN", "SUPERADMIN"],
      required: true,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);
// Add indexes to 'addedByUser' and 'isDelete'
typeSchema.index({ addedByUser: 1 }); // Ascending index on addedByUser
typeSchema.index({ isDelete: 1 });   // Ascending index on isDelete


const Type = mongoose.model("Type", typeSchema)
export default  Type
