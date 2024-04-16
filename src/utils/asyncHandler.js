
const asyncHandler1 = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err) => next (err))
    }
}




// const asyncHandler = (func) => { async () => {} }  //! this is the higher order function function inside a function.

//* same as above but here curly braces not add it is same as above.
const asyncHandler = (fn) => async (req, res, next) => {
    try {
         return await fn(req,res,next)
         
    } catch (error) {
        console.log(`some thing went wrong `+error.message);
        return res.status(error.code || 500).json({
            success : false,
            message : error.message
        })
    }
}



export {
    asyncHandler,
}