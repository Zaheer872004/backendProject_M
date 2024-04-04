import { User } from '../models/user.model.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'

const userRegister = asyncHandler( async (req,res)=>{
{/* 
    // accepting the data from the body
    // if user already exitst return error 
    // check able to get the data from the body
    // database query to add the data into the database 
    // taking the files such as avatar(required) and coverImage(not necessory) from the user
    // adding the middleware of multer and upload on cloudinary
    // taking the cloudinary.url(avatar/coverImage) and return to the response
    // In the response eleminate the password and refresh token 
    // check user is created or not 
    // return response
*/}
    const {username, email, password, fullName}  = req.body

    // console.log(username,email,fullName,password);
     if( !username || 
         !email || 
         !password || 
         !fullName
        // [fullName, email, username, password].some((field) => (
        //     field?.trim() === "")
        // )
    ){
        throw new ApiError(400,"Please enter the full details or all field")
    }

    const existUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if( existUser ){
        throw new ApiError(409,"user already exists")
    }

    console.log("Req.files:", req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;  // taking path from the multer

    console.log("Avatar path:", avatarLocalPath);

    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required file path not found");
    }

    const avatarResponse = await uploadOnCloudinary(avatarLocalPath);

    const coverImageResponse = await uploadOnCloudinary(coverImageLocalPath);

    console.log("on cloud" + avatarResponse);

    if(!avatarResponse){
        throw new ApiError(400,"Avatar file is required on cloud error");
    }
    console.log(avatarResponse);


    const user = await User.create({
        fullName,
        avatar:avatarResponse.url,
        coverImage: coverImageResponse?.url || "",
        username: username.toLowerCase(),
        password,
        email,  
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while user registration");
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser , "User Register Successfully")
    )
   
}) 


    

export {
    userRegister,

}















