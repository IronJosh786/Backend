import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: toggle like on video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const isVideoValid = await Video.findById(videoId);

    if (!isVideoValid) {
        throw new ApiError(400, "Video does not exists");
    }

    const isVideoLiked = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id,
    });

    if (!isVideoLiked) {
        // create a new like for the given video
        const newVideoLike = await Like.create({
            video: videoId,
            likedBy: req.user?._id,
        });

        if (!newVideoLike) {
            throw new ApiError(500, "Could not like the video");
        }

        return res
            .status(200)
            .json(200, newVideoLike, "Video liked successfully");
    } else {
        // toggle like for the given video
        const deletedLike = await Like.findByIdAndDelete(isVideoLiked._id);

        if (!deletedLike) {
            throw new ApiError(500, "Could not toggle the like");
        }

        return res
            .status(200)
            .json(
                200,
                deletedLike,
                "Toggled the like for the video successfully"
            );
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    // TODO: toggle like on comment

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id");
    }

    const isCommentValid = await Comment.findById(commentId);

    if (!isCommentValid) {
        throw new ApiError(400, "Comment does not exist");
    }

    const isCommentLiked = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id,
    });

    if (!isCommentLiked) {
        // create a new like for the given comment
        const newCommentLike = await Like.create({
            comment: commentId,
            likedBy: req.user?._id,
        });

        if (!newCommentLike) {
            throw new ApiError(500, "Could not like the comment");
        }

        return res
            .status(200)
            .json(200, newCommentLike, "Comment liked successfully");
    } else {
        // toggle like for the given comment
        const deletedLike = await Like.findByIdAndDelete(isCommentLiked._id);

        if (!deletedLike) {
            throw new ApiError(500, "Could not toggle the like");
        }

        return res
            .status(200)
            .json(
                200,
                deletedLike,
                "Toggled the like for the comment successfully"
            );
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    // TODO: toggle like on tweet

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id");
    }

    const isTweetValid = await Tweet.findById(tweetId);

    if (!isTweetValid) {
        throw new ApiError(400, "Tweet does not exist");
    }

    const isTweetLiked = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id,
    });

    if (!isTweetLiked) {
        // create a new like for the given tweet
        const newTweetLike = await Like.create({
            tweet: tweetId,
            likedBy: req.user?._id,
        });

        if (!newTweetLike) {
            throw new ApiError(500, "Could not like the tweet");
        }

        return res
            .status(200)
            .json(200, newTweetLike, "Tweet liked successfully");
    } else {
        // toggle like for the given tweet
        const deletedLike = await Like.findByIdAndDelete(isTweetLiked._id);

        if (!deletedLike) {
            throw new ApiError(500, "Could not toggle the like");
        }

        return res
            .status(200)
            .json(
                200,
                deletedLike,
                "Toggled the like for the tweet successfully"
            );
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: req.user?._id,
                video: {
                    $exists: true,
                },
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $project: {
                            videoFile: 1,
                            thumbnail: 1,
                            title: 1,
                            description: 1,
                            duration: 1,
                            views: 1,
                            owner: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                videoDetails: {
                    $first: "$videoDetails",
                },
            },
        },
    ]);

    if (!likedVideos?.length) {
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "No videos liked by the user"));
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                likedVideos,
                "Fetched liked videos of the user successfully"
            )
        );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
