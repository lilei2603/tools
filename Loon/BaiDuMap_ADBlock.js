const body = JSON.parse($response.body);
body.data.posts.content = [];
body.data.themes.content = [];
console.log(JSON.stringify(body));
$done({
    body: JSON.stringify(body)
});