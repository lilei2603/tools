/*
 * TestFlight应用监控
 * @author: 润就完事了
 * @date: 2023-12-25 16:05:00
 */

const requestUrl = $request.url
const appUrl = /^https:\/\/testflight\.apple\.com\/join\/(.*)/
const promiseList = []

!(async () => {
    getAccountInfo()
    getAppId()
    setPromiseList()
    await Promise.allSettled(promiseList)
    $done({})
})()
function getAccountInfo() {
    const accountUrl = /^https:\/\/testflight\.apple\.com\/v3\/accounts\/(.*)\/apps$/
    if(accountUrl.test(requestUrl)) {
        const accountId = requestUrl.match(accountUrl)[1]
        const sessionId = $request.headers['X-Session-Id'] || $request.headers['x-session-id']
        const sessionDigest = $request.headers['X-Session-Digest'] || $request.headers['x-session-digest']
        const requestId = $request.headers['X-Request-Id'] || $request.headers['x-request-id']
        const userAgent = $request.headers['User-Agent'] || $request.headers['user-agent']
        $persistentStore.write(accountId, 'TF_ACCOUNT_ID')
        $persistentStore.write(sessionId, 'TF_SESSION_ID')
        $persistentStore.write(sessionDigest, 'TF_SESSION_DIGEST')
        $persistentStore.write(requestId, 'TF_REQUEST_ID')
        $persistentStore.write(userAgent, 'TF_USER_AGENT')

        $notification.post('获取TestFlight账号信息', '获取账号信息成功', '')
    }
}
function getAppId() {
    if(appUrl.test(requestUrl)) {
        const appId = requestUrl.match(appUrl)[1]
        let appList = $persistentStore.read('TF_APP_ID')
        if(appList == undefined) {
            $persistentStore.write(appId, 'TF_APP_ID')
        } else {
            appList = appList.split(',')
            if(appList.includes(appId)) {
                $notification.post('获取TestFlight应用ID', '该应用ID已存在', '')
            } else {
                appList = appList.push(appId).join(",")
                $notification.post("获取TestFlight应用ID", `${appId}已添加至监控列表`, `当前ID: ${appList}`);
                $persistentStore.write(appList.toString(),'TF_APP_ID')
            }
        }
    }
}
function setPromiseList() {
    let appList = $persistentStore.read('TF_APP_ID')
    if(!appList) {
        $notification.post('TestFlight已全部加入', '请禁用该插件', '')
        return
    }else{
        appList = appList.split(',')
        for(let id of appList) {
            promiseList.push(autoJoinTask(id))
        }
    }
}
function autoJoinTask(id) {
    const accountId = $persistentStore.read('TF_ACCOUNT_ID')
    const url = `https://testflight.apple.com/v3/accounts/${accountId}/ru/`
    const headers = {
        'X-Session-Id': $persistentStore.read('TF_SESSION_ID'),
        'X-Session-Digest': $persistentStore.read('TF_SESSION_DIGEST'),
        'X-Request-Id': $persistentStore.read('TF_REQUEST_ID'),
        'User-Agent': $persistentStore.read('TF_USER_AGENT')
    }
    return new Promise((resolve, reject) => {
        $httpClient.get({url: url + id, headers}, (error, res, data) => {
            if (error === null) {
                if(res.status === 401) {
                    console.log('账号信息失效，请重新获取')
                    $notification.post('TestFlight', '账号信息失效，请重新获取', '')
                    reject('账号信息失效');
                } else if(res.status === 404) {
                    let applist = $persistentStore.read('TF_APP_ID').split(',')
                    applist = applist.filter(appId => appId !== id)
                    $persistentStore.write(applist.toString(),'TF_APP_ID')
                    console.log(id + '->' + '不存在该APP的TestFlight，已自动删除该APP_ID')
                    $notification.post(id, '不存在该APP的TestFlight', '已自动删除该APP_ID')
                    reject(`不存在${id}的TestFlight`);
                } else {
                    const jsonData = JSON.parse(data)
                    if (jsonData.data.status == 'FULL') {
                        console.log(jsonData.data.app.name + ' ' + id + ' '+ jsonData.data.message)
                        resolve('FULL');
                    } else {
                        $httpClient.post({url: url + id + '/accept', headers}, function(error, res, body) {
                        const jsonBody = JSON.parse(body)
                        $notification.post(jsonBody.data.name, 'TestFlight加入成功', '')
                        console.log(jsonBody.data.name + ' TestFlight加入成功')
                        let appList = $persistentStore.read('TF_APP_ID').split(',')
                        appList = appList.filter(appId => appId !== id)
                        $persistentStore.write(appList.toString(),'TF_APP_ID')
                        resolve('OK')
                        });
                    }
                }
            } else {
                console.log(id + '->' + error)
                reject('ERROR')
            }
        })
    })
}
