import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'

const registerUser = asyncHandler(async(req, res) => {

    // get user details
    const {fullName, username, email, password} = req.body;

    // validate the data
    if (
        [fullName, username, email, password].some((field) => field?.trim() === '')
    ) {
        throw new ApiError(400, 'All fields are necessary')
    }

    // check if user already exists
    const existingUser = User.findOne({
        $or: [{username}, {email}]
    })

    if(existingUser) {
        throw new ApiError(409, 'User with this username/email already exists')
    }

    // check for images
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath) {
        throw new ApiError(400, 'Avatar is required')
    }

    // upload to cloudinary 
    const avatar = await uploadOnCloudinary(avatarLocalPath) 
    let coverImage = {};
    if(coverLocalPath) {
        coverImage = await uploadOnCloudinary(coverLocalPath)
    }

    if(!avatar) {
        throw new ApiError(400, 'Avatar is required')
    }

    // create user object - add details in the db
    const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ''
    })

    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    // check if user got created
    if(!createdUser) {
        throw new ApiError(500, 'User was not able to be registered')
    }

    // return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, 'User registered successfully')
    )
})

export {registerUser}