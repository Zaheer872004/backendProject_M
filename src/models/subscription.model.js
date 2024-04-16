import mongoose,{Schema, model} from "mongoose";

const subscriptionSchema = new Schema(
    {
        subscriber : {
            type : Schema.Types.ObjectId, // one who is subscribing like me. only subscribe not have subscriber
            ref : "User"
        },
        channel : {
            type : Schema.Types.ObjectId,  // how many people is subscribing to this channel OR subscriber
            ref : "User"
        }
    },
    {
        timestamps:true
    }
)

export const Subscription = mongoose.model("Subscription",subscriptionSchema);
