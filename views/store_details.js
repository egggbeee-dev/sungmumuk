let isFavorite = false;  // 현재 가게의 찜 여부 저장
let isAuthenticated = false;  // 로그인 여부
const storeId = parseInt(new URLSearchParams(window.location.search).get("id"), 10);

document.addEventListener("DOMContentLoaded", async () => {
    await checkAuthentication(); // 로그인 여부 확인
    await initializeWishlistButton(); // 현재 가게의 찜 여부 확인 후 버튼 업데이트

    const wishlistButton = document.getElementById("wishlist-button");
    wishlistButton.addEventListener("click", toggleWishlist);
});

// 로그인 상태 확인
async function checkAuthentication() {
    try {
        const response = await fetch("/auth/status");
        const data = await response.json();
        isAuthenticated = data.loggedIn;
    } catch (err) {
        console.error("로그인 상태 확인 실패:", err);
        isAuthenticated = false;
    }
}

// 추천하는 가볍고 빠른 방식
async function initializeWishlistButton() {
    try {
        const response = await fetch(`/api/check-favorite-status?id=${storeId}`);
        const data = await response.json();
        isFavorite = data.isFavorite;
        updateWishlistButton();
    } catch (err) {
        console.error("찜 상태 확인 실패:", err);
    }
}

// 찜 버튼 UI 업데이트
function updateWishlistButton() {
    const heartIcon = document.querySelector("#wishlist-button .heart-icon");
    heartIcon.textContent = isFavorite ? "💜" : "🤍";
}

// 찜 버튼 클릭 시 토글 동작
async function toggleWishlist() {
    if (!isAuthenticated) {
        const goToLogin = confirm("로그인이 필요한 기능입니다. 로그인 페이지로 이동할까요?");
        if (goToLogin) {
            window.location.href = "/login.html";
        }
        return;
    }

    if (isFavorite) {
        await removeFavorite();
    } else {
        await addFavorite();
    }
}

// 찜 추가
async function addFavorite() {
    try {
        const response = await fetch("/api/add-favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ storeIds: [storeId] }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "찜 추가 실패");
        }

        isFavorite = true;
        updateWishlistButton();
        alert("찜 목록에 추가되었습니다.");
    } catch (err) {
        console.error("찜 추가 오류:", err);
        alert("찜 추가에 실패했습니다.");
    }
}

// 찜 삭제
async function removeFavorite() {
    try {
        const response = await fetch("/api/remove-favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ storeIds: [storeId] }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "찜 삭제 실패");
        }

        isFavorite = false;
        updateWishlistButton();
        alert("찜 목록에서 삭제되었습니다.");
    } catch (err) {
        console.error("찜 삭제 오류:", err);
        alert("찜 삭제에 실패했습니다.");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await checkAuthentication();
    const compareButton = document.getElementById("compare-button");

    if (compareButton) {
        compareButton.addEventListener("click", handleCompareClick);
    } else {
        console.error("compare-button이 존재하지 않습니다.");
    }
});

async function handleCompareClick() {
    if (!isAuthenticated) {
        const userConfirmed = confirm("로그인이 필요한 기능입니다. 로그인 페이지로 이동할까요?");
        if (userConfirmed) {
            window.location.href = "/login.html";
        }
        return;
    }

    try {
        const currentCompareIds = await fetchCompareList();

        if (currentCompareIds.includes(storeId)) {
            alert("이미 비교함에 추가된 가게입니다.");
            return;
        }

        if (currentCompareIds.length >= 2) {
            alert("비교함에는 최대 2개의 가게만 추가할 수 있습니다.");
            return;
        }

        await addCompareToServer([storeId]);
        alert("비교함에 추가되었습니다.");
    } catch (err) {
        console.error("비교함 처리 중 오류 발생:", err);
        alert("비교함 추가 중 문제가 발생했습니다.");
    }
}

async function fetchCompareList() {
    try {
        const response = await fetch("/compare");
        if (!response.ok) throw new Error("비교함 데이터를 가져오는 중 오류 발생");

        const data = await response.json();
        return data.map(item => item.restaurant_id);
    } catch (err) {
        console.error("비교함 데이터 조회 실패:", err);
        return [];
    }
}

async function addCompareToServer(storeIds) {
    try {
        const response = await fetch("/api/compare", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ storeIds }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "비교함 추가 중 오류 발생");
    } catch (err) {
        console.error("비교함 추가 요청 실패:", err);
        throw err;
    }
}

