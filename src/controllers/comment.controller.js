import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (page < 1) {
        page = 1;
    }
    if (limit < 1) {
        limit = 10;
    }

    const start = (page - 1) * limit;

    const isPresent = await Video.findById(videoId);
    if (!isPresent) {
        throw new ApiError(400, "Video not found");
    }

    const videoComment = await Comment.aggregate([
        {
            $match: {
                video: videoId,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "commentor",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                commentor: {
                    $first: "$commentor",
                },
            },
        },
        {
            $skip: start,
        },
        {
            $limit: limit,
        },
    ]);

    if (!videoComment?.length || start >= videoComment.length) {
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "No comments to show"));
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videoComment,
                "Fetched video comments successfully"
            )
        );
});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params;
    const { content } = req.body;

    const isPresent = await Video.findById(videoId);
    if (!isPresent) {
        throw new ApiError(400, "Video not found");
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Invalid comment");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id,
    });

    if (!comment) {
        throw new ApiError(500, "Could not create the comment");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Created comment successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    const { content } = req.body;

    const isPresent = await Comment.findById(commentId);
    if (!isPresent) {
        throw new ApiError(400, "Comment not found");
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Invalid comment");
    }

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content,
            },
        },
        { new: true }
    );

    if (!comment) {
        throw new ApiError(500, "Could not update comment");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Updated comment successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;

    const isPresent = await Comment.findById(commentId);
    if (!isPresent) {
        throw new ApiError(400, "Comment not found");
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if (!deletedComment) {
        throw new ApiError(500, "Could not delete comment");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, deletedComment, "Deleted comment successfully")
        );
});

export { getVideoComments, addComment, updateComment, deleteComment };
