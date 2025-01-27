document.addEventListener("DOMContentLoaded", () => {
    const searchButton = document.getElementById("search-button");
    const searchInput = document.getElementById("search-input");
    const storeList = document.getElementById("store-list");
    const prevButton = document.getElementById("prev-button");
    const nextButton = document.getElementById("next-button");
    const pageIndicator = document.getElementById("page-indicator");
    const applyFiltersButton = document.getElementById("apply-filters");

    let currentPage = 1;
    let isAuthenticated = false; // 로그인 상태 변수

    // 로그인 상태 확인
    checkAuthentication();

    // URL에서 초기 검색어 및 필터 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get("query") || "";
    searchInput.value = initialQuery;

    // 초기 데이터 로드
    fetchAndRenderStores(initialQuery);

    // 검색 버튼 클릭 이벤트
    searchButton.addEventListener("click", () => {
        currentPage = 1;
        const searchQuery = searchInput.value.trim();
        fetchAndRenderStores(searchQuery);
    });

    // 필터 적용 버튼 클릭 이벤트
    applyFiltersButton.addEventListener("click", () => {
        currentPage = 1;
        const searchQuery = searchInput.value.trim();
        fetchAndRenderStores(searchQuery);
    });

    // 이전 버튼 클릭 이벤트
    prevButton.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            const searchQuery = searchInput.value.trim();
            fetchAndRenderStores(searchQuery);
        }
    });

    // 다음 버튼 클릭 이벤트
    nextButton.addEventListener("click", () => {
        currentPage++;
        const searchQuery = searchInput.value.trim();
        fetchAndRenderStores(searchQuery);
    });

    // 로그인 상태 확인 함수
    async function checkAuthentication() {
        try {
            const response = await fetch("/auth/status");
            const data = await response.json();
            isAuthenticated = data.loggedIn;
        } catch (err) {
            console.error("로그인 상태 확인 오류:", err);
            isAuthenticated = false;
        }
    }

    // 데이터 로드 및 렌더링 함수
    async function fetchAndRenderStores(query = "") {
        const searchQuery = query || searchInput.value.trim();
        const params = new URLSearchParams({
            query: searchQuery,
            price: document.getElementById("price-range").value,
            cafe: document.getElementById("cafe-type").value,
            campus: document.getElementById("campus-type").value,
            affiliation: document.getElementById("affiliation-type").value,
            sort: document.getElementById("sort-option").value,
            page: currentPage,
        });

        try {
            const response = await fetch(`/store_search?${params.toString()}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const { data = [], totalPages = 1 } = await response.json();

            storeList.innerHTML = data
                .map(
                    (store) => `
                    <div class="store-item">
                        <img src="${store.restaurant_image || '/uploads/default-logo.png'}" alt="${store.restaurant_name}" class="store-img">
                        <div class="store-details">
                            <p class="store-name">${store.restaurant_name}</p>
                            <p class="store-menu">추천 메뉴: ${store.recommended_menu || '추천 메뉴 없음'}</p>
                            <p class="store-price">평균 가격: ${store.average_price || '정보 없음'}</p>
                            <p class="store-rating">평점: ${store.average_rating || '0.0'} (${store.reviews || '0'} 리뷰)</p>
                            <button class="details-button" data-restaurant-id="${store.restaurant_id}">자세히 보기</button>
                        </div>
                        <button class="wishlist-button" data-store-id="${store.restaurant_id}">
                            <span class="heart-icon">🤍</span>찜
                        </button>
                        <button class="compare-button" data-store-id="${store.restaurant_id}">🔍<br>비교함</button>
                    </div>
                `
                )
                .join("");

            pageIndicator.textContent = `${currentPage} / ${totalPages}`;
            prevButton.disabled = currentPage === 1;
            nextButton.disabled = currentPage === totalPages;

            activateWishlistButtons();
            activateCompareButtons();
            initializeWishlistButtons(); 
        } catch (err) {
            console.error("데이터를 불러오는 중 오류 발생:", err);
            alert("서버와의 통신 중 문제가 발생했습니다.");
        }
    }

    // `details-button` 클릭 이벤트
    document.body.addEventListener("click", (event) => {
        if (event.target.classList.contains("details-button")) {
            const storeId = event.target.getAttribute("data-restaurant-id");
            if (storeId) {
                console.log("Button clicked, redirecting to store details with ID:", storeId);
                window.location.href = `/store_details?id=${storeId}`;
            }
        }
    });

    // 찜 버튼 활성화 함수
    function activateWishlistButtons() {
        const wishlistButtons = document.querySelectorAll(".wishlist-button");
        wishlistButtons.forEach((button) => {
            button.removeEventListener("click", handleWishlistClick);
            button.addEventListener("click", handleWishlistClick);
        });
    }

    function handleWishlistClick(event) {
        if (!isAuthenticated) {
            const userConfirmed = confirm("로그인이 필요한 페이지입니다. 로그인 페이지로 이동하시겠습니까?");
            if (userConfirmed) {
                window.location.href = "/login.html";
            }
            return;
        }

        const button = event.currentTarget;
        const storeId = parseInt(button.dataset.storeId, 10);
        const isAdding = !button.classList.contains("active");
        toggleWishlist(event);

        if (isAdding) {
            addFavoriteToServer(storeId);
        } else {
            removeFavoriteFromServer([storeId]);
        }
    }

    // 찜 버튼 토글 함수
    function toggleWishlist(event) {
        const button = event.currentTarget;
        button.classList.toggle("active");
        const heartIcon = button.querySelector(".heart-icon");
        heartIcon.textContent = button.classList.contains("active") ? "💜" : "🤍";
    }

    // 찜 추가 요청 함수
    async function addFavoriteToServer(storeId) {
        try {
            const response = await fetch("/api/add-favorites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ storeIds: [storeId] }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "찜 추가 중 오류 발생");
            console.log("찜 추가 성공:", data.message);
        } catch (err) {
            console.error("찜 추가 중 오류 발생:", err);
        }
    }

    // 찜 삭제 요청 함수
    async function removeFavoriteFromServer(storeIds) {
        try {
            const response = await fetch("/api/remove-favorites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ storeIds }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "찜 삭제 중 오류 발생");
            console.log("찜 삭제 성공:", data.message);
        } catch (err) {
            console.error("찜 삭제 중 오류 발생:", err);
        }
    }

    // 찜 버튼 초기화 함수
async function initializeWishlistButtons() {
    try {
        // 사용자의 찜 목록 조회
        const response = await fetch("/api/user-favorites");
        if (!response.ok) throw new Error("찜 데이터를 가져오는 중 오류 발생");

        const data = await response.json();
        const favoriteStoreIds = data.favoriteStoreIds || []; // 사용자의 찜한 가게 ID 배열

        // 찜 버튼 상태 업데이트
        const wishlistButtons = document.querySelectorAll(".wishlist-button");
        wishlistButtons.forEach((button) => {
            const storeId = parseInt(button.dataset.storeId, 10);
            if (favoriteStoreIds.includes(storeId)) {
                button.classList.add("active"); // 활성화 상태로 변경
                const heartIcon = button.querySelector(".heart-icon");
                heartIcon.textContent = "💜"; // 보라색 하트
            }
        });
    } catch (err) {
        console.error("찜 버튼 초기화 중 오류 발생:", err);
    }
}


    // 비교 버튼 활성화 함수
    function activateCompareButtons() {
        const compareButtons = document.querySelectorAll(".compare-button");
        compareButtons.forEach((button) => {
            button.removeEventListener("click", handleCompareClick);
            button.addEventListener("click", handleCompareClick);
        });
    }

    function handleCompareClick(event) {
        if (!isAuthenticated) {
            const userConfirmed = confirm("로그인이 필요한 페이지입니다. 로그인 페이지로 이동하시겠습니까?");
            if (userConfirmed) {
                window.location.href = "/login.html";
            }
            return;
        }

        const button = event.currentTarget;
        const storeId = parseInt(button.dataset.storeId, 10);
        if (!storeId) {
            console.error("유효하지 않은 가게 ID입니다.");
            return;
        }

        // 현재 비교 상태 확인
        fetchCompareList().then((currentCompareIds) => {
            if (currentCompareIds.includes(storeId)) {
                alert("이미 비교함에 추가된 가게입니다.");
                return;
            }

            if (currentCompareIds.length >= 2) {
                alert("비교함에는 최대 2개의 가게만 추가할 수 있습니다.");
                return;
            }

            addCompareToServer([storeId]);
        });
    }

    async function fetchCompareList() {
        try {
            const response = await fetch("/compare");
            if (!response.ok) throw new Error("비교함 데이터를 가져오는 중 오류 발생");

            const data = await response.json();
            return data.map((item) => item.restaurant_id);
        } catch (err) {
            console.error("비교함 데이터를 가져오는 중 오류 발생:", err);
            return [];
        }
    }

    async function addCompareToServer(storeIds) {
        try {
            const response = await fetch("/store_search/api/compare", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ storeIds }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "비교함 추가 중 오류 발생");
            alert("비교함에 추가되었습니다.");
        } catch (err) {
            console.error("비교함 추가 중 오류 발생:", err);
        }
    }

    // 랜덤 데이터 가져오기
async function fetchRandomRestaurants() {
    try {
        const response = await fetch("/api/restaurants/random"); // 백엔드에서 랜덤 데이터를 가져오는 API 호출
        if (!response.ok) throw new Error("랜덤 데이터를 가져오는데 실패했습니다.");

        const { restaurants } = await response.json();
        renderRestaurants(restaurants); // 랜덤 데이터를 렌더링
    } catch (error) {
        console.error("랜덤 데이터 로드 중 오류 발생:", error);
        alert("랜덤 데이터를 불러오는 중 문제가 발생했습니다.");
    }
}

// 렌더링 함수
function renderRestaurants(restaurants) {
    const storeList = document.getElementById("store-list");

    if (!restaurants || restaurants.length === 0) {
        storeList.innerHTML = "<p>표시할 식당 데이터가 없습니다.</p>";
        return;
    }

    storeList.innerHTML = restaurants
        .map(
            (store) => `
        <div class="store-item">
            <img src="${store.restaurant_image || '/uploads/default-logo.png'}" alt="${store.restaurant_name}" class="store-img">
            <div class="store-details">
                <p class="store-name">${store.restaurant_name}</p>
                <p class="store-menu">추천 메뉴: ${store.recommended_menu || '추천 메뉴 없음'}</p>
                <p class="store-price">평균 가격: ${store.average_price || '정보 없음'}</p>
                <p class="store-rating">평점: ${store.average_rating || '0.0'} (${store.reviews || '0'} 리뷰)</p>
                <button class="details-button" data-restaurant-id="${store.restaurant_id}">자세히 보기</button>
            </div>
        </div>
        `
        )
        .join("");
}

// 초기 화면에 랜덤 데이터를 로드
document.addEventListener("DOMContentLoaded", () => {
    fetchRandomRestaurants(); // 랜덤 데이터를 가져와 렌더링
});

});
