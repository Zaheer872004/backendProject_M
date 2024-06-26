import mongoose, {Schema} from "mongoose";
import validator from "validator";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const userSchema = new Schema({
    
    username : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true, 
        index : true,  // for better searching like instagram user based on username,
    },
    email : {
        type : String,
        required : true,
        unique : true,
        validate :{
            validator : validator.isEmail,
            message : `Please provide a valide email`
        },
        lowercase : true,
        trim : true,
    },
    fullName : {
        type : String,
        required : true,
        trim : true,
        index : true
    },
    avatar : {
        type : String, // cloudinary url 
        required : true,

    },
    coverImage : {
        type : String,

    },
    watchHistory : [
        {
            type : Schema.Types.ObjectId,
            ref : "User",
        }
    ],
    password : {
        type : String,
        required : [true, `Password is required min length 6 character`],
        validate : {
            validator : function(v) {
                // check from min 6 length
                if( v.length < 6){
                    return false;
                }
                // check for at least one specail character
                const specialChars = /[!@#$%^&*(),.?":{}|<>]/g;
                if(!specialChars.test(v)){
                    return false;
                }
                return true;
            },
            message : `Password must be at least 6 characters long and ne special character`
        },
    },
    refreshToken : {
        type : String
    },
    is_verified : {
        type : Boolean,
        default : 0
    }

},{timestamps : true})


// encrypting the password 
userSchema.pre('save', async function (next) {  // here don't user arrow function becus this not access it
    if(!this.isModified("password")) return next() 
    this.password = await bcrypt.hash(this.password, 10)
    next()
})


// password checking correct or not.
userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken =  function(){

   return jwt.sign(
            // payload
        {
            _id : this._id,
            email: this.email,
            username : this.username,
            fullName : this.fullName
        },
            // secret key
        process.env.ACCESS_TOKEN_SECRET,
            // expiredTime
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken =  function(){
    return jwt.sign(
            // payload
        {
            _id : this._id
        },
            // secret key
        process.env.REFRESH_TOKEN_SECRET,
            // expiredTime
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User = mongoose.model("User",userSchema)