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