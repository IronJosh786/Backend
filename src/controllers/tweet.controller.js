import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet

    // take tweet input and validate it
    const { content } = req.body;
    if (!content.trim()) {
        throw new ApiError(400, "Enter a valid tweet");
    }

    // create tweet
    const tweet = await Tweet.create({
        content,
        owner: req.user?._id,
    });

    // check if tweet was created
    if (!tweet) {
        throw new ApiError(500, "Could not create tweet");
    }

    // return response
    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet was successfully created"));
});

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(400, "User does not exists");
    }

    const tweetsByUser = await Tweet.aggregate([
        {
            $match: {
                owner: user._id,
            },
        },
    ]);
    console.log(tweetsByUser);
    if (!tweetsByUser.length) {
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "No tweets to show"));
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tweetsByUser,
                "Fetched user tweets successfully"
            )
        );
});

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;
    const { content } = req.body;

    const isPresent = await Tweet.findById(tweetId);
    if (!isPresent) {
        throw new ApiError(400, "Tweet does not exists");
    }
    if (!content.trim()) {
        throw new ApiError(400, "Enter a valid tweet");
    }

    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content,
            },
        },
        { new: true }
    );

    if (!tweet) {
        throw new ApiError(500, "Could not update tweet");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet was successfully updated"));
});

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;

    const isPresent = await Tweet.findById(tweetId);
    if (!isPresent) {
        throw new ApiError(400, "Tweet does not exists");
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
    if (!deletedTweet) {
        throw new ApiError(400, "Tweet was not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, deletedTweet, "Tweet was successfully deleted")
        );
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
