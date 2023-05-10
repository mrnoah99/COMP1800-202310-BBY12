const express = require('express');
const app = express();

app.set('view engine', 'ejs');
app.use('/public', express.static('public'));  // 정적 파일 미들웨어 추가

app.get('/', (req, res) => {
    res.render('index', {imageUrl1: '/public/img/reco1.png', imageUrl2: '/public/img/reco2.png'});
});

app.listen(3000, () => console.log('Server is running on port 3000'));
