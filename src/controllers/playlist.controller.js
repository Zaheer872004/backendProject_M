import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { errorMonitor } from "nodemailer/lib/xoauth2/index.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist

    if( !name || !description){
        throw new ApiError(400,`Please provide the full creadentails like name, description`)
    }

    const playlistCreate = await Playlist.create(
        {
            name,
            description,
            owner : req.user._id,
        }
    )

    if(!playlistCreate){
        throw new ApiError(500,`Unable to create the playlist`)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                playlistCreate
            },
            `Playlist created Successfully`
        )
    )

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, `Please provide the playlistId and videoId with valid one`)
    }

    const video = await Video.findById(videoId)
    if(!video ){
        throw new ApiError(400,`Video not found`)
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(400,`playlist not found`)
    }

    if( 
        playlist?.owner.toString() && video?.owner.toString() !== req.user._id.toString()
    ){
        throw new ApiError(400,`Only owner of the playlist can add video in playlist`)
    }

    const updatePlaylist = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {
            $addToSet : {
                videos : videoId
            }
        },
        {
            new : true,
        }
    )

    if(!updatePlaylist){
        throw new ApiError(500,"unable to add the video in the playlist ")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                updatePlaylist,
            },
            `Successfully added the video in the playlist`
        )
    )




})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist



    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, `Please provide the playlistId and videoId with valid one`)
    }

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(400,`Video not found`)
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(400,`playlist not found`)
    }

    if(
        video.owner.toString() && playlist.owner.toString() !== req.user?._id.toString()
    ){
        throw new ApiError(400,`Only owner of the playlist can remove the video from the playlist`)
    }


    const updatePlaylistDeleteVideo = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull : {
                videos : videoId
            }
        },
        {
            new : true,
        }
    )

    if(!updatePlaylistDeleteVideo){
        throw new ApiError(500,"unable to remove the video in the playlist ")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                updatePlaylistDeleteVideo,
            },
            `Successfully remove the video in the playlist`
        )
    )

    



})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,`Invalid playlistId`)
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400,`Playlist not found`)
    }

    if(
        playlist?.owner.toString() !== req.user?._id.toString()
    ){
        throw new ApiError(400,`Only owner of this playlist can delete the playlist`)
    }

    await Playlist.findByIdAndDelete(playlist?._id);

    return res
    .status(200)
    .json(
        200,
        {
            
        },
        `Playlist successfully deleted`
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,`Please provide the correct playlistId`)
    }

    if(!name || !description){
        throw new ApiError(400,`Please provide full credentail or details`)
    }

    const playlist = await findById(playlistId);
    if(!playlist){
        throw new ApiError(400,`Playlist not found `)
    }

    if(
        playlist?.owner.toString() !== req.user?._id.toString()
    ){
        throw new ApiError(400,`Only owner of this playlist can update the playlist`)
    }

    const updatePlaylistResponse = await Playlist.findByIdAndUpdate(
        playlist._id,
        {
            $set : {
                name : name,
                description : description,
            }
        },
        {
            new : true
        }
    );

    if(!updatePlaylistResponse){
        throw new ApiError(500,`unable to the update the playlist with name and description`)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                updatePlaylistResponse,
            },
            `Successfully updated the playlist with name and description`
        )
    )

})

export {
    createPlaylist,   // done
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,   // done
    removeVideoFromPlaylist,   // done
    deletePlaylist,    // done 
    updatePlaylist    // done
}