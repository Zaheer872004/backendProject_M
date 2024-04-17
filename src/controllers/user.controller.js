import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { option } from "../utils/cookieOption.js";
import { sendVerificationEmail } from "../utils/mailService.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, `${error.message}`);
  }
};

const userRegister = asyncHandler(async (req, res) => {
  {
    /* 
    // accepting the data from the body
    // if user already exitst return error 
    // check able to get the data from the body
    // check for the image and video if there.
    // database query to add the data into the database 
    // taking the files such as avatar(required) and coverImage(not necessory) from the user
    // adding the middleware of multer and upload on cloudinary
    // taking the cloudinary.url(avatar/coverImage) and return to the response
    // In the response eleminate the password and refresh token 
    // check user is created or not 
    // return response
*/
  }
  const { username, email, password, fullName } = req.body;

  // console.log(username,email,fullName,password);
  if (
    !username ||
    !email ||
    !password ||
    !fullName
    // [fullName, email, username, password].some((field) => (
    //     field?.trim() === "")
    // )
  ) {
    throw new ApiError(400, "Please enter the full details or all field");
  }

  const existUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existUser) {
    throw new ApiError(409, "user already exists");
  }

  console.log("Req.files:", req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path; // taking path from the multer

  console.log("Avatar path:", avatarLocalPath);

  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files?.coverImage[0]?.path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required file path not found");
  }

  const avatarResponse = await uploadOnCloudinary(avatarLocalPath); // here I'm getting the error

  const coverImageResponse = await uploadOnCloudinary(coverImageLocalPath);

  console.log("on cloud" + avatarResponse);

  if (!avatarResponse) {
    throw new ApiError(400, "Avatar file is required on cloud error");
  }

  console.log(avatarResponse);

  const user = await User.create({
    fullName,
    avatar: avatarResponse?.url,
    coverImage: coverImageResponse?.url || "",
    username: username.toLowerCase(),
    password: password,
    email,
  });

  const createdUser = await User.findById(user._id).select(
    "-refreshToken -password"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while user registration");
  }
{
  try {
    await sendVerificationEmail(
      email,
      fullName,
      user._id
    );
  } catch (error) {
    console.log(`Error Sending the verification email : `, error.message);
    throw new ApiError(500, `Failed to send the verification email`);
  }
}
  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        createdUser,
        "User Register Successfully check your email to verify it. "
      )
    );
});

const verifyEmail = async (req, res) => {
  const { user_id }  = req.query;

  try {
    const response1 = await User.findByIdAndUpdate( user_id , {
      $set: {
        is_verified: true,
      },
    });
    console.log(`User verification response : `+ response1);
    // res.render("email-verified");
    return res.status(200).json(
      new ApiResponse(200, response1 ,`User Successfully verified ${response1.status}`)
    )
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({ error: "Failed to verify email"+error.message });
  }
};

const userLoggedIn = asyncHandler(async (req, res) => {
  // TODO
  // taking the details from the user or frontend
  // validate all filed is come or not like username or email and password
  // query to the backend does user exists or not
  // checking the password correct or not
  // generate the refresh token saved on the backend field
  // generate the access token
  // put refresh and access both token into the cookies in save mode means httponly

  const { username, email, password } = req.body;
  console.log(username, email, password);
  if (!(username || email) || !password) {
    throw new ApiError(400, "Please enter the all field");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(
      400,
      "user not exists please signup or register first..."
    );
  }

  // password check
  const isPasswordCheck = user.isPasswordCorrect(password);

  if (!isPasswordCheck) {
    throw new ApiError(401, "Please enter the correct password");
  }

  // if you passing the user._id then you pass the mongoose object like this new ObjectId('660fc5d0c82c7a3803c62888') but mondodb only want the which is this 660fc5d0c82c7a3803c62888
  // const userWithValidId = user._id.toString()

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id.toString()
  ); // 660fc5d0c82c7a3803c62888

  const loggedInUser = await User.findOne(user._id).select(
    "-password -refreshToken"
  );

  // send the cookies

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "Successfully user LoggedIn"
      )
    );
});

