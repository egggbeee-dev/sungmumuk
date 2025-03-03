document.addEventListener('DOMContentLoaded', async function () {
  const postList = document.getElementById('post-list');
  const newPostBtn = document.getElementById('new-post-btn');
  const newPostForm = document.getElementById('new-post-form');
  const newPostTitle = document.getElementById('new-post-title');
  const newPostContent = document.getElementById('new-post-content');
  const newPostImage = document.getElementById('new-post-image');
  const submitPostBtn = document.getElementById('submit-post');
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const loginMessage = document.getElementById('login-message');
  const filterSelect = document.getElementById('post-category');  // 필터 선택 요소

  let posts = [];
  let isLoggedIn = false;
  let currentUserId = null;

  // 초기화
  await checkAuthStatus();
  await loadPosts();  // 최신순 기본 로드

  // 필터 변경 이벤트
  filterSelect.addEventListener('change', async function () {
      await loadPosts(filterSelect.value);
  });

  // 검색 버튼 이벤트
  searchBtn.addEventListener('click', searchPosts);
  searchInput.addEventListener('keyup', function (event) {
      if (event.key === 'Enter') {
          searchPosts();
      }
  });

  // 글 작성 이벤트
  submitPostBtn.addEventListener('click', submitPost);

  // 로그인 상태 확인
  async function checkAuthStatus() {
    try {
        const response = await fetch('/auth/status');
        const authStatus = await response.json();

        if (authStatus.loggedIn) {
            isLoggedIn = true;
            currentUserId = authStatus.user.id;
            enablePostActions();
            loginMessage.style.display = 'none';
        } else {
            isLoggedIn = false;
            currentUserId = null;  // 로그인 안한 상태에서도 페이지 보이게 초기화

            const userResponse = confirm("학식 게시판은 로그인 후 이용 가능합니다.\n로그인 페이지로 이동하시겠습니까?");
            if (userResponse) {
                window.location.href = "/login.html"; // 로그인 페이지로 이동
            } else {
                window.history.back(); // 이전 페이지로 이동
            }

            disablePostActions();
        }
    } catch (error) {
        console.error('로그인 상태 확인 오류:', error);
    }
}

  // 로그인 시 기능 활성화
  function enablePostActions() {
      newPostBtn.style.display = 'block';
      submitPostBtn.disabled = false;
      newPostTitle.disabled = false;
      newPostContent.disabled = false;
      newPostImage.disabled = false;
  }

  // 비로그인 시 기능 비활성화
  function disablePostActions() {
      newPostBtn.style.display = 'none';
      submitPostBtn.disabled = true;
      newPostTitle.disabled = true;
      newPostContent.disabled = true;
      newPostImage.disabled = true;
  }

  // 게시글 목록 불러오기 (필터 값 추가)
  async function loadPosts(filter = "") {
      try {
          const response = await fetch(`/haksik/posts?filter=${filter}`);
          const data = await response.json();

          posts = data.map(post => ({
              id: post.post_id,
              title: post.title,
              content: post.content,
              image: post.image_url || '',
              isExpanded: false,
              category: post.category || '[카테고리]',
              userId: post.user_id,
              likeCount: post.like_count || 0
          }));

          renderPosts();
      } catch (error) {
          console.error('게시물 로드 오류:', error);
          alert('게시물을 불러오는 중 오류가 발생했습니다.');
      }
  }

  // 게시글 렌더링
  function renderPosts() {
    postList.innerHTML = '';

    if (posts.length === 0) {
        postList.innerHTML = "<p>게시글이 없습니다.</p>";
        return;
    }

    posts.forEach(post => {
        const postDiv = document.createElement('div');
        postDiv.classList.add('post');

        const titleLink = document.createElement('a');
        titleLink.href = `/haksik_post.html?id=${post.id}`;
        titleLink.innerHTML = `<span style="color: #8a63d2;">${post.category}</span> 
                               <span style="color: black;">${post.title}</span>`;
        titleLink.style.textDecoration = 'none';
        titleLink.style.cursor = 'pointer';
        postDiv.appendChild(titleLink);

        const contentDiv = document.createElement('div');
        contentDiv.textContent = post.content.slice(0, 100) + "...";
        postDiv.appendChild(contentDiv);

        const likeCountDiv = document.createElement('div');
        likeCountDiv.textContent = `❤️ ${post.likeCount}`;
        postDiv.appendChild(likeCountDiv);

        postList.appendChild(postDiv);
    });
}

  function postLinkStyle(link) {
      link.style.textDecoration = 'none';
      link.style.cursor = 'pointer';
  }

  async function submitPost() {
      const title = newPostTitle.value.trim();
      const content = newPostContent.value.trim();
      const image = newPostImage.files[0];

      if (!title || !content) {
          alert('제목과 내용을 입력하세요.');
          return;
      }

      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      if (image) formData.append('image', image);

      try {
          const response = await fetch('/haksik_new/posts', {
              method: 'POST',
              body: formData,
          });

          if (!response.ok) throw new Error('게시물 저장 실패');

          await loadPosts(filterSelect.value);  // 작성 후 필터 적용 유지
      } catch (error) {
          console.error('게시물 저장 오류:', error);
          alert('게시물 저장 중 오류가 발생했습니다.');
      }
  }

  async function editPost(post) {
      const newContent = prompt('수정할 내용을 입력하세요:', post.content);
      if (!newContent) return;

      try {
          const response = await fetch(`/haksik/posts/${post.id}`, {
              method: 'PUT',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({content: newContent}),
          });

          if (response.ok) {
              alert('게시글이 수정되었습니다.');
              await loadPosts(filterSelect.value);
          } else {
              alert('게시글 수정에 실패했습니다.');
          }
      } catch (error) {
          console.error('게시글 수정 오류:', error);
      }
  }

  async function deletePost(postId) {
      if (!confirm('정말 삭제하시겠습니까?')) return;

      try {
          const response = await fetch(`/haksik/posts/${postId}`, {method: 'DELETE'});
          if (response.ok) {
              alert('게시글이 삭제되었습니다.');
              await loadPosts(filterSelect.value);
          } else {
              alert('게시글 삭제에 실패했습니다.');
          }
      } catch (error) {
          console.error('게시글 삭제 오류:', error);
      }
  }

  async function searchPosts() {
      const query = searchInput.value.trim();
      if (!query) {
          alert('검색어를 입력하세요.');
          return;
      }

      try {
        const response = await fetch(`/haksik/search?query=${encodeURIComponent(query)}`);
        const results = await response.json();

        // 검색 결과도 posts 형식과 동일하게 매핑
        posts = results.map(post => ({
            id: post.post_id,
            title: post.title,
            content: post.content,
            image: post.image_url || '',
            category: post.category || '[카테고리]',
            likeCount: post.like_count || 0,  // ⭐️ 이 부분 추가
            userId: post.user_id
        }));

        renderPosts();
    } catch (error) {
        console.error('검색 오류:', error);
        alert('검색 중 오류가 발생했습니다.');
    }
}
});

