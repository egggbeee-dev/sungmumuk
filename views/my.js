document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 서버에서 상위 3개 찜한 가게 데이터를 가져옴
    const response = await fetch('/mypage/favorites');
    if (!response.ok) throw new Error('찜한 가게 데이터를 가져올 수 없습니다.');

    const stores = await response.json();
    renderFavorites(stores);
  } catch (error) {
    console.error('마이페이지 데이터 로드 중 오류:', error);
  }

  // 리뷰 데이터 불러오기
  await loadReviews();

  // 프로필 데이터 불러오기
  await loadProfile();

  // 닉네임 중복확인 버튼 이벤트 연결
  document.getElementById("check-nickname-button").addEventListener("click", checkNickname);
});

function renderFavorites(stores) {
  const container = document.querySelector('.favorites-list');
  const viewAll = document.querySelector('.view-all');

  if (!stores.length) {
    container.innerHTML = '<p>찜한 가게가 없습니다.</p>';
    viewAll.style.display = 'none';
    return;
  }

  container.innerHTML = stores.map(store => `
      <div class="favorite-store">
        <img src="${store.representative_image || '/images/default-image.jpg'}" alt="${store.restaurant_name}" class="store-image" />
        <div class="store-info">
          <div class="store-name">${store.restaurant_name}</div>
          <p class="store-category">${store.category}</p>
          <p class="store-campus">${store.campus}</p>
          <a href="/store_details?id=${store.restaurant_id}" class="detail-button">자세히 보기</a>
        </div>
      </div>
    `).join('');

  viewAll.style.display = 'block';
}

// 리뷰 불러오기
async function loadReviews() {
  const container = document.querySelector('.reviews-container .favorites-list');
  const viewAll = document.querySelector('.view-all-reviews');

  try {
    const response = await fetch('/my_reviews/mypage/reviews');
    if (!response.ok) throw new Error('리뷰 데이터를 가져오지 못했습니다.');

    const reviews = await response.json();

    if (!Array.isArray(reviews)) throw new Error('잘못된 데이터 형식입니다.');

    renderReviews(reviews, container, viewAll);
  } catch (error) {
    console.error('리뷰 데이터 로드 중 오류:', error);
    container.innerHTML = '<p>리뷰를 가져오는 중 문제가 발생했습니다.</p>';
    viewAll.style.display = 'none';
  }
}

function renderReviews(reviews, container, viewAll) {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    container.innerHTML = '<p>작성된 리뷰가 없습니다.</p>';
    if (viewAll) viewAll.style.display = 'none';
    return;
  }

  container.innerHTML = reviews.map(review => `
    <div class="reviews-box">
      ${review.review_photo ? `<img src="/review/${review.review_photo}" alt="${review.restaurant_name}" class="review-image" />` : ''}
      <div class="reviews-content">
        <h3 class="restaurant-name">${review.restaurant_name}</h3>
        <p class="reviews-text">${review.review_text}</p>
        <div class="reviews-ratings">
          <span>맛:</span> ${'⭐'.repeat(review.taste_rating)}
          <span>재방문:</span> ${'⭐'.repeat(review.revisit_rating)}
          <span>접근성:</span> ${'⭐'.repeat(review.access_rating)}
        </div>
        <p class="reviews-date">작성일: ${new Date(review.created_at).toLocaleDateString()}</p>
      </div>
      <a href="/store_review.html?id=${review.review_id}" class="detail-button">자세히 보기</a>
    </div>
  `).join('');

  if (viewAll) viewAll.style.display = 'block';
}

// 프로필 데이터 불러오기
let currentNickname = "";  // 현재 닉네임 저장

async function loadProfile() {
    try {
        const response = await fetch("/my/profile");
        if (!response.ok) throw new Error("Failed to fetch profile data");

        const data = await response.json();

        currentNickname = data.nickname || "";  // 현재 닉네임 저장

        document.getElementById("nickname-display").textContent = data.nickname || "정보 없음";
        document.getElementById("nickname-input").value = data.nickname || "";
        document.getElementById("email-display").textContent = data.email || "정보 없음";
        document.getElementById("department-display").textContent = data.department || "정보 없음";
        document.getElementById("department-input").value = data.department || "";
    } catch (error) {
        console.error("Error fetching profile data:", error);
        alert("프로필 정보를 불러오는데 실패했습니다.");
    }
}

