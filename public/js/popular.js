        // 필터 버튼 클릭 시 필터 메뉴 보이기/숨기기
        const filterBtn = document.querySelector('.filter');
        const filterMenu = document.querySelector('.filter-menu');
        filterBtn.addEventListener('click', () => {
          filterMenu.classList.toggle('show');
        });

          