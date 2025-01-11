const menuButtons = document.querySelectorAll('.menu-button');
const storeListContainer = document.querySelector('.store-list');
const sortDropdown = document.getElementById('sort-options');

let currentCategory = '한식'; // 초기 카테고리
let currentSort = 'review'; // 초기 정렬 상태 (리뷰 많은 순)

// 페이지 로드 시 초기 데이터 요청
document.addEventListener('DOMContentLoaded', async () => {
    // 기본 카테고리에 해당하는 버튼에 active 클래스 추가
    const defaultButton = Array.from(menuButtons).find(button => {
        return button.querySelector('.menu-icon').textContent.trim() === '🍚';
    });
    if (defaultButton) {
        defaultButton.classList.add('active');
    }

    updateSortDropdown(); // 정렬 드롭다운 초기화
    await fetchAndUpdateStores(); // 기본 데이터 요청
});

// 정렬 옵션 변경 시 이벤트
sortDropdown.addEventListener('change', async () => {
    currentSort = sortDropdown.value; // 선택된 정렬 옵션 저장
    await fetchAndUpdateStores(); // 데이터 요청
});

// 카테고리 버튼 클릭 시 이벤트
menuButtons.forEach(button => {
    button.addEventListener('click', async () => {
        menuButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // 선택된 카테고리 갱신
        currentCategory = getCategory(button.querySelector('.menu-icon').textContent.trim());
        await fetchAndUpdateStores(); // 데이터 요청
    });
});

// 가게 데이터를 가져와 목록을 업데이트하는 함수
async function fetchAndUpdateStores() {
    try {
        const response = await fetch(`/menu/api?category=${encodeURIComponent(currentCategory)}&sort=${encodeURIComponent(currentSort)}`);
        if (!response.ok) throw new Error('서버 오류 발생');

        const data = await response.json();
        updateStoreList(data.stores); // 가게 목록 갱신
    } catch (error) {
        console.error('가게 데이터를 가져오는 중 오류 발생:', error);
    }
}


// 가게 목록 갱신 함수
function updateStoreList(stores) {
    storeListContainer.innerHTML = ''; // 기존 목록 삭제

    stores.forEach(store => {
        const storeItem = document.createElement('div');
        storeItem.classList.add('store-item');

        storeItem.innerHTML = `
            <img src="${store.image_url || 'default.jpg'}" class="store-img" alt="${store.category}">
            <div class="store-details">
                <p class="store-name">${store.restaurant_name}</p>
                <button class="details-button" onclick="location.href='store_details?id=${store.restaurant_id}'">자세히 보기</button>
            </div>
        `;
        storeListContainer.appendChild(storeItem);
    });
}

// 정렬 드롭다운 값 갱신
function updateSortDropdown() {
    sortDropdown.value = currentSort; // 현재 정렬 상태를 드롭다운에 반영
}

// 아이콘에 따라 카테고리 이름 반환
function getCategory(icon) {
    switch (icon) {
        case '🍚': return '한식';
        case '🍣': return '일식';
        case '🍲': return '중식';
        case '🍖': return '양식';
        case '🥗': return '샐러드/포케';
        case '🍷': return '술집';
        case '🍰': return '디저트';
        default: return '';
    }
}