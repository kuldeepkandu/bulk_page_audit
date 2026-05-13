import mongoose, {Schema} from "mongoose";

const scanSchema = new Schema (
    {
        url: {
            type: String,
            required: true,
            unique: false,
            trim: true,
            indexed: true,  
        },
    },
    {
        timestamps: true,
    }
)

export const Scan = mongoose.model("Scan", scanSchema)