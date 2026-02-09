import mongoose from "mongoose"

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
    image:{
        type:String
    }
})

const SubType = mongoose.model("SubType", subTypeSchema)
export default SubType
