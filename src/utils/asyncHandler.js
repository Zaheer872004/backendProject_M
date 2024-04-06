
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err) => next(err))
    }
}




// const asyncHandler = (func) => { async () => {} }  //! this is the higher order function function inside a function.

//* same as above but here curly braces not add it is same as above.
const asyncHandler1 = (fn) => async (req, res, next) => {
    try {
         return await fn(req,res,next)
         
    } catch (error) {
        res.status(err.code || 500).json({
            success : false,
            message : err.message
        })
    }
}



export {
    asyncHandler,
}