// 닉네임 중복 확인
async function checkNickname() {
    const nickname = document.getElementById("nickname-input").value.trim();
    const resultMessage = document.getElementById("nickname-check-result");

    if (!nickname) {
        resultMessage.textContent = "닉네임을 입력해주세요.";
        resultMessage.style.color = "red";
        resultMessage.style.display = "block";
        return;
    }

    // 현재 닉네임과 동일한 경우
    if (nickname === currentNickname) {
        resultMessage.textContent = "현재 사용 중인 닉네임입니다.";
        resultMessage.style.color = "green";
        resultMessage.style.display = "block";
        return;
    }

    try {
        const response = await fetch(`/api/check-nickname?nickname=${nickname}`);
        const data = await response.json();

        if (response.status === 409) {
            resultMessage.textContent = "이미 사용 중인 닉네임입니다.";
            resultMessage.style.color = "red";
        } else {
            resultMessage.textContent = "사용 가능한 닉네임입니다.";
            resultMessage.style.color = "green";
        }
        resultMessage.style.display = "block";
    } catch (error) {
        console.error("닉네임 중복 확인 중 오류 발생:", error);
        resultMessage.textContent = "오류가 발생했습니다. 다시 시도해주세요.";
        resultMessage.style.color = "red";
        resultMessage.style.display = "block";
    }
}

// 정보 저장
async function saveChanges() {
    const nickname = document.getElementById("nickname-input").value.trim();
    const department = document.getElementById("department-input").value.trim();

    if (!nickname) {
        alert("닉네임을 입력해주세요.");
        return;
    }

    // 닉네임이 변경되지 않았으면 중복 확인 패스
    if (nickname !== currentNickname) {
        try {
            const checkResponse = await fetch(`/api/check-nickname?nickname=${nickname}`);
            const checkData = await checkResponse.json();

            if (checkResponse.status === 409) {
                alert("닉네임을 확인해주세요. 이미 사용 중인 닉네임입니다.");
                return;
            }
        } catch (checkError) {
            console.error("닉네임 중복 확인 중 오류:", checkError);
            alert("닉네임 중복 확인 중 오류가 발생했습니다.");
            return;
        }
    }

    // 업데이트 요청
    try {
        const response = await fetch("/my/profile/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nickname, department })
        });

        const result = await response.json();
        if (result.success) {
            alert("정보가 성공적으로 업데이트되었습니다.");

            // 닉네임과 학과 업데이트 반영
            document.getElementById("nickname-display").textContent = nickname;
            document.getElementById("department-display").textContent = department;

            // 현재 닉네임도 업데이트
            currentNickname = nickname;

            // 편집 모드 해제
            document.getElementById("nickname-input").classList.add("hidden");
            document.getElementById("department-input").classList.add("hidden");
            document.getElementById("nickname-display").classList.remove("hidden");
            document.getElementById("department-display").classList.remove("hidden");
            document.querySelector(".edit-button").classList.remove("hidden");
            document.getElementById("save-button").classList.add("hidden");
            document.querySelector(".nickname-check").classList.add("hidden");

            // 헤더 닉네임 업데이트
            updateHeaderNickname(nickname);
            refreshSession();
        } else {
            alert(result.message || "정보 업데이트 중 오류가 발생했습니다.");
        }
    } catch (updateError) {
        console.error("정보 업데이트 중 오류:", updateError);
        alert("정보 업데이트 중 오류가 발생했습니다.");
    }
}


// 닉네임 업데이트용 (헤더 쪽 동기화 함수)
function updateHeaderNickname(nickname) {
  const headerNickname = document.querySelector("#header-nickname");
  if (headerNickname) {
    headerNickname.textContent = nickname;
  }
}

// 세션 갱신 (선택사항)
function refreshSession() {
  fetch("/auth/refresh-session", { method: "POST" }).catch(console.error);
}
