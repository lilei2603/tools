/*
脚本作者：LEI
脚本日期：2023-11-21 10:25:00
引用地址：
*/
const headers = $request.headers;

const cookie = $persistentStore.read("CF_Cookie");
console.log("cookie: ", cookie);
headers['Cookie'] = cookie;
$done({ 'headers': headers });