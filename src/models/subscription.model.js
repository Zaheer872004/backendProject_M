import mongoose,{Schema, model} from "mongoose";

const subscriptionSchema = new Schema(
    {
        subscriber : {
            type : Schema.Types.ObjectId, // How many channel I'm Subscribing.
            ref : "User"
        },
        channel : {
            type : Schema.Types.ObjectId,  // How many people subscribe to my channel.
            ref : "User"
        }
    },
    {
        timestamps:true
    }
)

export const Subscription = mongoose.model("Subscription",subscriptionSchema);
