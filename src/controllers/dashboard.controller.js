import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    // get the useId to get the details of it
    // use the aggregation 
    // 
    // matches with the userId in users table
    // lookup with the subscriptions to get the totalSubscribed and subscribedTo
    
    // Another aggregate pipeline
    // get filter with the userId in videos table
    // lookup with the likes table to get the total likes and views of the video
    // addfield whatever is required and project it

    const userId = req.user?._id

    // to get the user subscriber or subscribedTo/following
    const subscriberStatus = await User.aggregate(
        [
            {
                $match : {
                    _id : new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup : {
                    from : "subscriptions",
                    localField : "_id",
                    foreignField : "channel",
                    as : "subscriber"
                }
            },
            {
                $lookup : {
                    from : "subscriptions",
                    localField : "_id",
                    foreignField : "subscriber",
                    as : "subscribedTo"
                }
            },
            {
                $addFields : {
                    totalSubscriber : {
                        $size : "$subscriber"
                    },
                    subscribedToORFollow : {
                        $size : "$subscribedTo"
                    }
                }
            }
        ]
    );

    // to get the data of totalvideos and likes of it 

    const videosDetailAggregate = await Video.aggregate(
        [
            {
                $match : {
                    owner : new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup : {
                    from : "likes",
                    localField : "_id",
                    foreignField : "video",
                    as : "asLikes"
                }
            },
            {
                $addFields : {
                    totalLikes : {
                        $size : "$asLikes"
                    },
                    totalViews : "$views",
                    totalVideos : {
                        $sum : "_id" 
                    }
                }
            },
            {
                $project : {
                    totalLikes : 1,
                    totalViews : 1,
                    totalVideos : 1,
                }
            }
        ]
    );

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                subscriberStatus,videosDetailAggregate
            },
            `Successfully getChannelStats `
        )
    )


})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user?._id

    const videoChannelAggregate = await Video.aggregate(
        [
            {
                $match :{
                    owner : new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup : {
                    from : "likes",
                    localField : "_id",
                    foreignField : "video",
                    as : "asLikes"
                }
            },
            {
                $addFields : {
                    totalLikeCount : {
                        $size : "$asLikes"
                    },
                    
                }
            },
            {
                $project : {
                    totalLikeCount : 1,
                    "videoFile.url" : 1,
                    "thumbnail.url" :1,
                    title : 1,
                    description : 1,
                    duration : 1,
                    views : 1,
                    createdAt : 1,
                }
            }
        ]
    );

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                videoChannelAggregate
            },
            `Successfully get all videos of the channel`
        )
    )

})

export {
    getChannelStats, 
    getChannelVideos
    }