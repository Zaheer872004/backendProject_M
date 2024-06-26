import fs from 'fs'
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({ 
  cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) =>{
    try {
        
        if(!localFilePath) {
            console.log("not able to get the localfilePath");
            return null;
        }
        // upload the file on cloudinary
        
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type : "auto" // auto means accept all type of resource photo/video/files etc
        })
        
        // file has been uploaded successfully
        // fs.unlinkSync(localFilePath)
        console.log(`File is uploaded on cloudinary`,response,response.url);
        return response;
    } catch (error) {
        // if here get error means in our server have file/videos but not uploadded on cloudinary so that unliked(deleted from server for unjumbled)
        console.log("unable to upload the file in the cloudin");
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed 
        return null;        
    }
}


export {
    uploadOnCloudinary,

}