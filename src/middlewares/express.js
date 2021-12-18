const cookieParser = require('cookie-parser');
const express = require('express');
const session = require('express-session');
const config = require('../config');
const cors = require('cors')

exports.expressLoader = async (app) => {
    try {

        app.use(cors({ credentials: true, origin: [config.appurl, config.apiurl, , 'http://localhost:8080'], methods: [ 'GET', 'POST', 'DELETE', 'PUT' ] }))
    
        // req.body parser
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));

        app.use(cookieParser(process.env.COOKIE_SECRET))
    
        app.use(session({
            resave: false,
            saveUninitialized: false,
            secret: config.cookieSecret,
            cookie: {
                httpOnly: true,
                secure: false,
            },
            name: 'session-cookie',
        }))


    } catch (error) {
        console.log(error)
        next(error)
    }

}