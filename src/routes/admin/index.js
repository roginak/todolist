const express = require('express')
const router = express.Router()
const adminCtrl = require('./admin.ctrl')
const { jwtAuth } = require('../user/passport')

router.get('/member',  jwtAuth, adminCtrl.memberList)
router.get('/project',  jwtAuth, adminCtrl.projectList)
router.delete('/member/:member_index',  jwtAuth, adminCtrl.deleteMember)
router.put('/subscribe/:member_index',  jwtAuth, adminCtrl.setSubscribe)
router.put('/member/:member_index',  jwtAuth, adminCtrl.setMemberPass)
router.get('/subscribe',  jwtAuth, adminCtrl.getSubscribe)
router.delete('/subscribe/:subscribe_index',  jwtAuth, adminCtrl.deleteSubscribe)
router.put('/subscribeConfirm/:subscribe_index',  jwtAuth, adminCtrl.setSubscribeConfirm)

module.exports = router;