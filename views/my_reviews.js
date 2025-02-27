      function goToEditPage(storeName, tasteRating, revisitRating, accessRating, reviewText) {
        const url = new URL("review_register.html", window.location.origin);
        url.searchParams.append("storeName", storeName);
        url.searchParams.append("tasteRating", tasteRating);
        url.searchParams.append("revisitRating", revisitRating);
        url.searchParams.append("accessRating", accessRating);
        url.searchParams.append("reviewText", reviewText);
        window.location.href = url;
      }

      /**
       * 로그인 상태 확인 및 처리
       */
      async function checkAuthStatus() {
        try {
          const authResponse = await fetch('/auth/status');
          const authStatus = await authResponse.json();

          if (!authStatus.loggedIn) {
            // 비로그인 상태
            console.log("인증 상태 확인: 비로그인 사용자입니다.");
            document.getElementById('login-message').style.display = 'block';
          } else {
            // 로그인 상태
            console.log("인증 상태 확인: 로그인된 사용자입니다.");
            fetchReviews(); // 리뷰 데이터 가져오기
          }
        } catch (error) {
          console.error("로그인 상태 확인 중 오류 발생:", error);
        }
      }

      /**
       * 서버에서 리뷰 데이터 가져오기
       */
       async function fetchReviews() {
        const url = "/my_reviews/api/reviews"; // 리뷰 데이터를 가져오는 API 경로
        console.log("요청 URL:", url); // 요청 URL 확인용 로그
    
        try {
            const response = await fetch(url);
    
            if (!response.ok) {
                throw new Error(`리뷰 데이터를 불러오는 데 실패했습니다. 상태 코드: ${response.status}`);
            }
    
            const reviews = await response.json();
            console.log("응답 받은 리뷰 데이터:", reviews);
    
            const reviewList = document.getElementById("review-list");
    
            if (!reviews || reviews.length === 0) {
                // 리뷰가 없을 경우 메시지 표시
                reviewList.innerHTML = "<p class='no-reviews'>작성된 리뷰가 없습니다.</p>";
                reviewList.style.display = "flex"; // 메시지를 보기 좋게 정렬
                reviewList.style.justifyContent = "center";
                reviewList.style.alignItems = "center";
                reviewList.style.minHeight = "150px"; // 너무 납작하지 않도록 설정
                return;
            }
    
            renderReviews(reviews); // 데이터가 있을 경우 렌더링
            reviewList.style.display = "block"; // 리뷰가 있으면 보이게 설정
        } catch (error) {
            console.error("리뷰 데이터를 가져오는 중 오류 발생:", error);
            document.getElementById("review-list").innerHTML =
                "<p class='error-message'>리뷰를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.</p>";
        }
    }
    
    /**
     * 리뷰 데이터를 HTML로 렌더링
     * @param {Array} reviews - 서버에서 가져온 리뷰 데이터
     */
    function renderReviews(reviews) {
        const reviewList = document.getElementById("review-list");
        reviewList.innerHTML = ""; // 기존 내용을 초기화
    
        reviews.forEach((review) => {
            const reviewBox = document.createElement("div");
            reviewBox.classList.add("review-box");
    
            // reviewPhoto가 존재할 경우만 HTML 추가
            const photoHTML = review.reviewPhoto
                ? `<div class="review-photo">
                     <img src="/review/${review.reviewPhoto}" alt="리뷰 사진" />
                   </div>`
                : "";
    
            reviewBox.innerHTML = `
                <div class="review-info">
                  <div class="review-header">
                    <h2 class="store-name">${review.restaurantName}</h2>
                  </div>
                  <div class="review-content">
                    ${photoHTML}
                    <div class="review-details">
                      <div class="review-rating">
                        <strong>맛:</strong> ${"★".repeat(review.tasteRating)}
                        <strong>재방문:</strong> ${"★".repeat(review.revisitRating)}
                        <strong>접근성:</strong> ${"★".repeat(review.accessRating)}
                      </div>
                      <div class="review-text">
                        ${review.reviewText}
                      </div>
                      <div class="review-date">
                      <strong>작성일:</strong> ${review.createdAt}
                    </div>
                    </div>
                  </div>
                  <button class="detail-button" onclick="goToReviewDetailPage('${review.reviewId}')">
                    자세히 보기
                  </button>
                </div>
            `;
    
            reviewList.appendChild(reviewBox);
        });
    }
    
      
      // 페이지 로드 시 로그인 상태 확인
      document.addEventListener("DOMContentLoaded", checkAuthStatus);

      //리뷰 페이지 이동
        function goToReviewDetailPage(reviewId) {
          const url = `/store_review.html?id=${reviewId}`;
          window.location.href = url;
        }

