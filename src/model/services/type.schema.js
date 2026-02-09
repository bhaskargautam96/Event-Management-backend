
import mongoose from "mongoose"

const typeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    image:{
        type:String
    }
})
const Type = mongoose.model("Type", typeSchema)
export default  Type
