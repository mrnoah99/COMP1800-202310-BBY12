document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search');
    const searchBtn = document.getElementById('searchBtn');

    // 검색 실행 함수
    function performSearch() {
        const searchTerm = searchInput.value;
        console.log('Searching for:', searchTerm);
        // 여기에 검색 기능 구현
    }

    // Enter 키를 누를 때 검색 실행
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    // 검색 버튼을 누를 때 검색 실행
    searchBtn.addEventListener('click', performSearch);
});


document.addEventListener('DOMContentLoaded', function() {
    const filterButton = document.querySelector('.filter');
    const filterMenuContainer = document.querySelector('.filter-menu-container');

    filterButton.addEventListener('click', function() {
        filterMenuContainer.style.display = filterMenuContainer.style.display === 'block' ? 'none' : 'block';
    });

    window.addEventListener('click', function(event) {
        if (!event.target.matches('.filter')) {
            filterMenuContainer.style.display = 'none';
        }
    });
});


app.get('/popular-games', (req, res) => {
    const games = [
      { name: 'Minecraft', genres: 'Open world, Action game, Sandbox', image: 'https://upload.wikimedia.org/wikipedia/en/5/51/Minecraft_cover.png', url: 'purchase-page-url' },
      { name: 'Grand Theft Auto V', genres: 'Action-adventure game, Racing video game', image: 'https://upload.wikimedia.org/wikipedia/en/a/a5/Grand_Theft_Auto_V.png', url: 'purchase-page-url' },
      { name: 'Fortnite', genres: 'Genres (Video game): Survival, battle royale, sandbox', image: 'https://imgix.ranker.com/user_node_img/3837/76737071/original/76737071-photo-u8?auto=format&q=60&fit=fill&fm=pjpg&dpr=2&crop=faces&bg=fff&h=300&w=300', url: 'purchase-page-url' },
      { name: 'Super Smash Bros. Ultimate', genres: 'Genres (Video game): Fighting', image: 'https://imgix.ranker.com/user_node_img/4269/85375035/original/super-smash-bros-ultimate-photo-u2?auto=format&q=60&fit=fill&fm=pjpg&dpr=2&crop=faces&bg=fff&h=300&w=300', url: 'purchase-page-url' },
      { name: 'Red Dead Redemption II', genres: 'Genres (Video game): Action-adventure', image: 'https://upload.wikimedia.org/wikipedia/en/4/44/Red_Dead_Redemption_II.jpg', url: 'purchase-page-url' },
      { name: 'Among Us', genres: 'Genres (Video game): Party video game, survival video game', image: 'https://imgix.ranker.com/user_node_img/4270/85381195/original/among-us-u1?auto=format&q=60&fit=fill&fm=pjpg&dpr=2&crop=faces&bg=fff&h=300&w=300', url: 'purchase-page-url' },
    ];
  
    res.render('popular-games', { games });
  });
  

window.addEventListener('DOMContentLoaded', (event) => {
    fetch('/api/games/popular') // 이 URL은 실제 서버의 엔드포인트에 따라 변경해야 합니다.
        .then(response => response.json())
        .then(games => {
            const container = document.querySelector('.container');

            games.forEach((game, index) => {
                const box = document.createElement('div');
                box.classList.add('box');

                const rank = document.createElement('div');
                rank.classList.add('rank');
                rank.innerText = index + 1;
                box.appendChild(rank);

                const img = document.createElement('img');
                img.src = game.image;
                img.alt = `Game ${index + 1}`;
                box.appendChild(img);

                const gameDetails = document.createElement('div');
                gameDetails.classList.add('game-details');

                const h2 = document.createElement('h2');
                h2.innerText = game.name;
                gameDetails.appendChild(h2);

                const p = document.createElement('p');
                p.innerText = `Genres (Video game): ${game.genres}`;
                gameDetails.appendChild(p);

                const button = document.createElement('button');
                button.onclick = () => { window.location.href = game.url; };
                button.innerText = 'Show Details';
                gameDetails.appendChild(button);

                box.appendChild(gameDetails);
                container.appendChild(box);
            });
        });
});