document.addEventListener("DOMContentLoaded", function () {
  const messageBox = document.getElementById("site-message");
  const closeBtn = document.getElementById("close-message");
  const hideTodayBtn = document.getElementById("hide-today");

  // localStorage에서 'hideMessage' 값 확인 (값이 있으면 숨기기)
  if (localStorage.getItem("hideMessage") === "true") {
    messageBox.style.display = "none";
  }

  // X 버튼 클릭 시 메시지 창 닫기 (이번만 닫힘)
  closeBtn.addEventListener("click", function () {
    messageBox.style.display = "none";
  });

  // "오늘은 더 이상 보지 않기" 클릭 시 하루 동안 숨기기
  hideTodayBtn.addEventListener("click", function () {
    localStorage.setItem("hideMessage", "true"); // 로컬스토리지에 숨김 설정 저장
    messageBox.style.display = "none"; // 메시지 숨김
  });
});

// 페이지네이션 버튼 렌더링
function renderPagination(totalPosts) {
    pagination.innerHTML = ""; // 기존 페이지 버튼들 삭제
    const totalPages = Math.ceil(totalPosts / postsPerPage);

    // '맨 처음 페이지로 이동' 버튼
    const firstPageBtn = document.createElement("button");
    firstPageBtn.textContent = "<<";
    firstPageBtn.addEventListener("click", function () {
    currentPage = 1;
    loadPosts(currentPage);
    });
    pagination.appendChild(firstPageBtn);

    // '이전 페이지' 버튼
    const prevPageBtn = document.createElement("button");
    prevPageBtn.textContent = "<";
    prevPageBtn.addEventListener("click", function () {
      if (currentPage > 1) {
          currentPage--;
          loadPosts(currentPage);
        }
      });
    pagination.appendChild(prevPageBtn);

      // 페이지 번호 버튼들 (10페이지씩 보이게 수정)
    const startPage = Math.floor((currentPage - 1) / 10) * 10 + 1; // 시작 페이지 번호
    const endPage = Math.min(startPage + 9, totalPages); // 끝 페이지 번호 (최대 10페이지)

    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement("button");
      pageBtn.textContent = i;

      // 버튼 스타일 설정

      prevPageBtn.style.margin = "0 3px";
      pageBtn.style.width = "40px"; // 버튼 크기 고정
      pageBtn.style.margin = "0 5px"; // 버튼 간 여백 추가
      pageBtn.style.display = "flex"; // 중앙 정렬을 위해 flex 사용
      pageBtn.style.alignItems = "center"; // 수직 중앙 정렬
      pageBtn.style.justifyContent = "center"; // 수평 중앙 정렬
      pageBtn.style.padding = "5px 10px"; // 패딩 추가
      pageBtn.style.fontSize = "16px"; // 글자 크기 설정

      // 현재 페이지는 색상 변경
      if (i === currentPage) {
        pageBtn.style.backgroundColor = "#8E89F6"; // 진한 색상
        pageBtn.style.color = "#fff"; // 텍스트 색상 변경
        pageBtn.style.fontWeight = "bold"; // 글자 두껍게
      }

      pageBtn.addEventListener("click", function () {
        currentPage = i;
        loadPosts(currentPage);
      });
      pagination.appendChild(pageBtn);
    }

    // '다음 페이지' 버튼
    const nextPageBtn = document.createElement("button");
    nextPageBtn.textContent = ">";
    nextPageBtn.addEventListener("click", function () {
      if (currentPage < totalPages) {
        currentPage++;
        loadPosts(currentPage);
      }
    });
    pagination.appendChild(nextPageBtn);

    // '마지막 페이지로 이동' 버튼
    const lastPageBtn = document.createElement("button");
    lastPageBtn.textContent = ">>";
    lastPageBtn.addEventListener("click", function () {
      currentPage = totalPages;
      loadPosts(currentPage);
    });
    pagination.appendChild(lastPageBtn);

    // 페이지네이션 바 스타일을 가로로 설정
    pagination.style.display = "flex";
    pagination.style.justifyContent = "center"; // 버튼들을 가로로 중앙 정렬
    pagination.style.alignItems = "center"; // 수직 중앙 정렬
    lastPageBtn.style.margin = "0 3px";
  }