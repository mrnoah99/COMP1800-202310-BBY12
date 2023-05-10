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

app.get('/popular', function (req, res) {
    let games = [
        { name: 'Minecraft', genres: 'Open world, Action game, Sandbox', image: '/public/img/minecraft.png', url: 'purchase-page-url' },
        { name: 'Grand Theft Auto V', genres: 'Action-adventure game, Racing video game', image: '/public/img/gta.png', url: 'purchase-page-url' },
        { name: 'Fortnite', genres: 'Genres (Video game): Survival, battle royale, sandbox', image: '/public/img/fortnite.jpg', url: 'purchase-page-url' },
        { name: 'Super Smash Bros. Ultimate', genres: 'Genres (Video game): Fighting', image: '/public/img/super.jpg', url: 'purchase-page-url' },
        { name: 'Red Dead Redemption II', genres: 'Genres (Video game): Action-adventure', image: '/public/img/reddead.jpg', url: 'purchase-page-url' },
        { name: 'Among Us', genres: 'Genres (Video game): Party video game, survival video game', image: '/public/img/amongus.jpg', url: 'purchase-page-url' }
    ];
    res.render('popular', { games: games });
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
