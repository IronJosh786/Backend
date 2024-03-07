import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshToken = async (existingUser) => {
    const user = existingUser;
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
};

const modifyTheUser = (existingUser) => {
    const modifiedUser = { ...existingUser };
    delete modifiedUser.password;
    delete modifiedUser.refreshToken;
    return modifiedUser;
};

const registerUser = asyncHandler(async (req, res) => {
    // get user details
    const { fullName, username, email, password } = req.body;

    // validate the data
    if (
        [fullName, username, email, password].some(
            (field) => !field || field.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are necessary");
    }

    // check if user already exists
    const existingUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existingUser) {
        throw new ApiError(409, "User with this username/email already exists");
    }

    // check for images
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverLocalPath = "";
    if (req.files?.coverImage) {
        coverLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    // upload to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    let coverImage = {};
    if (coverLocalPath !== "") {
        coverImage = await uploadOnCloudinary(coverLocalPath);
    }

    if (!avatar) {
        throw new ApiError(400, "Avatar is required");
    }

    // create user object - add details in the db
    const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    });

    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    // check if user got created
    if (!createdUser) {
        throw new ApiError(500, "User was not able to be registered");
    }

    // return response
    return res
        .status(201)
        .json(
            new ApiResponse(200, createdUser, "User registered successfully")
        );
});

const loginUser = asyncHandler(async (req, res) => {
    // take username/email & password from user
    const { username, email, password } = req.body;

    // validate the input
    if (
        !(email || username) ||
        (email && email.trim() === "") ||
        (username && username.trim() === "")
    ) {
        throw new ApiError(400, "Invalid username/email");
    }
    if (!password || password.trim() === "") {
        throw new ApiError(400, "Invalid password");
    }

    // find the user from db
    const existingUser = await User.findOne({
        $or: [{ username } || { email }],
    });
    if (!existingUser) {
        throw new ApiError(400, "No user exists with the given username/email");
    }

    // authenticate from db
    const isCorrect = await existingUser.isPasswordCorrect(password);
    if (!isCorrect) {
        throw new ApiError(400, "Incorrect password");
    }

    // generate access and refresh token
    const { accessToken, refreshToken } =
        await generateAccessAndRefreshToken(existingUser);

    const loggedInUser = modifyTheUser(existingUser);

    // send cookies
    const options = {
        httpOnly: true,
        secure: true,
    };

    // return response
    return res
        .status(200)
        .cookie("AccessToken", accessToken, options)
        .cookie("RefreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                "User Logged In successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    // revoke tokens
    await User.findByIdAndDelete(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
            },
        },
        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export { registerUser, loginUser, logoutUser };
