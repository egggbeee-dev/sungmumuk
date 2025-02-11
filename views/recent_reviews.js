 const perPage = 10; // 한 페이지에 표시할 리뷰 수
    let currentPage = 1;
    let reviews = [];
  
    // URL에서 page 매개변수 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = parseInt(urlParams.get("page"), 10);
    if (!isNaN(pageParam)) {
      currentPage = pageParam;
    }
  
    
  // API를 호출하여 리뷰 데이터 가져오기
  async function fetchReviews() {
    try {
      const response = await fetch('/api/reviews');
      if (!response.ok) throw new Error('리뷰 데이터를 가져오는 중 오류 발생');
      reviews = await response.json();
      renderReviews(); // 데이터를 가져온 후 렌더링
    } catch (error) {
      console.error(error);
      document.getElementById("reviews").innerHTML = `<p>리뷰를 가져오는 중 오류가 발생했습니다.</p>`;
    }
  }
  
  
  function renderReviews() {
    const reviewContainer = document.getElementById("reviews");
    reviewContainer.innerHTML = "";
  
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const currentReviews = reviews.slice(start, end);
  
    currentReviews.forEach((review) => {
      const reviewElement = document.createElement("div");
      reviewElement.className = "review";
      reviewElement.setAttribute("data-id", review.review_id);
  
      let reviewContent = `
        <div class="review-details">
          <h4>${review.restaurant_name || "알 수 없는 레스토랑"}</h4>
          <div class="review-snippet">
            <p>${review.review_text || " "}</p>
          </div>
          <p class="ratings">
            맛: ${generateStars(review.taste_rating)}<br>
            접근성: ${generateStars(review.access_rating)}<br>
            재방문: ${generateStars(review.revisit_rating)}
          </p>
          <p>${review.reviewer || "익명"} | ${new Intl.DateTimeFormat('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(review.created_at))}</p>
        </div>
      `;
  
      // 이미지가 있을 경우에만 img 태그 추가
      if (review.review_photo) {
        reviewContent = `<img src="/review/${review.review_photo}" alt="리뷰 이미지">` + reviewContent;
      }
  
      reviewElement.innerHTML = reviewContent;
      reviewElement.addEventListener("click", () => {
        location.href = `review_details.html?reviewId=${review.review_id}&page=${currentPage}`;
      });
  
      reviewContainer.appendChild(reviewElement);
    });
  
    updatePagination();
  }
  
  
    function generateStars(rating) {
      const maxStars = 5;
      let stars = "";
      for (let i = 1; i <= maxStars; i++) {
        stars += i <= rating ? "⭐" : "☆";
      }
      return stars;
    }
  
    function updatePagination() {
      const totalPage = Math.ceil(reviews.length / perPage);
      const prevButton = document.getElementById("prev");
      const nextButton = document.getElementById("next");
      const pageInfo = document.getElementById("page-info");
  
      pageInfo.textContent = `${currentPage} / ${totalPage}`;
  
      prevButton.disabled = currentPage === 1;
      nextButton.disabled = currentPage === totalPage;
    }
  
    document.getElementById("prev").addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderReviews();
        history.pushState(null, "", `?page=${currentPage}`);
      }
    });
  
    document.getElementById("next").addEventListener("click", () => {
      const totalPage = Math.ceil(reviews.length / perPage);
      if (currentPage < totalPage) {
        currentPage++;
        renderReviews();
        history.pushState(null, "", `?page=${currentPage}`);
      }
    });
  
    fetchReviews(); // 데이터베이스에서 리뷰 가져오기
