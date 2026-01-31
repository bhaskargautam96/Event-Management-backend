import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    /* =========================
       Basic Info
    ========================= */
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
      index: true,
      sparse: true, // 👈 required for Instagram (no email)
    },

    phone: {
      type: String,
      unique: true,
      sparse: true,
    },

    password: {
      type: String,
      minlength: 8,
      select: false,
      required: function () {
        return !this.isSocialAccount;
      },
    },

    /* =========================
       Auth & Roles
    ========================= */
    role: {
      type: String,
      enum: ["SUPERADMIN", "ADMIN", "ORGANIZER", "CLIENT","USER"],
      default: "USER",
    },

    authProvider: {
      type: String,
      enum: ["LOCAL", "GOOGLE", "FACEBOOK", "INSTAGRAM"],
      default: "LOCAL",
    },

    isSocialAccount: {
      type: Boolean,
      default: false,
    },

    socialAccounts: {
      googleId: { type: String, index: true },
      facebookId: { type: String, index: true },
      instagramId: { type: String, index: true },
    },

    /* =========================
       Profile
    ========================= */
    dob: {
      type: Date,
    },

    address: {
      type: String,
      default: "",
    },

    profileImage: {
      type: String,
      default: "",
    },

    coverImage: {
      type: String,
      default: "",
    },

    /* =========================
       Verification
    ========================= */
    isNumberVerified: {
      type: Boolean,
      default: false,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },

    /* =========================
       Tokens
    ========================= */
    refreshTokens: [
      {
        token: { type: String },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    /* =========================
       Meta
    ========================= */
    lastLoginAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});



userSchema.methods.comparePassword = function (password) {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

export default  User