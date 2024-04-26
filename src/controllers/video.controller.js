import mongoose, {Schema, isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    // const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    
    //TODO: get all videos based on query, sort, pagination
    
    const {
        page = 1,
        limit = 10,  
        query,    // keyword to search
        sortBy, 
        sortType, 
        userId 
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    let skip = (page-1) * limit;

    const filter = {};
    if(query){
        filter.title = { $regex: new RegExp(query,"i") };
    }
    if(userId){
        filter.userId = userId;
    }

    const sort = {};
    if(sortBy && sortType){
        sort[sortBy] = sortType === 'asc' ? 1 : -1;
    }

    const response = await Video.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit);

    const totalVideo = await Video.countDocuments()


    // Aggregation





    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                result : response,
                page,
                limit,
                totalVideo,
                totalPage : Math.ceil(totalVideo/limit),

            }
        )
    )





})

const publishAVideo = asyncHandler(async (req, res) => {
    //* const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    // STEPS :
    //check user is loggedIn or not.
    // get the thumnail,video from the user and upload on server using multer.
    // get the title, description from the user.
    // validate the thumnail,video,title,description get are getting or not,
    // thumnail,video upload on Cloudinary and get the url of it.
    // Once get url of thumnail,video Make the object Add on database return the object after checking the database data exist or not.

    const { title, description} = req.body

    if( !title || !description ){
        throw new ApiError(400,`Enter the all field on it`)
    }

    const thumbnailFilePath = req.files?.thumnail[0]?.path;

    const videoFilePath = req.files?.videoFile[0]?.path

    if(!thumbnailFilePath || !videoFilePath){
        throw new ApiError(400,`Please provide videoFile and thumnailFile`)
    }

    // upload on cloudinary.

    const thumbnailCound = await uploadOnCloudinary(thumbnailFilePath)

    const videoCloud = await uploadOnCloudinary(videoFilePath)

    if( !thumbnailCound || ! videoCloud ){
        throw new ApiError(500, `Unable to upload on Cloudinary of thumnail and video file`)
    }

    console.log(videoCloud.duration);

    // // aggregation to get the user or owner
    // const ownerResponse = await Video.aggregate([
    //     {
    //         $match : {
    //             _id : new Schema.Types.ObjectId(req.user._id)
    //         }
    //     },
    //     {
    //         $lookup : {
    //             from : "User",
    //             localField : "owner",
    //             foreignField : "_id",
    //             as : "getOwner"
    //         }
    //     },
    //     {
    //        $project : {
    //             username : 1,
    //             fullName : 1
    //        } 
    //     }
    // ])

    const response = await Video.create({
        videoFile : videoCloud.url,
        thumbnail : thumbnailCound.url,
        title,
        description,
        duration : videoCloud.duration,
        owner : req.user?._id
    })

    const videoUploadCheck = await Video.findById(response._id);

    if(!videoUploadCheck){
        throw new ApiError(500,`unable to create the details in db`)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, response,`user successfully publish video`)
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    // here it should not be compulsory to user have loggedIn.
    // take the videoId from the params
    // check is that is correct or not.
    // database call to get that document 
    // check that document is fetch or not 
    // return response

    if(!videoId){
        throw new ApiError(400,`videoId not fetched/get`)
    }

    const response = await Video.findById(videoId);

    if(!response){
        throw new ApiError(400,`videoId is invalid provide corrected one`)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,response,`Successfully get video by Id`)
    )

})

const updateVideo = asyncHandler(async (req, res) => {
    // const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    // user Should be LoggedIn
    // check videoId is comming or not
    // accepting all the field for information like the title,description,thumbnail
    // validate it comes or not
    // also do for thumnails using the multer and cloudinary.
    // 

    const { videoId } = req.params
    const { title, description} = req.body;

    const thumbnailLocalPath = req.file?.path;

    if(!thumbnailLocalPath){
        throw new ApiError(400,`Unable to upload the thumbnail in server of having multer Problem`)
    }

    if(!videoId){
        throw new ApiError(400,`Provide the videoId`)
    }

    if( !title || !description ){
        throw new ApiError(400, `Provide all the field like title and description `)
    }

    const thumbnailCloudinary = await uploadOnCloudinary(thumbnailLocalPath);

    if(!thumbnailCloudinary){
        throw new ApiError(500,'Mistake while uploading in cloudinary')
    }

    const response = await Video.findByIdAndUpdate(videoId,
        {
            $set : {
                thumbnail : thumbnailCloudinary.url,
                title,
                description,
                duration : thumbnailCloudinary.duration,

            }
        },
        {
            new : true
        }

    )

    if(!response){
        throw new ApiError(400,`video not updated from the database`)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,response,`video updated Sucessfully`)
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    // user Should be LoggedIn
    // check videoId is comming or not
    // call to the database and deleted it 
    // return the response it is deleted.

    if(!videoId){
        throw new ApiError(400,`Provide the videoId`)
    }

    const response = await Video.findOneAndDelete(videoId);

    if(response){
        throw new ApiError(400,`video not deleted from the database`)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,response,`video deleted Sucessfully`)
    )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    // const { videoId } = req.params
    // const { isPublished } = req.body
    
    // user should be loggedIn with validation
    // check the videoId validate it
    // accept the isPublished or not give the value by true or false.
    // make the db call to update the isPublished value.
    // return the response.

    const { videoId } = req.params
    const { isPublished } = req.body
    
    if(!videoId){
        throw new ApiError(400,`Provide the videoId`)
    }

    if(!isPublished){
        throw new ApiError(400,`Provide the isPublished value`)
    }

    const response = await findByIdAndUpdate(videoId,
        {
            $set : {
                isPublished : isPublished
            }
        },
        {
            new : true
        } 
    )

    if(!response){
        throw new ApiError(400,`Something went wrong while updating the isPublished value `)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            response,
            `isPublished Successfully updated `
        )
    )

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