const userLogout = asyncHandler(async (req, res) => {
  // Algorithm for logout.
  // remove the data(tokens) from the cookies
  // remove the refreshToken field on the database

  // first of all user have to  already login how to take the user._id

  //const user = req.user;  // we make the custom middleware

  const newUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: "",
      },
    },
    {
      new: true,
    }
  );

  if (!newUser) {
    throw new ApiError(400, "Unauthenticated user");
  }

  return res
    .status(200)
    .cookie("accessToken", "", option)
    .cookie("refreshToken", "", option)
    .json(new ApiResponse(200, "", `User successfully LoggedOut`));
});

const userAccessToken = asyncHandler( async (req, res) =>{
   // we get the user id using the req.user._id; using this middleware.
   // taking the refresh token from the users and check given refresh token is valid as per my databases token if yes the generate the new tokens else return error.

  // { req.user._id }  from the custom middleware.

   const token = req.cookies?.refreshToken || req.body.refreshToken

   if(!token){
    throw new ApiError(400,`refreshToken is missing`)
   }

   const databaseToken = await User.findById(req.user._id)

   if(token !== databaseToken?.refreshToken){
    throw new ApiError(400,`refreshToken is Invalid`)
   }

   // generate the new Token 
   const { newRefreshToken, accessToken } = await generateAccessAndRefreshTokens(req.user._id)

   // save the new refresh token on the database and set on the cookies. refresh and access both.

   const user = await User.findOne(req.user._id).select("-password -refreshToken")

   res.
   status(200).
   cookie("refreshToken",newRefreshToken,option).
   cookie("accessToken", accessToken,option).
   json(
    new ApiResponse(
      200,
      {
        users : user, refreshToken : newRefreshToken, accessToken
      },
      `User Successfully generate the access and refresh Token`
    )
   )

})

const changePasswordUser = asyncHandler( async (req, res) =>{

  // if user want to change the password then its already have to loggedIn the user.
  // validate the user is loggedIn or not its done using the middleware to verifyJWT. 
  // Accept the older password and newer password or if want to reenter/conformPassword the password again so the user typo avoid
  // then check the older password is corrected or not if yes then process to next
  
  // check the newer password and reenter/conformPassword password is same or not if yes then process next
  // newer password are do the hash beacus as per the businness logic it is recommendate 
  // then return the response with 200 all oKay.
  
  // One addition for security purpose send the otp of their gmail and accept it then process to the next.
  
  // const userId = req.user._id

  const { oldPassword, newPassword, conformPassword }  = req.body

  if(
    !oldPassword || 
    !newPassword || 
    !conformPassword
  ){
    throw new ApiError(400,`Please enter the all field for password changing`)
  }

  if( newPassword !== conformPassword ){
    throw new ApiError( 400, `Enter the Password carefully on newPassword and conformPassword `|| error.message)
  }

  const user = await User.findById(req.user._id)

  const isPasswordCorrectCheck = await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrectCheck){
    throw new ApiError(400,`Enter the correct password`)
  }
  console.log(oldPassword,newPassword,conformPassword);
  // we have written the hook of pre in userModel just before to go in the database my password will hash it.

  user.password = newPassword
  await user.save({validateBeforeSave : false})


  // const user = await findByIdAndUpdate(
  //   req.user._id,
  //   {
  //     $set : {
  //         password : newPassword
  //     }
  //   },
  //   {
  //     new : true
  //   }
  // )

  return res.
  status(200).
  json(
    new ApiResponse(200,user,`User successfully changed the password`)
  )
})

const changeProfileDetails = asyncHandler( async (req, res)=>{
  // here we want to change the details of user link the username and fullname 

  // Check for user is register or not if yes get the id by cookies or body
  // get the details like the username and fullname 
  // call to the data bases 
  // call by findByIdAndUpdate and change the data.

  req.user._id;
  const { username, fullName } = req.body

  if(
    !username ||
    !fullName
  ){
    throw new ApiError(400,`Enter the username and fullName`)
  }

  const user = await User.findByIdAndUpdate(req.user._id,
    {
      $set : {
        username,
        fullName
      }
    },
    {
      new : true
    }
  ).select(" -password -refreshToken ")

  return res.
  status(200).
  json(
    new ApiResponse(200,user,`User successfully change the username and fullName`)
  )

})

