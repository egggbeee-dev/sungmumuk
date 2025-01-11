
// 슬라이드쇼 초기화
let slideIndex = 1;

function plusSlides(n) {
  showSlides(slideIndex += n);
}

function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n = slideIndex) {
  let slides = document.getElementsByClassName("mySlides");
  let dots = document.getElementsByClassName("dot");
  if (n > slides.length) { slideIndex = 1 }
  if (n < 1) { slideIndex = slides.length }
  for (let i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  for (let i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex - 1].style.display = "flex";
  dots[slideIndex - 1].className += " active";

  // 자동 슬라이드쇼
  setTimeout(() => showSlides(++slideIndex), 5000);
}

document.addEventListener('DOMContentLoaded', () => {
  showSlides(); // 슬라이드쇼 시작
  fetchTopReviews(); // 리뷰 많은 순 초기 데이터 가져오기
});

// 찜 많은 순 가게 목록 표시
document.addEventListener("DOMContentLoaded", async () => {
  const storeList = document.querySelector('.store-list');
  try {
    const response = await fetch('/top-restaurants'); // 실제 API 호출
    const data = await response.json(); // 실제 데이터를 JSON으로 파싱
    // 데이터 렌더링
    storeList.innerHTML = data.map((store) => `
        <div class="store-item">
            <img src="${store.restaurant_image}" alt="${store.restaurant_name}" class="store-img">
            <div class="store-details">
                <p class="store-name">${store.restaurant_name}</p>
                <button class="details-button" onclick="location.href='store_details?id=${store.restaurant_id}'">자세히 보기</button>
            </div>
        </div>
    `).join('');
  } catch (error) {
    console.error('Error fetching top restaurants:', error);
    storeList.innerHTML = '<p>데이터를 불러오는 중 문제가 발생했습니다.</p>'; // 에러 메시지
  }
});

// 리뷰 많은 순 가게 목록 표시 함수
async function fetchTopReviews() {
  try {
    const response = await fetch('/top-reviews'); // 서버에서 데이터 가져오기
    const topReviews = await response.json(); // JSON으로 파싱
    displayStores(topReviews, '리뷰 많은 순', 'review-store-list'); // 특정 ID에 데이터 삽입
  } catch (error) {
    console.error('Error fetching top reviews:', error);
    displayStores([], '리뷰 많은 순', 'review-store-list'); // 리뷰 데이터가 없을 경우 빈 배열로 처리
  }
}

function displayStores(sortedStores, sortType, targetId) {
  const storeList = document.getElementById(targetId); // 삽입 대상 명확히 지정
  storeList.innerHTML = ''; // 기존 데이터 초기화

  sortedStores.forEach(store => {
    const storeItem = document.createElement('div');
    storeItem.className = 'store-item';
    storeItem.innerHTML = `
      <img src="${store.restaurant_image}" alt="${store.restaurant_name}" class="store-img">
      <div class="store-details">
        <p class="store-name">${store.restaurant_name}</p>
        <button class="details-button" onclick="location.href='store_details?id=${store.restaurant_id}'">자세히 보기</button>
      </div>
    `;
    storeList.appendChild(storeItem);
  });
}

// 리뷰 많은 순 버튼 클릭 이벤트 리스너
document.querySelector(".sort-button:nth-child(2)").addEventListener("click", fetchTopReviews);

// 페이지 로드 시 기본으로 리뷰 많은 순 표시
document.addEventListener('DOMContentLoaded', fetchTopReviews);
