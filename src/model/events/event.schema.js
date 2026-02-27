import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      minlength: 3,
      maxlength: 200,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    // Category references
    typeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Type",
      required: true,
    },

    subTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "subtype",
      required: false,
    },

    // Images array
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
        resourceType: {
          type: String,
          default: "image",
        },
      },
    ],

    // Location details
    location: {
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
      },
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },

    // Event timing
    eventDate: {
      type: Date,
      required: true,
    },

    eventTime: {
      type: String, // Format: "HH:MM" or store as separate startTime/endTime
    },

    duration: {
      type: Number, // in hours
      default: 1,
    },

    // Pricing
    pricing: {
      basePrice: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        default: "INR",
      },
      isNegotiable: {
        type: Boolean,
        default: false,
      },
      advancePayment: {
        type: Number,
        default: 0,
      },
    },

    // Capacity
    capacity: {
      minGuests: {
        type: Number,
        default: 1,
      },
      maxGuests: {
        type: Number,
      },
    },

    // Additional services/amenities
    amenities: [
      {
        type: String,
        trim: true,
      },
    ],

    // Tags for search
    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    // Contact info
    contactDetails: {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      email: {
        type: String,
      },
      whatsapp: {
        type: String,
      },
    },

    // Organizer
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    organizerRole: {
      type: String,
      enum: ["ORGANIZER", "ADMIN", "SUPERADMIN"],
      required: true,
    },

    // Status
    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED", "PENDING_APPROVAL"],
      default: "PENDING_APPROVAL",
    },

    // Booking settings
    bookingSettings: {
      isBookingOpen: {
        type: Boolean,
        default: true,
      },
      autoApprove: {
        type: Boolean,
        default: false,
      },
      cancellationPolicy: {
        type: String,
        default: "",
      },
    },

    // Stats
    stats: {
      views: {
        type: Number,
        default: 0,
      },
      bookings: {
        type: Number,
        default: 0,
      },
      rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      reviewCount: {
        type: Number,
        default: 0,
      },
    },

    // Featured/Premium
    isFeatured: {
      type: Boolean,
      default: false,
    },

    isPremium: {
      type: Boolean,
      default: false,
    },

    // Soft delete
    isDelete: {
      type: Boolean,
      default: false,
    },

    // Additional metadata
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
eventSchema.index({ typeId: 1, subTypeId: 1 });
eventSchema.index({ organizerId: 1 });
eventSchema.index({ status: 1, isDelete: 1 });
eventSchema.index({ eventDate: 1 });
eventSchema.index({ "location.city": 1, "location.state": 1 });
eventSchema.index({ tags: 1 });
eventSchema.index({ createdAt: -1 });

// Text search index
eventSchema.index({
  title: "text",
  description: "text",
  tags: "text",
  "location.city": "text",
});

const Event = mongoose.model("Event", eventSchema);

export default Event;
