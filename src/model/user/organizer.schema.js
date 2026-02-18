import mongoose from "mongoose";

const organizerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    aadharNumber:{
        type:String,
    },
    panNumber:{
        type:String,
    },
    gstNumber:{
        type:String
    },
    isGSTVerify:{
        type:Boolean,
        default:false
    },
    isAadharVerify:{
        type:Boolean,
        default:false
    },
    isPanVerify:{
        type:Boolean,
        default:false
    }
});

export default mongoose.model("Organizer", organizerSchema);