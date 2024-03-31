import multer from "multer";

// we use here diskStorage not memoryStorage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/")
    },
    filename: function (req, file, cb) {
    //   const uniqueSuffix = Math.floor(Math.random()*100)
      cb(null, file.originalname);
    }
})

// console.log(storage.destination);
  
export const upload = multer({
    storage 
})
