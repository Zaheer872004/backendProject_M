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

   const user = await User.findOne(req.user._id).select("-password -refreshToken -accessToken")

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

export {
   userRegister, 
   userLoggedIn, 
   userLogout, 
   verifyEmail, 
   userAccessToken,

};
