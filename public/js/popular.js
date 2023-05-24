window.onload = async function() {
  const response = await fetch('/popular'); // 서버의 "/popular" 엔드포인트로 GET 요청을 보냅니다.
  const games = await response.json(); // 서버에서 받은 JSON 데이터를 파싱합니다.
  const gameList = document.getElementById('game-list');

  for (let game of games) {
    const gameElement = document.createElement('div');
    gameElement.className = 'game';

    const gameImage = document.createElement('img');
    gameImage.src = game.image;
    gameElement.appendChild(gameImage);

    const gameName = document.createElement('h2');
    gameName.textContent = game.name;
    gameElement.appendChild(gameName);

    const gameGenres = document.createElement('p');
    gameGenres.textContent = game.genres.join(', ');
    gameElement.appendChild(gameGenres);

    const learnMoreLink = document.createElement('a');
    learnMoreLink.href = game.siteURL;
    learnMoreLink.textContent = 'Learn More';
    gameElement.appendChild(learnMoreLink);

    gameList.appendChild(gameElement);
  }
};

        // 필터 버튼 클릭 시 필터 메뉴 보이기/숨기기
        const filterBtn = document.querySelector('.filter');
        const filterMenu = document.querySelector('.filter-menu');
        filterBtn.addEventListener('click', () => {
          filterMenu.classList.toggle('show');
        });