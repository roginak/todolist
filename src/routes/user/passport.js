const passport = require('passport')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const LocalStrategy = require('passport-local')
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const sql = require('../../common/postgre').connect
const config = require('../../config')

// 회원 인증
// exports.localAuth = passport.authenticate('local', { session: false })

// local passport config
exports.passportVerify = async ( id, password, done ) => {
    try {
        // 아이디 검증
        let selectQuery = `SELECT * FROM cashflow.cf_member WHERE member_id=$1 and is_deleted=FALSE ORDER BY created DESC LIMIT 1`
        let user = await sql.query(selectQuery,[id])
        console.log("user", user.rows[0])
        if(user.rows.length === 0) return done(null, false)
        
        // 비밀번호 검증
        const comparePassword = await bcrypt.compare(password, user.rows[0].member_password)
        if(!comparePassword) return done(null, false)   
        return done(null, user.rows[0])     
    } catch (error) {
        console.log(error)
        return done(error)
    }
}

exports.passportLocal = passport.use('local', new LocalStrategy({ usernameField: 'id', passwordField: 'password' }, this.passportVerify))

// ====================================================================================================================
// ====================================================================================================================

// jwt 인증
exports.jwtAuth = passport.authenticate('jwt', { session: false })

// jwt passport strategy config option
const jwtOption = { jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'), secretOrKey: config.jwtSecretKey }

// jwt passport strategy config
exports.jwtConfig = async ( jwtPayload, done ) => {
    console.log("jwtPayload: ", jwtPayload)
    try {
        let selectQuery = `SELECT * FROM cashflow.cf_member WHERE member_id=$1 and is_deleted=FALSE ORDER BY created DESC LIMIT 1`
        let user = await sql.query(selectQuery,[jwtPayload.member_id])
        if(user.rows.length === 0) return done(null, false) 
        return done(null, user.rows[0])
    } catch (error) {
        console.log(error)
        return done(error)
    }
}

exports.passportJwt = passport.use('jwt', new JwtStrategy(jwtOption, this.jwtConfig))