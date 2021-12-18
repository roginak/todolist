const express = require('express')
const router = express.Router()
const flowCtrl = require('./flow.ctrl')
const { jwtAuth } = require('../user/passport')

router.post('/data',  jwtAuth, flowCtrl.flowData)
router.get('/list',  jwtAuth, flowCtrl.flowList)
router.get('/detail/:idx',  jwtAuth, flowCtrl.flowDetail)
router.delete('/delete/:idx',  jwtAuth, flowCtrl.flowDelete)
router.get('/default',  jwtAuth, flowCtrl.getDefaultData)
router.post('/moving/:idx',  jwtAuth, flowCtrl.copyToMoving)


module.exports = router;