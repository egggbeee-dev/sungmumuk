document.addEventListener("DOMContentLoaded", () => {



  // header_footer.html을 불러와 동적으로 삽입
  fetch("header_footer.html")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then((data) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(data, "text/html");

      const headerPlaceholder = document.getElementById("header-placeholder");
      const footerPlaceholder = document.getElementById("footer-placeholder");

      const header = doc.querySelector("header");
      const footer = doc.querySelector("footer");

      if (header && headerPlaceholder) {
        headerPlaceholder.innerHTML = header.outerHTML;
      }

      if (footer && footerPlaceholder) {
        footerPlaceholder.innerHTML = footer.outerHTML;
      }

      // 실제 로그인 상태 확인
      checkLoginStatus();

      //mobile 메뉴
      let menuBtn = document.querySelectorAll(".mobile-menu__step1");
      let menuBtnStep2 = document.querySelectorAll(".mobile-menu__step2");
      let mobileMenuBtn = document.querySelector(".menu");
      let mobileMenuList = document.querySelector(".mobile-menu__list");
      let body = document.querySelector("body");

      for (let i = 0; i < menuBtn.length; i++) {
        const m = menuBtn[i];
        m.addEventListener("click", () => {
          menuBtn.forEach((e) => {
            if (e == m) {
              e.classList.toggle("is-open");
            } else {
              e.classList.remove("is-open");
            }
          });
        });
      }
      for (let i = 0; i < menuBtnStep2.length; i++) {
        const m = menuBtnStep2[i];
        m.addEventListener("click", () => {
          menuBtnStep2.forEach((e) => {
            if (e == m) {
              e.classList.toggle("is-open");
            } else {
              e.classList.remove("is-open");
            }
          });
        });
      }

      mobileMenuBtn.addEventListener("click", () => {
        if (mobileMenuList.classList.contains("is-open")) {
          menuBtn.forEach((e) => {
            e.classList.remove("is-open");
          });
        }
        mobileMenuList.classList.toggle("is-open");
        body.classList.toggle("is-hidden");
        mobileMenuBtn.classList.toggle("is-open");
      });
    })
    .catch((error) => {
      console.error("Error loading header_footer.html:", error);
    });
});

// 로그인 상태 확인 함수
function checkLoginStatus() {
  fetch("/auth/status") // 서버의 API 엔드포인트
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      updateLoginStatus(data.loggedIn, data.user ? data.user.nickname : null);
    })
    .catch((error) => {
      console.error("Error checking login status:", error);
      const userStatus = document.getElementById("user-status");
      if (userStatus) {
        userStatus.textContent = "로그인 상태를 확인할 수 없습니다.";
      }
    });
}

// 로그인 상태 업데이트 함수
function updateLoginStatus(isLoggedIn, nickname) {
  const userStatus = document.getElementById("user-status");
  const loginLogout = document.getElementById("login-logout");
  const loginLogoutMobile = document.getElementById("login-logout-mobile");

  if (userStatus && loginLogout) {
    if (isLoggedIn) {
      userStatus.textContent = `안녕하세요! ${nickname}님이 로그인 중입니다.`;
      loginLogout.innerHTML = `<a href="#" class="logout-link">로그아웃</a>`;
      loginLogoutMobile.innerHTML = `<a href="#" class="mobile-menu__step2 logout-link">로그아웃</a>`;
      addLogoutEvent(); // 로그아웃 이벤트 추가
    } else {
      userStatus.textContent = `더 많은 기능을 이용하려면 로그인이 필요합니다.`;
      loginLogout.innerHTML = `<a href="login.html">로그인</a>`;
      loginLogoutMobile.innerHTML = `<a href="login.html" id="login-logout-mobile" class="mobile-menu__step2">로그인</a>`;
    }
  } else {
    console.error("User status or login/logout element not found in DOM.");
  }
}

// 로그아웃 이벤트 추가
function addLogoutEvent() {
  const logoutLink = document.querySelectorAll(".logout-link");
  if (logoutLink) {
    logoutLink.forEach((e) => {
      e.addEventListener("click", (event) => {
        event.preventDefault();
        performLogout();
      });
    });
  }
}

// 로그아웃 처리 함수
function performLogout() {
  fetch("/auth/logout", { method: "POST" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(() => {
      // 로그아웃 성공 시 UI 업데이트
      updateLoginStatus(false, "");
      location.reload(); // 필요 시 페이지 새로고침
    })
    .catch((error) => {
      console.error("Error during logout:", error);
    });
}

// 세션 갱신 함수 (선택적으로 호출)
function refreshSession() {
  fetch("/auth/refresh-session", { method: "POST" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("세션 갱신 성공:", data.message);
    })
    .catch((error) => {
      console.error("Error refreshing session:", error);
    });
}

// 주기적으로 세션 갱신 (15분 간격)
setInterval(() => {
  refreshSession();
}, 15 * 60 * 1000); // 15분마다 실행


document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector(".menu");
  const mobileMenu = document.querySelector(".mobile-menu");
  const body = document.body;

  if (menuButton && mobileMenu) {
    menuButton.addEventListener("click", () => {
      mobileMenu.classList.toggle("is-open");
      body.classList.toggle("is-hidden"); // 배경 스크롤 차단
    });
  } else {
    console.error("Menu button or mobile menu not found.");
  }
});
