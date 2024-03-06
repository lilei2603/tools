const requestUrl = $request.url;
const accountUrl =
  /^https:\/\/testflight\.apple\.com\/v3\/accounts\/(.*)\/apps$/;
const appUrl = /^https:\/\/testflight\.apple\.com\/join\/(.*)/;
if (accountUrl.test(requestUrl)) {
  const accountId = requestUrl.match(accountUrl)[1];
  const sessionId =
    $request.headers["X-Session-Id"] || $request.headers["x-session-id"];
  const sessionDigest =
    $request.headers["X-Session-Digest"] ||
    $request.headers["x-session-digest"];
  const requestId =
    $request.headers["X-Request-Id"] || $request.headers["x-request-id"];
  const userAgent =
    $request.headers["User-Agent"] || $request.headers["user-agent"];
  $persistentStore.write(accountId, "TF_ACCOUNT_ID");
  $persistentStore.write(sessionId, "TF_SESSION_ID");
  $persistentStore.write(sessionDigest, "TF_SESSION_DIGEST");
  $persistentStore.write(requestId, "TF_REQUEST_ID");
  $persistentStore.write(userAgent, "TF_USER_AGENT");

  $notification.post("获取TestFlight账号信息", "获取账号信息成功", "");
}
if (appUrl.test(requestUrl)) {
  const appId = requestUrl.match(appUrl)[1];
  let appList = $persistentStore.read("TF_APP_ID");
  if (appList == undefined) {
    $persistentStore.write(appId, "TF_APP_ID");
  } else {
    appList = appList.split(",");
    if (appList.includes(appId)) {
      $notification.post("获取TestFlight应用ID", "该应用ID已存在", "");
    } else {
      appList = appList.push(appId).join(",");
      $notification.post(
        "获取TestFlight应用ID",
        `${appId}已添加至监控列表`,
        `当前ID: ${appList}`,
      );
      $persistentStore.write(appList, "TF_APP_ID");
    }
  }
}
$done({});
