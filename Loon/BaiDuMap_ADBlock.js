const body = JSON.parse($response.body);
body.data.posts.content = [];
body.data.themes.content = [];
$done({
    body: JSON.stringify(body)
});