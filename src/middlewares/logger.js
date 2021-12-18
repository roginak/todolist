const morgan = require('morgan');


exports.loggerLoader = async (app) => {
    app.use((req, res, next) => {
        if(process.env.NODE_ENV === 'production') {
            morgan('combined')(req, res, next)
        } else {
            morgan('dev')(req, res, next)
        }
    })
}