const express = require('express')
const router = express.Router()
const userCtrl = require('./user.ctrl')
const { jwtAuth } = require('./passport')

router.post('/login',  userCtrl.login)
router.post('/signup',  userCtrl.signup)
router.get('/userInfo', jwtAuth, userCtrl.userInfo)
router.put('/modify', jwtAuth, userCtrl.userModify)
router.post('/subscribe', jwtAuth, userCtrl.applySubscribe)
router.get('/subscribe', jwtAuth, userCtrl.checkSubscribe)
router.get('/setting', jwtAuth, userCtrl.getSetting)
router.put('/setting', jwtAuth, userCtrl.putSetting)


module.exports = router;