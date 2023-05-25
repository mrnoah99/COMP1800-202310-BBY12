function displayGames(gamesArray) {
  let html = '<table>';
  gamesArray.forEach(game => {
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

let page = 1;
let pageSize = 10;
let freeGamesOnly = false;
let popularGamesOnly = false;
let sortPrice = null;  // Add this line


function loadPage() {
  let url = `/api/game?page=${page}&pageSize=${pageSize}`;

  if (freeGamesOnly) {
    url += '&free=true';
  }
  if (popularGamesOnly) {
    url += '&popular=true';
  }
  if (sortPrice) {
    url += `&sortPrice=${sortPrice}`; // Add this line
  }
  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (popularGamesOnly) {
        data.data.sort((a, b) => parseInt(b.owners.replace(/[^0-9]/g, '')) - parseInt(a.owners.replace(/[^0-9]/g, '')));
      }
      displayGames(data.data);

      document.getElementById('pageNumber').textContent = data.page;
      document.getElementById('totalPages').textContent = data.totalPages;

      document.getElementById('prevPage').disabled = data.page <= 1;
      document.getElementById('nextPage').disabled = data.page >= data.totalPages;
    })
    .catch(error => {
      console.error("Error fetching data: ", error);
    });
}


document.getElementById('prevPage').addEventListener('click', function () {
  page--;
  loadPage();
});

document.getElementById('nextPage').addEventListener('click', function () {
  page++;
  loadPage();
});

document.getElementById('free').addEventListener('click', function () {
  freeGamesOnly = true;
  popularGamesOnly = false; // Reset popular games filter
  page = 1;
  loadPage();
});

document.getElementById('popular').addEventListener('click', function () {
  popularGamesOnly = true;
  freeGamesOnly = false; // Reset free games filter
  page = 1;
  loadPage();
});

document.getElementById('all').addEventListener('click', function () {
  freeGamesOnly = false; // Reset free games filter
  popularGamesOnly = false; // Reset popular games filter
  page = 1; // Go back to the first page
  loadPage(); // Reload the page
});

document.getElementById('expensive').addEventListener('click', function () {
  sortPrice = 'desc'; // Set sortPrice to 'desc'
  page = 1;
  loadPage();
});

document.getElementById('cheap').addEventListener('click', function () {
  sortPrice = 'asc'; // Set sortPrice to 'asc'
  page = 1;
  loadPage();
});

loadPage(); // Load the first page on initial run

