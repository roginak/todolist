const express = require('express')
const userRoute = require('./user');
const flowRoute = require('./flow');
const adminRoute = require('./admin');
const router = express.Router()

router.use('/user', userRoute)
router.use('/flow', flowRoute)
router.use('/admin', adminRoute)

module.exports = router;