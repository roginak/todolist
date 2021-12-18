const _ = require('lodash')
const sql = require('../../common/postgre').connect
const htmlspecialchars = require('htmlspecialchars')
const bcrypt = require('bcryptjs')

/***********************************************************************************/
/***********************************************************************************/
/***********************************************************************************/
/************************************ 회원관리 ***************************************/
/***********************************************************************************/
/***********************************************************************************/
/***********************************************************************************/


// 회원 리스트 가져오기
exports.memberList = async (req, res, next) => {

    console.log("memberList")
    let { page, limit, is_subscribe } = req.query
    const search = htmlspecialchars(String(req.query.search).trim())
    const user = req.user
    if(!user.member_index || !user.is_admin) return res.json({ response: 'error', data: { msg: "잘못된 요청입니다." } })

    let searchQuery = ''

    if (!page) page = 1
    if (!limit) limit = 20

    if (search) searchQuery += ` AND (M.member_name LIKE '%${search}%' or M.member_phone LIKE '%${search}%' or M.member_address LIKE '%${search}%' or M.member_email LIKE '%${search}%') `
    if( is_subscribe != "전체" ){
        if(is_subscribe === "구독") searchQuery += ` AND M.is_subscribe = TRUE `
        if(is_subscribe === "비구독") searchQuery += ` AND M.is_subscribe = FALSE `
    }

    const selectCount = (page-1)*limit
    const selectQuery = `SELECT (ROW_NUMBER() OVER(ORDER BY M.member_index ASC)) AS number, 
                                *, 
                                to_char(M.created,'YYYY-MM-DD') as reg_date,
                                (SELECT count(*) as cnt from cashflow.cf_project where member_index = M.member_index AND is_deleted = FALSE ) as project_count
                         FROM cashflow.cf_member M
                         WHERE M.is_deleted = FALSE AND M.member_id != 'admin' ${searchQuery} 
                         ORDER BY M.member_index DESC LIMIT ${limit} OFFSET ${selectCount}`
    await sql.query(selectQuery)
                .then( async r => {
                    const total = await sql.query(`SELECT COUNT(M.member_index) AS count FROM cashflow.cf_member M WHERE M.is_deleted = FALSE AND M.member_id != 'admin' ${searchQuery} `)
                    return res.json({ response : 'ok', data: { rows : r.rows, total : total.rows[0].count } })
                })
}


//회원삭제
exports.deleteMember = async (req, res, next) => {

    console.log("deleteMember")
    const member_index = req.params.member_index
    const user = req.user
    if(!user.member_index || !user.is_admin || !member_index) return res.json({ response: 'error', data: { msg: "잘못된 요청입니다." } })

    //해당 회원의 프로젝트, 구독신청, 환경설정 등 모두 삭제처리한다.
    await sql.query(`UPDATE cashflow.cf_project SET is_deleted = TRUE WHERE member_index = ${member_index} `)
    await sql.query(`DELETE from cashflow.cf_subscribe WHERE member_index = ${member_index} `)


    const UpdateQuery = `UPDATE cashflow.cf_member SET
                                is_deleted = TRUE,
                                updated = NOW()
                         WHERE member_index = ${member_index}`
    await sql.query(UpdateQuery)
                    .then( async r => {
                        return res.json({ response : 'ok', data: { msg:"회원삭제가 완료되었습니다." } })
                    })
}

//비밀번호 변경
exports.setMemberPass = async (req, res, next) => {

    console.log("setMemberPass")
    const member_index = req.params.member_index
    const { password } = req.body
    const user = req.user
    if(!user.member_index || !user.is_admin || !member_index || !password) return res.json({ response: 'error', data: { msg: "잘못된 요청입니다." } })
    
    const salt = bcrypt.genSaltSync(10)
    const hashedPW = bcrypt.hashSync(password, salt)

    const UpdateQuery = `UPDATE cashflow.cf_member SET
                                    member_password = '${hashedPW}',
                                    updated = NOW()
                         WHERE member_index = ${member_index}`
    await sql.query(UpdateQuery)
                    .then( async r => {
                        return res.json({ response : 'ok', data: { msg:"비밀번호가 정상적으로 수정되었습니다." } })
                    })
}

/***********************************************************************************/
/***********************************************************************************/
/***********************************************************************************/
/************************************ 구독관리 ***************************************/
/***********************************************************************************/
/***********************************************************************************/
/***********************************************************************************/

