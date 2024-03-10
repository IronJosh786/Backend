import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const channelId = req.user?._id;

    const subscribers = await Subscription.find({ channel: channelId });
    const subscriberCount = subscribers?.length;

    const allVideoDetails = await Video.aggregate([
        {
            $match: {
                owner: channelId,
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likesOnVideo",
            },
        },
        {
            $addFields: {
                totalLikesOnVideo: {
                    $size: "$likesOnVideo",
                },
            },
        },
        {
            $project: {
                likesOnVideo: 0,
            },
        },
        {
            $group: {
                _id: null,
                totalLikesOnAllVideos: {
                    $sum: "$totalLikesOnVideo",
                },
                totalViewsOnAllVideos: {
                    $sum: "$views",
                },
                videos: {
                    $push: "$$ROOT",
                },
            },
        },
        {
            $project: {
                _id: 0,
                totalLikesOnAllVideos: 1,
                totalViewsOnAllVideos: 1,
                videos: 1,
            },
        },
    ]);

    // if (!allVideoDetails?.length) {
    //     throw new ApiError(400, "Nothing to show here");
    // }

    const allDetails = {
        subscriberCount,
        allVideoDetails,
    };

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                allDetails,
                "Fetched channel stats successfully"
            )
        );
});

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const channelId = req.user?._id;

    const videos = await Video.aggregate([
        {
            $match: {
                owner: channelId,
            },
        },
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
                as: "likesOnVideo",
            },
        },
        {
            $addFields: {
                totalLikes: {
                    $size: "$likesOnVideo",
                },
                ownerDetails: {
                    $first: "$ownerDetails",
                },
            },
        },
        {
            $project: {
                likesOnVideo: 0,
            },
        },
    ]);

    if (!videos?.length) {
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "No videos to show"));
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, videos, "Fetched channel videos successfully")
        );
});

export { getChannelStats, getChannelVideos };
