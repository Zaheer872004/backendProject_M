import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Like } from "../models/like.model.js"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { application } from "express"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!videoId){
        throw new ApiError(400,`provide the valid videoId`)
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(400,`provide the correct videoId`)
    }

    // comment schema connected to video and user schema.

    const commentAggregate = await Comment.aggregate(
        [
            {
                $match : {
                   video :  new mongoose.Types.ObjectId(videoId)
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
                    foreignField : "comment",
                    as : "likes"
                }
            },
            {
                $addFields : {
                    likeCount : {
                        $size : "$likes"
                    },
                    owner : {
                        $first : "$owner"
                    },
                    isLiked : {
                        $cond : { 
                            if : { $in : [req.user._id, "$likes.likedBy"]},
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
                    createdAt : 1,
                    likeCount : 1,
                    owner : {
                        username : 1,
                        fullName : 1,
                        "avatar.url" : 1
                    },
                    isLiked : 1,

                }
            }
        ]
    );
    
    const option =  {

    page : parseInt(page, 10),
    limit : parseInt(limit, 10)

    }

    const comment = await Comment.aggregatePaginate(
        commentAggregate,
        option
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200,comment,`successfully fetch the all comment in this video`)
    )

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params
    const { content } = req.body;

    if(!videoId){
        throw new ApiError(400,`videoId not provide please do`)
    }
    if(!content){
        throw new ApiError(400,`please provide the content for comment`)
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400,`videoId is not authorized doesn't content have through this videoId`)
    }

    const createComment = await Comment.create(
        {
            content : content,
            video : videoId,
            owner : req.user._id
        },
        {
            new : true
        }
    );

    const response = await Comment.findById(createComment._id);
    if(!response){
        throw new ApiError(400,`Unable to create the comment`)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,response,`Successfully created/added the comment`)
    )

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    const { content } = req.body;

    if( !commentId || !content){
        throw new ApiError(400, `please provide the commentId and content with all credentials`)
    }

    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(400, `comment not found`)
    }

    if(comment?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(400,`Only owner can edit the comment`)
    }

    const updateComment = await Comment.findByIdAndUpdate(
        comment?._id,
        {
            $set : {
                content : content,
            }
        },
        {
            new : true,
        }
    );

    if(!updateComment){
        throw new ApiError(500,`failed to edit comment please try again instant or later`)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,updateComment,`updateComment Successfully`)
    )


})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;

    if( !commentId ){
        throw new ApiError(400,`Please provide the commentId`)
    }

    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(400,`comment doesn't exists anymore`)
    }

    if(comment?.owner._id.toString() !== req.user._id.toString()){
        throw new ApiError(400, `only owner of this comment can edit`)
    }

    const resonse = await Comment.findByIdAndDelete(
        comment._id)

    await Like.deleteMany(
        {
            comment : commentId, // comment._id
            likedBy : req.user
        }
    )

    if(!resonse){
        throw new ApiError(500,`Unable to delete the comment`)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, resonse, `successfully deleted the comment`)
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}