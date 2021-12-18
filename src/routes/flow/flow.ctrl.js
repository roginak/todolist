const _ = require('lodash')
const sql = require('../../common/postgre').connect
const htmlspecialchars = require('htmlspecialchars')

//플로우 초기 데이터(단위/항목리스트) 가져오기
exports.getDefaultData = async (req, res, next) => {

    const user = req.user
    if(!user.member_index) return res.json({ response: 'error', data: { msg: "잘못된 요청입니다." } })

    const selectQuery = `SELECT *
                         FROM cashflow.cf_setting 
                         WHERE member_index = '${user.member_index}'`
    await sql.query(selectQuery)
                .then( async r => {
                    return res.json({ response : 'ok', data: { data : r.rows[0] } })
                })
}



// 플로우 데이터 저장하기
exports.flowData = async (req, res, next) => {

    console.log("flowData")

    const myhData = req.body
    const user = req.user

    //moving은 신규 작성이 불가함.
    if(myhData.project_index === 0 && myhData.type === "moving") return res.json({ response: 'error', data: { msg: "잘못된 요청입니다." } })
    
    //구독회원이 아닌데 moving관련 작업하는 경우
    if(!user.is_subscribe && myhData.type === "moving") return res.json({ response: 'error', data: { msg: "구독회원만 moving기능 사용이 가능합니다." } })

    //현재 회원이 구독중이 아닐 경우 1개이상의 프로젝트를 저장할 수 없음.
    if(!user.is_subscribe){
        const existMemberProject = await sql.query(`SELECT * from cashflow.cf_project WHERE member_index = ${user.member_index} AND is_deleted = FALSE`)
        if(existMemberProject.rowCount === 1){
            if(existMemberProject.rows[0].project_index != myhData.project_index) return res.json({ response: 'ok', data: { project_index: 0, save_ok: false } })
        }else{
            if(existMemberProject.rowCount > 0)  return res.json({ response: 'ok', data: { project_index: 0, save_ok: false } })
        }
    }

    if (myhData.project_index === 0) {
        const insertData = [
            user.member_index,
            myhData.type,
            myhData.project_name,
            myhData.project_startdate,
            myhData.project_enddate,
            myhData.price,
            myhData.running_budget,
            myhData.advance_payment,
            myhData.inhouse_interest_rate,
            myhData.progress_payment_time_lag,
            myhData.money_sort,
            myhData.unit,
            myhData.cost_name,
            myhData.cost_time_lag,
            myhData.cost_percent,
            myhData.progress,
            myhData.cost,
            myhData.progress_moving,
            myhData.cost_moving
        ]
        const InsertQuery = `INSERT INTO cashflow.cf_project (
                                                            member_index,
                                                            type,
                                                            project_name,
                                                            project_startdate,
                                                            project_enddate,
                                                            price,
                                                            running_budget,
                                                            advance_payment, 
                                                            inhouse_interest_rate, 
                                                            progress_payment_time_lag,
                                                            money_sort,
                                                            unit,
                                                            cost_name,
                                                            cost_time_lag,
                                                            cost_percent,
                                                            progress, 
                                                            cost, 
                                                            progress_moving, 
                                                            cost_moving, 
                                                            updated, 
                                                            created
                                                            )
                                                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::TEXT[],$14::INT[],$15::FLOAT[],$16::FLOAT[],$17::FLOAT[],$18::FLOAT[],$19::FLOAT[],NOW(),NOW()) RETURNING project_index`
        const flowData = await sql.query(InsertQuery, insertData)
        return res.json({ response: 'ok', data: { project_index: flowData.rows[0].project_index, save_ok: true } })
    } else {
        const updateData = [
            myhData.project_name,
            myhData.project_startdate,
            myhData.project_enddate,
            myhData.price,
            myhData.running_budget,
            myhData.advance_payment,
            myhData.inhouse_interest_rate,
            myhData.progress_payment_time_lag,
            myhData.money_sort,
            myhData.unit,
            myhData.cost_name,
            myhData.cost_time_lag,
            myhData.cost_percent,
            myhData.progress,
            myhData.cost,
            myhData.progress_moving,
            myhData.cost_moving,
            myhData.progress_moving_checked,
            myhData.cost_moving_checked,
            myhData.project_index
        ]
        const UpdateQuery = `UPDATE cashflow.cf_project SET
                                            project_name = $1,
                                            project_startdate = $2,
                                            project_enddate = $3,
                                            price = $4,
                                            running_budget = $5,
                                            advance_payment = $6,
                                            inhouse_interest_rate = $7,
                                            progress_payment_time_lag = $8,
                                            money_sort = $9,
                                            unit = $10,
                                            cost_name = $11::TEXT[],
                                            cost_time_lag = $12::INT[],
                                            cost_percent = $13::FLOAT[],
                                            progress = $14::FLOAT[],
                                            cost = $15::FLOAT[],
                                            progress_moving = $16::FLOAT[],
                                            cost_moving = $17::FLOAT[],
                                            progress_moving_checked = $18::TEXT[],
                                            cost_moving_checked = $19::TEXT[],
                                            updated = NOW() where project_index = $20
        `
        await sql.query(UpdateQuery, updateData).then(() => {
            return res.json({ response: 'ok', data: { project_index: myhData.project_index, save_ok: true } })
        })
    }

}


