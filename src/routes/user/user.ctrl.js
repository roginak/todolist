const passport = require('passport')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('../../config')
const _ = require('lodash')
const sql = require('../../common/postgre').connect
//const { generateRandomString, getCurrentDateTime } = require('../../common/util')

// 로그인 API (인증 성공 시 토큰 발행)
exports.login = async (req, res, next) => {

    const { id, password } = req.body;

    try {

        passport.authenticate('local', (err, user, info) => {
            if (err || !user) return res.json({ response: 'error', data: { msg: '회원정보를 찾을 수 없습니다.' }})
            // access token은 프론트로 전달 (저장X) 유효기간 1시간
            const accessToken = jwt.sign({ member_id: user.member_id, member_name: user.member_name }, config.jwtSecretKey)
            return res.json({ response: 'ok', data: { token: accessToken, name: user.member_name } })
        })(req, res, next)

    } catch (error) {
        console.error(error);
        next(error);
    }
}


// 회원가입
exports.signup = async (req, res, next) => {

    const { id, pw, name, email, phone, address } = req.body;

    console.log(id, pw, email, phone, address)

    //중복가입 체크
    const selectQuery = `SELECT member_id,member_phone,member_email,is_deleted FROM cashflow.cf_member WHERE (member_id=$1 OR member_phone=$2 OR member_email=$3) ORDER BY created DESC LIMIT 1`
    const existMember = await sql.query(selectQuery, [id, phone, email])
    if(existMember.rowCount > 0){
        if (existMember.rows[0].member_id === id) return res.json({ response: 'error', data: { msg: "이미 사용된 아이디입니다." } })
        if (!existMember.rows[0].is_deleted && existMember.rows[0].member_phone === phone) return res.json({ response: 'error', data: { msg: "이미 가입된 휴대폰번호입니다." } })
        if (!existMember.rows[0].is_deleted && existMember.rows[0].member_email === email) return res.json({ response: 'error', data: { msg: "이미 가입된 이메일입니다." } })
    }

    const salt = bcrypt.genSaltSync(10)
    const hashedPW = bcrypt.hashSync(pw, salt)

    const InsertQuery = `INSERT INTO cashflow.cf_member (member_id,member_password,member_name,member_phone, member_address, member_email, updated, created)
                                                VALUES ($1::TEXT,$2::TEXT,$3::TEXT,$4::TEXT,$5::TEXT,$6::TEXT,NOW(),NOW()) RETURNING member_index, member_id, member_name`
    const user = await sql.query(InsertQuery, [id, hashedPW, name, phone, address, email])

    const cost_name = ["재료비", "노무비", "외주비", "경비"]

    const InsertSettingQuery = `INSERT INTO cashflow.cf_setting (member_index, cost_name, updated, created)
                                                VALUES ($1::INT, $2::TEXT[], NOW(), NOW()) `
    await sql.query(InsertSettingQuery, [user.rows[0].member_index, cost_name])

    const accessToken = jwt.sign({ member_id: user.rows[0].member_id, member_name: user.rows[0].member_name }, config.jwtSecretKey)
    return res.json({ response: 'ok', data: { token: accessToken, name: user.rows[0].member_name } })
}

// 회원정보수정시 회원정보요청
exports.userInfo = async (req, res, next) => {

    const user = req.user
    if(!user.member_index) return res.json({ response: 'error', data: { msg: "잘못된 요청입니다." } })

    return res.json({ response: 'ok', data: { user: user } })
}

// 회원정보 수정
exports.userModify = async (req, res, next) => {

    const { idx, id, pw, name, email, phone, address } = req.body;
    console.log(idx, id, pw, email, phone, address)

    const user = req.user
    if(!idx || !user.member_index || user.member_index != idx) return res.json({ response: 'error', data: { msg: "잘못된 요청입니다." } })

    let sqlPassword = ""
    if(pw){
        const salt = bcrypt.genSaltSync(10)
        const hashedPW = bcrypt.hashSync(pw, salt)
        sqlPassword = `member_password = '${hashedPW}', `
    }
    const UpdateQuery = `UPDATE cashflow.cf_member SET
                                        ${sqlPassword}
                                        member_name = $1,
                                        member_phone = $2,
                                        member_address = $3,
                                        member_email = $4,
                                        updated = NOW()
                       WHERE member_index = $5`
    await sql.query(UpdateQuery, [name, phone, address, email, idx])
    
    return res.json({ response: 'ok', data: { msg:"수정이 완료되었습니다." } })
}

// 구독신청
exports.applySubscribe = async (req, res, next) => {
    const user = req.user
    if(!user.member_index) return res.json({ response: 'error', data: { msg: "잘못된 요청입니다." } })
    const InsertQuery = `INSERT INTO cashflow.cf_subscribe (member_index, status, updated, created)
                                                VALUES ($1,'apply',NOW(),NOW())`
    await sql.query(InsertQuery, [user.member_index])
    return res.json({ response: 'ok', data: { msg: "구독신청이 정상적으로 처리되었습니다." } })
}

// 구독여부, 또는 신청 여부 가져오기
exports.checkSubscribe = async (req, res, next) => {

    const user = req.user
    if(!user.member_index) return res.json({ response: 'error', data: { msg: "잘못된 요청입니다." } })

    //구독신청 여부 가져올 것. 가장 최신거 하나 가져옴.
    const selectQuery = `SELECT * FROM cashflow.cf_subscribe WHERE member_index=$1 ORDER BY created DESC LIMIT 1`
    const existSubscirbe = await sql.query(selectQuery, [user.member_index])

    let status = "none" // none,apply,confirm
    if(existSubscirbe.rowCount > 0) status = existSubscirbe.rows[0].status

    return res.json({ response: 'ok', data: { user: user, status: status } })
}


// 개인설정 가져오기
exports.getSetting = async (req, res, next) => {

    const user = req.user
    if(!user.member_index) return res.json({ response: 'error', data: { msg: "잘못된 요청입니다." } })

    //구독신청 여부 가져올 것. 가장 최신거 하나 가져옴.
    const selectQuery = `SELECT * FROM cashflow.cf_setting WHERE member_index=$1 ORDER BY created DESC LIMIT 1`
    const mySetting = await sql.query(selectQuery, [user.member_index])

    return res.json({ response: 'ok', data: { mySetting: mySetting.rows[0] } })
}

// 개인설정 가져오기
exports.putSetting = async (req, res, next) => {

    const user = req.user
    if(!user.member_index) return res.json({ response: 'error', data: { msg: "잘못된 요청입니다." } })

    const { money_sort, unit, cost_name } = req.body;

    const updateData = [
        money_sort,
        unit,
        cost_name,
        user.member_index
    ]
    const UpdateQuery = `UPDATE cashflow.cf_setting SET
                                        money_sort = $1,
                                        unit = $2,
                                        cost_name = $3::TEXT[],
                                        updated = NOW() where member_index = $4
    `
    await sql.query(UpdateQuery, updateData).then(() => {
        return res.json({ response: 'ok', data: {} })
    })
}

