import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on video
    
    // accepting the videoId validate it using isValidObjectId(videoId)
    // checking in the db it is exists or not if not then return video not found
    // check the user have already liked then just remove the like using db call and return the response
    // else make and create a like using the videoId and likedBy= req.user?._id
    // return it
    
    const {videoId} = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Please provide the valid videoId")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400,`video not found`)
    }

    const liked = await Like.findOne({
        video : videoId,
        likedBy : req.user?._id
    })

    if(liked){
        await Like.findByIdAndDelete(liked._id);
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    isLiked : false
                },
                `Video like removed`
            )
        )
    }

    const response = await Like.create({
        video : videoId,
        likedBy : req.user?._id,
    })

    if(!response){
        throw new ApiError(500,`Unable to like the video`)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                isLiked : true
            },
            `Like a Video`
        )
    )

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,`Please provide a valid commentId`)
    }

    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(400,`comment not found`)
    }

    const liked = await Like.findOne({
        comment : commentId,
        likedBy : comment?._id
    })

    if(liked){
        // it means user already done to like now remove their like
        await Like.findByIdAndDelete(liked._id);
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    isLiked : false
                },
                `Remove the like on comment`
            )
        )
    }

    const response = await Like.create(
        {
            comment : commentId,
            likedBy : req.user?.id
        }
    )
    if(!response){
        throw new ApiError(400,`unable to like on comment try again later`)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                result : response,
                isLiked : true
            },
            `Successfully like on comment`
        )
    )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,`please provide the valid tweetId`)
    }

    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(400,`Tweet not found`)
    }

    const liked = await Like.findOne(
        {
            tweet : tweetId,
            likedBy : tweet._id
        }
    )

    if(liked){
        // remove the like 
        await Like.findByIdAndDelete(liked._id);
        return res
        .status
        .json(
            new ApiResponse(
                200,
                {
                    isLiked : false

                },
                `Successfully Remove the like from the tweet`
            )
        )
    }


    const resonse = await Like.create(
        {
            tweet : tweetId,
            likedBy : req.user?._id,
        }

    )

    if(!resonse ){
        throw new ApiError(500,`Unable to like on the tweet`)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                isLiked : true,
            },
            `Successfully like on the tweet`
        )
    )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
