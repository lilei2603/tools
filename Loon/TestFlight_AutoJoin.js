/*
 * TestFlight应用监控
 * @author: 润就完事了
 * @date: 2023-12-25 16:05:00
 */

const promiseList = []

!(async () => {
    setPromiseList()
    await Promise.allSettled(promiseList)
    $done({})
})()

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
