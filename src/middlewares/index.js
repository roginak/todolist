const { expressLoader } = require('./express')
const { loggerLoader } = require('./logger')
const { passportLoader } = require('./passport')

exports.middlewareLoaders = async (app) => {

    // express
    await expressLoader(app);
    
    loggerLoader(app);

    // passport
    passportLoader(app);
}