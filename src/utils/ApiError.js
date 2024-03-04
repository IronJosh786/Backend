class ApiError extends Error {
    constructor(
        statusCode,
        message='Something went wrong',
        stack='',
        errors=[]
    ){
        super(message)
        this.message = message
        this.statusCode = statusCode
        this.success = false
        this.errors = errors
        this.data = null

        if(stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constuctor)
        }
    }
}

export { ApiError }

