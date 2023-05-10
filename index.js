
const express = require('express');
const app = express();



const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

// set the view engine to ejs
app.set('view engine', 'ejs');

// public directory to serve static files
app.use('/public', express.static('public'));

// route to render game detail page
app.get('/game-detail', (req, res) => {
    res.render('game-detail', { 
        title: "Game Title",
        reviews: "Overall Reviews",
        price: "Price",
        description: "Description",
        gameImageUrl: "https://via.placeholder.com/640x400",
        relatedGameImages: [
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
            "https://via.placeholder.com/150",
        ]
    });
});

// start the server on port 8000
app.listen(8000, () => {
    console.log('Server is running on port 8000');
});

app.get('/profile.html', (req, res) => {
    res.render('profile', {
        nickname: "User Nickname",
        email: "user@email.com",
    });
});


app.get('/free.html', function(req, res) {
  var games = [
    {
      name: 'League of Legends',
      genres: 'MOBA',
      image: 'https://wallpaperaccess.com/full/2379009.jpg',
      url: 'https://example.com/minecraft'
    },
    {
      name: 'Apex Legends',
      genres: 'battle royale',
      image: 'https://mms.businesswire.com/media/20190204005535/en/703803/4/APEX_Primary_Art_72dpi_RGB_FIN.jpg',
      url: 'https://example.com/gta5'
    },
    {
      name: 'Fortnite',
      genres: 'Survival, battle royale, sandbox',
      image: 'https://imgix.ranker.com/user_node_img/3837/76737071/original/76737071-photo-u8?auto=format&q=60&fit=fill&fm=pjpg&dpr=2&crop=faces&bg=fff&h=300&w=300',
      url: 'https://example.com/minecraft'
    },
    {
      name: 'Warframe',
      genres: 'Online action',
      image: 'https://s.yimg.com/fz/api/res/1.2/TBGlJPuGrYCI.pz5Vt1JBA--~C/YXBwaWQ9c3JjaGRkO2ZpPWZpdDtoPTI2MDtxPTgwO3c9MjYw/https://s.yimg.com/zb/imgv1/30fe762d-df30-303f-aa96-d81d6621bdac/t_500x300',
      url: 'https://example.com/gta5'
    },
    {
      name: 'Genshin Impact',
      genres: 'Open-world adventure',
      image: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/a98cff5d-a612-49d8-a0db-175994384b20/de6gwbc-c62515e8-9411-41f1-a478-41972654fd0b.png/v1/fill/w_512,h_512,strp/genshin_impact_icon_by_kiramaru_kun_de6gwbc-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9NTEyIiwicGF0aCI6IlwvZlwvYTk4Y2ZmNWQtYTYxMi00OWQ4LWEwZGItMTc1OTk0Mzg0YjIwXC9kZTZnd2JjLWM2MjUxNWU4LTk0MTEtNDFmMS1hNDc4LTQxOTcyNjU0ZmQwYi5wbmciLCJ3aWR0aCI6Ijw9NTEyIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmltYWdlLm9wZXJhdGlvbnMiXX0.aAlCN4I4hmNlQLEkdBgimNt61LuwE2URyQkrREEtPCc',
      url: 'https://example.com/minecraft'
    },
    {
      name: 'Call of Duty Warzone',
      genres: 'Battle royale',
      image: 'https://tse3.mm.bing.net/th?id=OIP.NSNSp4aTWGfwM_gs5uBwDwHaHa&pid=Api&P=0',
      url: 'https://example.com/gta5'
    }
  ]; // define the games array here
  res.render('free', { games: games });
});



app.get('/gamedetail.html', (req, res) => {

    res.render('gamedetail');  // 이 부분은 실제로 존재하는 EJS 템플릿 파일 이름으로 변경해야 합니다.
});
app.get('/popular.html', (req, res) => {
    // games 변수가 어디서 오는지에 따라 이 부분은 당신의 코드에 맞게 변경되어야 합니다.
    // 이 예제에서는 단순히 빈 배열을 사용합니다.
    let games = [
        {
            name: 'Minecraft',
            genres: 'Open world, Action game, Sandbox',
            image: 'https://upload.wikimedia.org/wikipedia/en/5/51/Minecraft_cover.png',
            url: 'https://example.com/minecraft'
          },
          {
            name: 'Grand Theft Auto V',
            genres: 'Action-adventure game, Racing video game',
            image: 'https://upload.wikimedia.org/wikipedia/en/a/a5/Grand_Theft_Auto_V.png',
            url: 'https://example.com/gta5'
          },
          {
            name: 'Fortnite',
            genres: 'Survival, battle royale, sandbox',
            image: 'https://imgix.ranker.com/user_node_img/3837/76737071/original/76737071-photo-u8?auto=format&q=60&fit=fill&fm=pjpg&dpr=2&crop=faces&bg=fff&h=300&w=300',
            url: 'https://example.com/minecraft'
          },
          {
            name: 'Super Smash Bros. Ultimate',
            genres: 'Fighting',
            image: 'https://imgix.ranker.com/user_node_img/4269/85375035/original/super-smash-bros-ultimate-photo-u2?auto=format&q=60&fit=fill&fm=pjpg&dpr=2&crop=faces&bg=fff&h=300&w=300',
            url: 'https://example.com/gta5'
          },
          {
            name: 'Red Dead Redemption II',
            genres: 'Action-adventure',
            image: 'https://upload.wikimedia.org/wikipedia/en/4/44/Red_Dead_Redemption_II.jpg',
            url: 'https://example.com/minecraft'
          },
          {
            name: 'Among Us',
            genres: 'Party video game, survival video game',
            image: 'https://imgix.ranker.com/user_node_img/4270/85381195/original/among-us-u1?auto=format&q=60&fit=fill&fm=pjpg&dpr=2&crop=faces&bg=fff&h=300&w=300',
            url: 'https://example.com/gta5'
          }
    ];

    // games 변수를 EJS 템플릿으로 전달합니다.
    res.render('popular', { games: games });
});

app.get('/recommend.html', (req, res) => {
    const imageUrl1 = '/public/img/reco1.png';
    const imageUrl2 = '/public/img/reco2.png';
    res.render('recommend', { imageUrl1, imageUrl2 }); // imageUrl1과 imageUrl2를 객체로 전달
});