// 플로우 리스트 가져오기
exports.flowList = async (req, res, next) => {

    console.log("flowList")
    let { type, page, limit } = req.query
    const search = htmlspecialchars(String(req.query.search).trim())
    const user = req.user
    if(!user.member_index || !type) return res.json({ response: 'error', data: { msg: "잘못된 요청입니다." } })

    let searchQuery = ''

    if (!page) page = 1
    if (!limit) limit = 20

    if (search) searchQuery += ` AND project_name LIKE '%${search}%' `

    const selectCount = (page-1)*limit
    const selectQuery = `SELECT (ROW_NUMBER() OVER(ORDER BY project_index ASC)) AS number, *, 
                                to_char(updated,'YYYY-MM-DD HH24:MI:SS') as project_date 
                         FROM cashflow.cf_project 
                         WHERE type = '${type}' AND member_index = '${user.member_index}' AND is_deleted = FALSE ${searchQuery} 
                         ORDER BY project_index DESC LIMIT ${limit} OFFSET ${selectCount}`
    await sql.query(selectQuery)
                .then( async r => {
                    const total = await sql.query(`SELECT COUNT(project_index) AS count FROM cashflow.cf_project WHERE type = '${type}' AND member_index = '${user.member_index}' AND is_deleted = FALSE ${searchQuery}`)
                    return res.json({ response : 'ok', data: { rows : r.rows, total : total.rows[0].count } })
                })
}


// 플로우 데이터 가져오기
exports.flowDetail = async (req, res, next) => {

    console.log("flowDetail")
    const project_index = req.params.idx
    const user = req.user
    if(!user.member_index || !project_index) return res.json({ response: 'error', data: { msg: "잘못된 요청입니다." } })

    const selectQuery = `SELECT *
                         FROM cashflow.cf_project 
                         WHERE project_index = '${project_index}'`
    await sql.query(selectQuery)
                .then( async r => {
                    //관리자는 전부 다 볼 수 있음.
                    if(!user.is_admin && (r.rows[0].member_index != user.member_index || r.rows[0].is_deleted)) return res.json({ response: 'error', data: { msg: "잘못된 요청입니다." } })

                    let enabled = true
                    if(r.rows[0].type === "moving" && !user.is_subscribe) enabled = false

                    return res.json({ response : 'ok', data: { data : r.rows[0], enabled: enabled } })
                })
}

// 플로우 삭제
exports.flowDelete = async (req, res, next) => {

    console.log("flowDelete")
    const project_index = req.params.idx
    const user = req.user
    if(!user.member_index || !project_index) return res.json({ response: 'error', data: { msg: "잘못된 요청입니다." } })

    const selectQuery = `SELECT *
                         FROM cashflow.cf_project 
                         WHERE project_index = '${project_index}'`
    await sql.query(selectQuery)
                .then( async r => {
                    //관리자는 전부 삭제 가능.
                    if(!user.is_admin && (r.rows[0].member_index != user.member_index || r.rows[0].is_deleted)) return res.json({ response: 'error', data: { msg: "잘못된 요청입니다." } })
                    await sql.query(`UPDATE cashflow.cf_project set is_deleted = TRUE WHERE project_index = '${project_index}'`)
                    return res.json({ response : 'ok', data: { msg:"삭제가 완료되었습니다." } })
                })
}




// fixed -> moving 복사
exports.copyToMoving = async (req, res, next) => {

    console.log("copyToMoving")
    const project_index = req.params.idx
    const user = req.user
    if(!user.member_index || !project_index) return res.json({ response: 'error', data: { msg: "잘못된 요청입니다." } })

    if(!user.is_subscribe) return res.json({ response: 'error', data: { msg: "구독회원이 되셔야 moving기능을 이용하실 수 있습니다. 사용을 원하시면 구독신청해주세요." } })

    const selectQuery = `SELECT *
                         FROM cashflow.cf_project 
                         WHERE project_index = '${project_index}'`
    const flowData = await sql.query(selectQuery)
    const flowDataValue = flowData.rows[0]

    const insertData = [
        flowDataValue.member_index,
        "moving",
        flowDataValue.project_name,
        flowDataValue.project_startdate,
        flowDataValue.project_enddate,
        flowDataValue.price,
        flowDataValue.running_budget,
        flowDataValue.advance_payment,
        flowDataValue.inhouse_interest_rate,
        flowDataValue.progress_payment_time_lag,
        flowDataValue.money_sort,
        flowDataValue.unit,
        flowDataValue.cost_name,
        flowDataValue.cost_time_lag,
        flowDataValue.cost_percent,
        flowDataValue.progress,
        flowDataValue.cost,
        flowDataValue.progress,
        flowDataValue.cost,
        [],[]
    ]
    const InsertQuery = `INSERT INTO cashflow.cf_project (
                                                        member_index,
                                                        type,
                                                        project_name,
                                                        project_startdate,
                                                        project_enddate,
                                                        price,
                                                        running_budget,
                                                        advance_payment, 
                                                        inhouse_interest_rate, 
                                                        progress_payment_time_lag,
                                                        money_sort,
                                                        unit,
                                                        cost_name,
                                                        cost_time_lag,
                                                        cost_percent,
                                                        progress, 
                                                        cost, 
                                                        progress_moving, 
                                                        cost_moving, 
                                                        progress_moving_checked,
                                                        cost_moving_checked,
                                                        updated, 
                                                        created
                                                        )
                                                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::TEXT[],$14::INT[],$15::FLOAT[],$16::FLOAT[],$17::FLOAT[],$18::FLOAT[],$19::FLOAT[],$20::TEXT[],$21::TEXT[],NOW(),NOW()) RETURNING project_index`
    const newflowData = await sql.query(InsertQuery, insertData)
    return res.json({ response: 'ok', data: { msg:"정상적으로 복사가 되었습니다.", project_index: newflowData.rows[0].project_index, save_ok: true } })

                
}

