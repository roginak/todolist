exports.generateRandomString = (num) => {
    const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result1= '';
    const charactersLength = characters.length;
    for ( let i = 0; i < num; i++ ) {
        result1 += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result1;
}

exports.krTime = (receiveDate) => {
    // utc 시간 계산
    const utc = receiveDate.getTime() + (receiveDate.getTimezoneOffset() * 60 * 1000)

    // UTC to KST
    const KR_TIME_DIFF = 9 * 60 * 60 * 1000;
    const krTime = new Date(utc + (KR_TIME_DIFF))

    return krTime;
}

exports.getCurrentDateTime = () => {
    return currnet_time = new Date().toISOString().split(".")[0].split("T").join(" ")
}

exports.getDateTime = () => {
    let today = new Date();

    let year = today.getFullYear();
    let month = ('0' + (today.getMonth() + 1)).slice(-2);
    let day = ('0' + today.getDate()).slice(-2);

    let hours = ('0' + today.getHours()).slice(-2); 
    let minutes = ('0' + today.getMinutes()).slice(-2);
    let seconds = ('0' + today.getSeconds()).slice(-2); 

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}