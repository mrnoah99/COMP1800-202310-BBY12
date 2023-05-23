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


app.get('/free-games', (req, res) => {
    const games = [
      { name: 'League of Legends', genres: 'MOBA', image: 'https://wallpaperaccess.com/full/2379009.jpg', url: 'purchase-page-url' },
      { name: 'Apex Legends', genres: 'Battle royale', image: 'https://mms.businesswire.com/media/20190204005535/en/703803/4/APEX_Primary_Art_72dpi_RGB_FIN.jpg', url: 'purchase-page-url' },
      { name: 'Fortnite', genres: 'Survival, battle royale, sandbox', image: 'https://wallpaperaccess.com/full/2379009.jpg', url: 'purchase-page-url' },
      { name: 'Warframe', genres: 'Online action', image: 'https://s.yimg.com/fz/api/res/1.2/TBGlJPuGrYCI.pz5Vt1JBA--~C/YXBwaWQ9c3JjaGRkO2ZpPWZpdDtoPTI2MDtxPTgwO3c9MjYw/https://s.yimg.com/zb/imgv1/30fe762d-df30-303f-aa96-d81d6621bdac/t_500x300', url: 'purchase-page-url' },
      { name: 'Genshin Impact', genres: 'Open-world adventure', image: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/a98cff5d-a612-49d8-a0db-175994384b20/de6gwbc-c62515e8-9411-41f1-a478-41972654fd0b.png/v1/fill/w_512,h_512,strp/genshin_impact_icon_by_kiramaru_kun_de6gwbc-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9NTEyIiwicGF0aCI6IlwvZlwvYTk4Y2ZmNWQtYTYxMi00OWQ4LWEwZGItMTc1OTk0Mzg0YjIwXC9kZTZnd2JjLWM2MjUxNWU4LTk0MTEtNDFmMS1hNDc4LTQxOTcyNjU0ZmQwYi5wbmciLCJ3aWR0aCI6Ijw9NTEyIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmltYWdlLm9wZXJhdGlvbnMiXX0.aAlCN4I4hmNlQLEkdBgimNt61LuwE2URyQkrREEtPCc', url: 'purchase-page-url' },
      { name: 'Call of Duty Warzone', genres: 'Battle royale', image: 'https://tse3.mm.bing.net/th?id=OIP.NSNSp4aTWGfwM_gs5uBwDwHaHa&pid=Api&P=0', url: 'purchase-page-url' },
    ];
  
    res.render('free-games', { games });
  });
  