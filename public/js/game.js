function displayGames(games) {
    let html = '<table>';
    games.forEach(game => {
      html += `<tr>
                 <td><img src="${game.header_image}" alt="${game.name}" /></td>
                 <td>${game.name}</td>
                 <td>${game.short_description}</td>
                 <td>${game.price}</td>
                 <td>${game.genre}</td>
               </tr>`;
    });
    html += '</table>';
    document.getElementById('gameList').innerHTML = html;
}

  
  fetch('/api/game') // 요청을 '/api/game'으로 변경했습니다.
    .then(response => response.json())
    .then(data => {
      displayGames(data);
  
      document.getElementById('popular').addEventListener('click', function () {
        let popularGames = data.filter(game => game.isPopular);
        displayGames(popularGames);
      });
  
      document.getElementById('free').addEventListener('click', function () {
        let freeGames = data.filter(game => game.isFree);
        displayGames(freeGames);
      });
    })
    .catch(error => {
      console.error("Error fetching data: ", error);
    });