const changeAvatar = asyncHandler( async (req, res)=>{
  // user is already exists 
  // add the middleware on the routes so multer upload the file on the localServer and cloudinary upload the onCloudinary
  
  // taking the path of the localserver using the req.file.
  // That file add validation if exist or not
  // upload on the cloudinary using the uploadOnCloudinary method.
  // add validation it is  uploaded or not.
  // After that return the response.

  const avatarLocalPath = req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(400,`Failed on upload the avatar file on server`)
  }

  const cloudResponse = await uploadOnCloudinary(avatarLocalPath)


  if(!cloudResponse){
    throw new ApiError(500,`Failed to upload on cloudinary`)
  }

  const response = await User.findByIdAndUpdate(req.user._id,
    {
      $set : {
          avatar : cloudResponse.url
      }
    },
    {
      new : true
    }
  ).select("-password -refreshToken")

  if(!response){
    throw new ApiError(500,`Something went wrong on the database call`)
  }

  return res.
  status(200).
  json(
    new ApiResponse(200,response,`User successfully update the avatar`)
  )

  // One thing is remaining get the previous avatar image id and delete it.  make on helper function for file deletion because it used a lot.

})

const changeCoverImage = asyncHandler( async (req, res)=>{
  // user is already exists 
  // add the middleware on the routes so multer upload the file on the localServer and cloudinary upload the onCloudinary
  
  // taking the path of the localserver using the req.file.
  // That file add validation if exist or not
  // upload on the cloudinary using the uploadOnCloudinary method.
  // add validation it is  uploaded or not.
  // After that return the response.

  const coverImageLocalPath = req.file?.path

  if(!coverImageLocalPath){
    throw new ApiError(400,`Failed on upload the coverImage file on server`)
  }

  const cloudResponse = await uploadOnCloudinary(coverImageLocalPath)


  if(!cloudResponse){
    throw new ApiError(500,`Failed to upload on cloudinary`)
  }

  const response = await User.findByIdAndUpdate(req.user._id,
    {
      $set : {
          coverImage : cloudResponse.url
      },
    },
    {
      new : true
    },
  ).select("-password -refreshToken")

  if(!response){
    throw new ApiError(500,`Something went wrong on the database call`)
  }

  return res.
  status(200).
  json(
    new ApiResponse(200,response,`User successfully update the coverImage`)
  )

})

const getCurrentUser = asyncHandler( async (req,res)=>{
  
  // console.log(req.user);
  const val = req.user
  console.log(val);

  return res.
  status(200).
  json(
    new ApiResponse(
      200,
      req.user,
      `user Successfully get their details`
    )
  )
})

const getUserChannelProfile = asyncHandler( async(req,res)=>{

  // const userId = req.user._id

  const { username } = req.params;

  console.log(username);

  if(!username){
      throw new ApiError(400,`Channel doesn't exist anymore`)
  }

  //  find in database then apply the pipeline

  // * const userId1 = await User.find(req.user._id)
  
  // check userId1 is there in database or not 

  // for Saving the extra database call. lets write here
  const channel = await User.aggregate([
    {
        $match : {
            username : username?.toLowerCase()
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
            subscriberCount :{
                $cond :{
                  if: { $isArray:"$subscribers"},
                  then: { $size : "$subscribers" },
                  else : 0,
                }  // $size: "$subscribers"  here also used the $count operator.
            },
            channelSubscribedCount : {
                $cond:{
                  if: { $isArray:"$subscribedTo"},
                  then: { $size :"$subscribedTo"},
                  else: 0
                }  // $size: "$subscribedTo" here also used the $count operator.
            },
            isSubscribed : {
                $cond : {
                  if: { $and: [ { $isArray: "$subscribers" }, { $in: [req.user._id, "$subscribers.subscriber"] } ] },
                    then : true,
                    else : false
                }
            }
       }
    },
    {
        $project : {
            username : 1,
            fullName : 1,
            email : 1,
            avatar : 1,
            coverImage : 1,
            subscriberCount : 1,
            channelSubscribedCount : 1,
            isSubscribed : 1,
        }
    }
  ])

  if(!(channel?.length > 0)){  // (!channel?.length)
    throw new ApiError(404,`Channel does not exist`)
  }

  // console.log(channel);
  // console.log(channel[0]);

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      {
        data : channel[0]
      },
      ` Successfully get or fetched the data for channel Profile `
    )
  )

})



export {
   userRegister, 
   userLoggedIn, 
   userLogout, 
   verifyEmail, 
   userAccessToken,
   changePasswordUser,
   changeAvatar,
   changeCoverImage,
   changeProfileDetails,
   getCurrentUser,
   getUserChannelProfile
};











