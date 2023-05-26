// const gameData = [ // Not sure why this is being done, as the values were already hard-coded from index.js, but I'll leave it just in case.
//     {
//       name: 'Game name1',
//       rating: 'Game horoscope1',
//       description: 'Detailed Description1',
//       image: 'Game image URL1',
//       similar: ['Similar game1', 'Similar game2', 'Similar game3']
//     },
//     // More game data here...
//   ];

//   // Assume "searchedGameName" is the game name that user searched
//   let searchedGameName = 'Game name1';

//   let searchedGameData = gameData.find(game => game.name === searchedGameName);

//   document.getElementById('gameName').textContent = searchedGameData.name;
//   document.getElementById('gameRating').textContent = `horoscope: ${searchedGameData.rating}`;
//   document.getElementById('gameDescription').textContent = `Detailed Description: ${searchedGameData.description}`;
//   document.getElementById('gameImage').src = searchedGameData.image;
//   document.getElementById('similarGames').textContent = `Recommend a similar game: ${searchedGameData.similar.join(', ')}`;

//   // 데이터셋 로드 및 표시
//   fetch('/path/to/games-release-ALL.json')
//     .then(response => response.json())
//     .then(data => {
//       // 데이터셋에서 필요한 정보 추출
//       const gameName = data.name;
//       const gameRating = data.rating;
//       const gameDescription = data.description;
//       const gameImage = data.image;
//       const similarGames = data.similar;

//       // HTML 요소에 데이터 표시
//       document.getElementById('gameName').textContent = gameName;
//       document.getElementById('gameRating').textContent = gameRating;
//       document.getElementById('gameDescription').textContent = gameDescription;
//       document.getElementById('gameImage').src = game.Image;
//       document.getElementById('similarGames').textContent = similarGames.join(', ');
//       })
//       .catch(error => {
//       console.error('Error:', error);
//       });

function openHoverMenu(id) {
  let frame = document.getElementById(id);
  // frame.style = "display: inline;";
  frame.classList.add("focused");
}

function closeHoverMenu(id) {
  let frame = document.getElementById(id);
  // frame.style = "display: none;";
  frame.classList.remove("focused");
}
