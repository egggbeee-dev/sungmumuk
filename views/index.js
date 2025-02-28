 // 검색 버튼 클릭 이벤트
 document.getElementById("search-button").addEventListener("click", () => {
    const query = document.getElementById("search-input").value.trim();
    if (query) {
        window.location.href = `store_search.html?query=${encodeURIComponent(query)}`;
    } else {
        alert("검색어를 입력해주세요.");
    }
  });

  // 엔터 키 입력 시 검색 실행
  document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("search-input"); // 검색 입력 필드
    const searchButton = document.getElementById("search-button"); // 검색 버튼

    if (searchInput) {
        searchInput.addEventListener("keypress", function (event) {
            if (event.key === "Enter") {
                event.preventDefault(); // 기본 동작(폼 제출) 방지
                searchButton.click(); // 검색 버튼 클릭 이벤트 실행
            }
        });
    }
  });
// 팝업 표시 로직
document.addEventListener("DOMContentLoaded", function () {
if (!localStorage.getItem("hideSurvey")) {
document.getElementById("survey-popup").style.display = "block";
}
if (!localStorage.getItem("hideGuide")) {
document.getElementById("guide-popup").style.display = "block";
}
});
// 팝업 닫기 & 로컬스토리지 저장
function closePopup(popupId) {
    document.getElementById(popupId).style.display = "none";
    if (popupId === "survey-popup" && document.getElementById("hide-survey").checked) {
      // 현재 날짜를 로컬 스토리지에 저장 (24시간 후 만료)
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + 1);  // 하루 뒤 날짜 설정
      localStorage.setItem("hideSurvey", JSON.stringify({ value: true, expire: expireDate }));
    }
    if (popupId === "guide-popup" && document.getElementById("hide-guide").checked) {
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + 1);
      localStorage.setItem("hideGuide", JSON.stringify({ value: true, expire: expireDate }));
    }
  }
  
  // 페이지 로드 시 팝업 체크
  window.onload = function() {
    const hideSurveyData = JSON.parse(localStorage.getItem("hideSurvey"));
    if (hideSurveyData && new Date(hideSurveyData.expire) > new Date()) {
      document.getElementById("survey-popup").style.display = "none";
    }
  
    const hideGuideData = JSON.parse(localStorage.getItem("hideGuide"));
    if (hideGuideData && new Date(hideGuideData.expire) > new Date()) {
      document.getElementById("guide-popup").style.display = "none";
    }
  };
  
