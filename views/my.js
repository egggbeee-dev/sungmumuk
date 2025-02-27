document.addEventListener('DOMContentLoaded', async () => {
        try {
          // 서버에서 상위 3개 찜한 가게 데이터를 가져옴
          const response = await fetch('/mypage/favorites');
          if (!response.ok) throw new Error('찜한 가게 데이터를 가져올 수 없습니다.');
      
          const stores = await response.json(); // JSON 데이터 파싱
          renderFavorites(stores); // 화면에 렌더링
        } catch (error) {
          console.error('마이페이지 데이터 로드 중 오류:', error);
        }
      });
      
      function renderFavorites(stores) {
        const container = document.querySelector('.favorites-list');
        const viewAll = document.querySelector('.view-all');
      
        // 데이터가 없는 경우 처리
        if (!stores.length) {
          container.innerHTML = '<p>찜한 가게가 없습니다.</p>';
          viewAll.style.display = 'none'; // 데이터가 없으면 버튼 숨김
          return;
        }
      
        // 데이터가 있는 경우 목록 렌더링
        container.innerHTML = stores
          .map(store => `
            <div class="favorite-store">
              <img src="${store.representative_image || '/images/default-image.jpg'}" alt="${store.restaurant_name}" class="store-image" />
              <div class="store-info">
                <div class="store-name">${store.restaurant_name}</div>
                <p class="store-category">${store.category}</p>
                <p class="store-campus">${store.campus}</p>
                <a href="/store_details?id=${store.restaurant_id}" class="detail-button">자세히 보기</a>
              </div>
            </div>
          `)
          .join('');
      
        // 데이터가 있으면 "전체 보기" 버튼 표시
        viewAll.style.display = 'block';
      }
      
    //내가 쓴 리뷰 
    document.addEventListener('DOMContentLoaded', loadReviews);

async function loadReviews() {
    const container = document.querySelector('.reviews-container .favorites-list');
    const viewAll = document.querySelector('.view-all-reviews');

    try {
        // 리뷰 데이터를 가져오는 API 호출
        const response = await fetch('/my_reviews/mypage/reviews');
        if (!response.ok) throw new Error('리뷰 데이터를 가져오지 못했습니다.');

        const reviews = await response.json(); // JSON 데이터 파싱

        // 응답이 배열이 아닐 경우 오류 처리
        if (!Array.isArray(reviews)) throw new Error('잘못된 데이터 형식입니다.');

        renderReviews(reviews, container, viewAll);
    } catch (error) {
        console.error('리뷰 데이터 로드 중 오류:', error);
        container.innerHTML = '<p>리뷰를 가져오는 중 문제가 발생했습니다.</p>';
        viewAll.style.display = 'none'; // 오류 발생 시 버튼 숨김
    }
}

function renderReviews(reviews, container, viewAll) {
  console.log('리뷰 개수:', reviews.length);
  console.log('viewAll 존재 여부:', viewAll);

  if (!Array.isArray(reviews) || reviews.length === 0) {
      container.innerHTML = '<p>작성된 리뷰가 없습니다.</p>';
      if (viewAll) {
          viewAll.style.display = 'none'; // 존재하는 경우만 처리
      }
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

  if (viewAll) {
      viewAll.style.display = 'block'; // 존재하는 경우만 처리
  }
}

 
    

      // 프로필 데이터 가져오기 및 렌더링
      document.addEventListener("DOMContentLoaded", async () => {
        try {
          const response = await fetch("/my/profile");
          if (!response.ok) {
            throw new Error("Failed to fetch profile data");
          }

          const data = await response.json();

          // DOM 업데이트
          document.getElementById("nickname-display").textContent =
            data.nickname || "정보 없음";
          document.getElementById("nickname-input").value = data.nickname || "";
          document.getElementById("email-display").textContent =
            data.email || "정보 없음";
          document.getElementById("department-display").textContent =
            data.department || "정보 없음";
          document.getElementById("department-input").value =
            data.department || "";
        } catch (error) {
          console.error("Error fetching profile data:", error);
          alert("프로필 정보를 불러오는데 실패했습니다.");
        }
      });

      // 수정 모드로 전환
      function toggleEditMode() {
        // 닉네임과 학과 표시 영역을 숨김
        document.getElementById("nickname-display").classList.add("hidden");
        document.getElementById("department-display").classList.add("hidden");
        
        // 닉네임과 학과 입력 필드를 표시
        document.getElementById("nickname-input").classList.remove("hidden");
        document.getElementById("department-input").classList.remove("hidden");
      
        // "정보 수정" 버튼 숨기기
        document.querySelector(".edit-button").classList.add("hidden");
      
        // "저장" 버튼 표시
        document.getElementById("save-button").classList.remove("hidden");
      }
      

      // 변경된 정보 저장
      async function saveChanges() {
        const nickname = document.getElementById("nickname-input").value;
        const department = document.getElementById("department-input").value;
    
        try {
            const response = await fetch("/my/profile/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nickname, department })
            });
    
            const result = await response.json();
            if (result.success) {
                alert("정보가 성공적으로 업데이트되었습니다.");
    
                // ✅ 헤더의 닉네임을 즉시 업데이트
                updateHeaderNickname(nickname);
    
                // ✅ 세션을 새로고침하여 변경된 닉네임 반영
                refreshSession();
    
                // ✅ 페이지 새로고침 없이 마이페이지 UI도 업데이트
                document.getElementById("nickname-display").textContent = nickname;
                document.getElementById("nickname-input").classList.add("hidden");
                document.getElementById("nickname-display").classList.remove("hidden");
    
                document.getElementById("department-display").textContent = department;
                document.getElementById("department-input").classList.add("hidden");
                document.getElementById("department-display").classList.remove("hidden");
    
                document.querySelector(".edit-button").classList.remove("hidden");
                document.getElementById("save-button").classList.add("hidden");
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Error saving profile changes:", error);
            alert("정보 업데이트 중 오류가 발생했습니다.");
        }
    }
    
