import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../config/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse";

const registerUser = asyncHandler(async (req, res) => {
    /*
    1.get user details from frontend
    2.validation 
    3.check if user already exists: username, email
    4.check for images and avatar
    5.upload them to cloudinary
    6.create user object - create entry in db
    7.remove password and refresh token field from response
    8.check for user creation
    9.return res
    */

    //1
    const { fullName, email, username, password } = req.body

    //2
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Invalid email format")
    }
    if (username.length < 3 || username.length > 20) {
        throw new ApiError(
            400,
            "Username must be between 3 and 20 characters"
        )
    }
    const usernameRegex = /^[a-zA-Z0-9_]+$/;

    if (!usernameRegex.test(username)) {
        throw new ApiError(
            400,
            "Username can only contain letters, numbers, and underscores"
        );
    }
    if (password.length <= 6) {
        throw new ApiError(
            400,
            "Password must be at least 7 characters long"
        );
    }

    //3
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if(existedUser) {
        throw new ApiError(
            409,
            "A user with this email or username already exists"
        )
    }

    //4
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(
            400,
            "Avatar file is required"
        )
    }

    //5
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(
            400,
            "Avatar file is required"
        )
    }

    //6
    const user = User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        username: username.toLowerCase(),
        password
    })

    //7 and 8
    const createdUser = User.findById(user._id).select(
        "-password -refreshToken"
    )
    
    if(!createdUser){
        throw new ApiError(
            500,
            "Something went wrong while registering the user"
        )
    }

    //9
    return res.status(201).json(
        new ApiResponse(
            200,
            createdUser,
            "User registered successfully"
        )
    )

})

export { registerUser }