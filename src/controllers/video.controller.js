import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    //TODO: get all videos based on query, sort, pagination

    if (page < 1) {
        page = 1;
    }
    if (limit < 1) {
        limit = 10;
    }

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    const isUserValid = await User.findById(userId);

    const start = (page - 1) * limit;

    let matchStage = {};
    if (isUserValid && query?.trim()) {
        matchStage["$match"] = {
            owner: userId,
            $or: [
                { title: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } },
            ],
        };
    } else if (isUserValid) {
        matchStage["$match"] = {
            owner: userId,
        };
    } else if (query?.trim()) {
        matchStage["$match"] = {
            $or: [
                { title: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } },
            ],
        };
    } else {
        matchStage["$match"] = {};
    }

    let sortStage = {};
    if (sortBy && sortType) {
        sortStage["$sort"] = {
            [sortBy]: sortType === "asc" ? 1 : -1,
        };
    } else {
        sortStage["$sort"] = {};
    }

    const videos = await Video.aggregate([
        matchStage,
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
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
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likesOfVideo",
            },
        },
        {
            $addFields: {
                totalLikes: {
                    $size: "$likesOfVideo",
                },
                ownerDetails: {
                    $first: "$ownerDetails",
                },
            },
        },
        {
            $project: {
                likesOfVideo: 0,
            },
        },
        sortStage,
        {
            $skip: start,
        },
        {
            $limit: limit,
        },
    ]);

    if (!videos?.length) {
        throw new ApiError(400, "Could not find any matching videos");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Fetched videos successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    // TODO: get video, upload to cloudinary, create video

    if (!title || title.trim() === "") {
        throw new ApiError(400, "Title is required");
    }
    if (!description || description.trim() === "") {
        throw new ApiError(400, "Description is required");
    }

    const videoLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required");
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required");
    }

    try {
        const videoPath = await uploadOnCloudinary(videoLocalPath);
        const thumbnailPath = await uploadOnCloudinary(thumbnailLocalPath);

        if (!videoPath) {
            throw new ApiError(500, "Could not upload the video on cloudinary");
        }
        if (!thumbnailPath) {
            throw new ApiError(
                500,
                "Could not upload the thumbnail on cloudinary"
            );
        }

        const video = await Video.create({
            title,
            description,
            videoFile: videoPath.url,
            thumbnail: thumbnailPath.url,
            duration: videoPath.duration,
            owner: req.user?._id,
        });

        if (!video) {
            throw new ApiError(500, "Could not publish the video");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, video, "Published the video successfully")
            );
    } catch (error) {
        throw new ApiError(500, "Could not publish the video");
    }
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: get video by id

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    // this only gives the video but we might also want access to likes and comments for the given video
    // for comments there is already a controller for it
    // const video = await Video.findById(videoId);

    const video = await Video.aggregate([
        {
            $match: {
                _id: videoId,
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "videoLikes",
            },
        },
        {
            $addFields: {
                totalLikes: {
                    $size: "$videoLikes",
                },
            },
        },
        {
            $project: {
                videoLikes: 0,
            },
        },
    ]);

    if (!video?.length) {
        throw new ApiError(400, "Video does not exists");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Fetched video successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: update video details like title, description, thumbnail

    const { title, description } = req.body;
    const { thumbnail } = req.file?.path;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findOne({ _id: videoId });

    if (!video) {
        throw new ApiError(400, "Video not found");
    }

    const previousTitle = video.title;
    const previousDescription = video.description;
    const previousThumbnail = video.thumbnail;

    let thumbnailUrl = "";
    if (thumbnail?.trim()) {
        thumbnailUrl = await uploadOnCloudinary(thumbnail);
        if (!thumbnailUrl.trim()) {
            throw new ApiError(
                500,
                "Could not upload the thumbnail on cloudinary"
            );
        }
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title: title || previousTitle,
                description: description || previousDescription,
                thumbnail: thumbnailUrl || previousThumbnail,
            },
        },
        {
            new: true,
        }
    );

    if (!updatedVideo) {
        throw new ApiError(500, "Could not update the video");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: delete video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId);

    if (!deletedVideo) {
        throw new ApiError(400, "Video not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, deletedVideo, "Deleted the video successfully")
        );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findOne({ _id: videoId });

    if (!video) {
        throw new ApiError(400, "Video does not exist");
    }

    const status = !video.isPublished;

    // better approach will be to directly update as follows:
    // video.isPublished = !video.isPublished;
    // await video.save();
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: status,
            },
        },
        {
            new: true,
        }
    );

    if (!updatedVideo) {
        throw new ApiError(500, "Could not toggle the publish status");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedVideo,
                "Toggled the publish status of the video successfully"
            )
        );
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