// 구독신청 리스트 가져오기
exports.getSubscribe = async (req, res, next) => {

    console.log("getSubscribe")
    let { page, limit, status } = req.query
    const search = htmlspecialchars(String(req.query.search).trim())
    const user = req.user
    if(!user.member_index || !user.is_admin) return res.json({ response: 'error', data: { msg: "잘못된 요청입니다." } })

    let searchQuery = ''
    let statusQuery = ''

    if (!page) page = 1
    if (!limit) limit = 20

    if (search) searchQuery += ` AND M.member_name LIKE '%${search}%' `
    if( status != "전체" ){
        if(status === "신청") statusQuery += ` WHERE S.status = 'apply' `
        if(status === "처리완료") statusQuery += ` WHERE S.status = 'confirm' `
    }

    const selectCount = (page-1)*limit
    const selectQuery = `SELECT (ROW_NUMBER() OVER(ORDER BY S.subscribe_index ASC)) AS number, 
                                S.*,
                                M.member_name, M.member_id, M.is_subscribe,
                                to_char(S.created,'YYYY-MM-DD HH24:MI:SS') as reg_date,
                                (SELECT count(*) as cnt from cashflow.cf_project where member_index = M.member_index AND is_deleted = FALSE ) as project_count
                         FROM cashflow.cf_subscribe S
                         JOIN cashflow.cf_member M ON M.member_index = S.member_index ${searchQuery} 
                         ${statusQuery} 
                         ORDER BY S.subscribe_index DESC LIMIT ${limit} OFFSET ${selectCount}`
    await sql.query(selectQuery)
                .then( async r => {
                    const total = await sql.query(`SELECT COUNT(S.subscribe_index) AS count FROM cashflow.cf_subscribe S JOIN cashflow.cf_member M ON M.member_index = S.member_index ${searchQuery} ${statusQuery} `)
                    return res.json({ response : 'ok', data: { rows : r.rows, total : total.rows[0].count } })
                })
}

// 구독 확인
exports.setSubscribeConfirm = async (req, res, next) => {

    console.log("setSubscribeConfirm")
    const subscribe_index = req.params.subscribe_index
    const user = req.user
    if(!user.member_index || !user.is_admin || !subscribe_index) return res.json({ response: 'error', data: { msg: "잘못된 요청입니다." } })

    const UpdateQuery = `UPDATE cashflow.cf_subscribe SET
                                status = 'confirm', 
                                updated = NOW()
                         WHERE subscribe_index = ${subscribe_index}`
    await sql.query(UpdateQuery)
                    .then( async r => {
                        return res.json({ response : 'ok', data: { msg:"확인처리가 되었습니다." } })
                    })
}


//구독신청 삭제처리
exports.deleteSubscribe = async (req, res, next) => {

    console.log("deleteSubscribe")
    const subscribe_index = req.params.subscribe_index
    const user = req.user
    if(!user.member_index || !user.is_admin || !subscribe_index) return res.json({ response: 'error', data: { msg: "잘못된 요청입니다." } })

    await sql.query(`DELETE from cashflow.cf_subscribe WHERE subscribe_index = ${subscribe_index} `)

    return res.json({ response : 'ok', data: { msg:"구독삭제가 완료되었습니다." } })
}

// 구독 셋팅
exports.setSubscribe = async (req, res, next) => {

    console.log("setSubscribe")
    const member_index = req.params.member_index
    const user = req.user
    if(!user.member_index || !user.is_admin || !member_index) return res.json({ response: 'error', data: { msg: "잘못된 요청입니다." } })


    const UpdateQuery = `UPDATE cashflow.cf_member SET
                                is_subscribe = (CASE WHEN is_subscribe = TRUE THEN FALSE ELSE TRUE END), 
                                updated = NOW()
                         WHERE member_index = ${member_index} RETURNING is_subscribe`
    await sql.query(UpdateQuery)
                    .then( async r => {
                        let msg = "구독취소가 완료되었습니다."
                        if(r.rows[0].is_subscribe) msg = "구독설정이 완료되었습니다."
                        return res.json({ response : 'ok', data: { msg:msg, is_subscribe : r.rows[0].is_subscribe } })
                    })
}

/***********************************************************************************/
/***********************************************************************************/
/***********************************************************************************/
/********************************** 프로젝트 관리 **************************************/
/***********************************************************************************/
/***********************************************************************************/
/***********************************************************************************/

// 프로젝트 리스트 가져오기
exports.projectList = async (req, res, next) => {

    console.log("projectList")
    let { page, limit, type, searchBy } = req.query
    const search = htmlspecialchars(String(req.query.search).trim())
    const user = req.user
    if(!user.member_index || !user.is_admin) return res.json({ response: 'error', data: { msg: "잘못된 요청입니다." } })

    let searchQuery = ''
    let searchMemberQuery = ''

    if (!page) page = 1
    if (!limit) limit = 20

    if (search){
        if(searchBy === "프로젝트명") searchQuery += ` AND P.project_name LIKE '%${search}%' `
        if(searchBy === "회원번호") searchMemberQuery += ` AND M.member_index = ${search} `
    }

    if( type != "전체" ){
        searchQuery += ` AND P.type = '${type}' `
    }

    const selectCount = (page-1)*limit
    const selectQuery = `SELECT (ROW_NUMBER() OVER(ORDER BY P.project_index ASC)) AS number, 
                                P.*,
                                M.member_name, M.member_id, M.is_subscribe,
                                to_char(P.updated,'YYYY-MM-DD HH24:MI:SS') as project_date 
                         FROM cashflow.cf_project P
                         JOIN cashflow.cf_member M ON M.member_index = P.member_index ${searchMemberQuery} 
                         WHERE P.is_deleted = FALSE ${searchQuery} 
                         ORDER BY P.project_index DESC LIMIT ${limit} OFFSET ${selectCount}`
    await sql.query(selectQuery)
                .then( async r => {
                    const total = await sql.query(`SELECT COUNT(P.project_index) AS count FROM cashflow.cf_project P JOIN cashflow.cf_member M ON M.member_index = P.member_index ${searchMemberQuery} WHERE P.is_deleted = FALSE ${searchQuery}  `)
                    return res.json({ response : 'ok', data: { rows : r.rows, total : total.rows[0].count } })
                })
}






