import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Like } from "../models/like.model.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;

    if(!content){
        throw new ApiError(400,`Please provide the content for the tweet`)
    }

    const tweet = await Tweet.create(
        {
            content : content,
            owner : req.user?._id
        },
        {
            new : true,
        }
    );

    const response = await Tweet.findById(tweet._id)
    if(!response){
        throw new ApiError(500,`Unable to create the tweet please try again later/again`)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,response,`Successfully created the tweet`)
    )

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    const { userId } = req.params;
    const {page = 1, limit = 10} = req.query


    if(!userId){
        throw new ApiError(400, " Please provide the userId")
    }

    const user = await User.findById(userId);
    if(!user){
        throw new ApiError(400, `User not found`)
    }

    const tweetAggregate = await Tweet.aggregate(
        [
            {
                $match : {
                    owner : new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup : {
                    from : "users",
                    localField : "owner",
                    foreignField : "_id",
                    as : "owner"
                }
            },
            {
                $lookup : {
                    from : "likes",
                    localField : "_id",
                    foreignField : "tweet",
                    as : "like"
                }
            },
            {
                $addFields : {
                    likedCount : {
                        $size : "$like"
                    },
                    owner : {
                        $first : "$owner"
                    },
                    isLiked : {
                        $cond : { 
                            if : { $in : [req.user._id, "$like.likedBy"]},
                            then : true,
                            else : false
                        }
                    }
                }
            },
            {
                $sort : {
                    createdAt : -1
                }
            },
            {
                $project : {
                    content : 1,
                    likedCount : 1,
                    createdAt : 1,
                    owner : {
                        username : 1,
                        fullName : 1,
                        "avatar.url" : 1,
                    },
                    isLiked : 1,
                }
            }
        ]
    );

    const option = {
        page : parseInt(page,1),
        limit : parseInt(limit,10)
    }

    const response  = await Tweet.aggregatePaginate(
        tweetAggregate,
        option
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200,response,`Successfully get all the user tweets`)
    )


})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;
    const { content } = req.body;

    if(!tweetId || !content){
        throw new ApiError(400,`please provide the tweetId and content of the tweet`)
    }

    const tweet = await Tweet.findById(tweetId)

    if( !tweet ){
        throw new ApiError(400,`tweet not found`)
    }

    if(tweet?.owner._id.toString() !== req.user?._id.toString()){
        throw new ApiError(400,`Only owner of this tweet can edit or update`)
    }

    const updateTweet = await Tweet.findByIdAndUpdate(
        tweet?._id,
        {
            $set : {
                content : content,
            }
        },
        {
            new : true,
        }
    );

    if(!updateTweet) { 
        throw new ApiError(500,`Unable to update/edit the tweet `)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,updateTweet,`Successfully updated the tweet`)
    )

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;

    if( !tweetId ){
        throw new ApiError(400, `provide the tweetId `)
    }

    const tweet = await Tweet.findById(tweetId)

    if( !tweet ){
        throw new ApiError(400, `tweet not found or exists`)
    }

    if( tweet?.owner._id.toString() !== req.user?._id.toString()){
        throw new ApiError(400, `Only owner to this tweet can delete the tweet`)
    }

    const response  = await Tweet.findByIdAndDelete(tweet?._id);

    if(!response){
        throw new ApiError(500,`unable to delete the tweet try again later`)
    }


    await Like.deleteMany(
        {
            tweet : tweetId,
            likedBy : req.user,           
        }
    )


})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}