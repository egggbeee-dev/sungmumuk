document.addEventListener('DOMContentLoaded', function () {
    const postList = document.getElementById('post-list');
    const newPostBtn = document.getElementById('new-post-btn');
    const newPostForm = document.getElementById('new-post-form');
    const newPostTitle = document.getElementById('new-post-title');
    const newPostContent = document.getElementById('new-post-content');
    const newPostImage = document.getElementById('new-post-image');
    const submitPostBtn = document.getElementById('submit-post');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const loginMessage = document.getElementById('login-message'); // 로그인 안내 메시지

    let posts = []; // 게시물 저장소
    let isLoggedIn = false; // 사용자 로그인 상태

    /* 사용자 인증 상태 확인
    async function checkAuthStatus() {
        try {
            const response = await fetch('/auth/status');
            const data = await response.json();
            console.log('Auth Status:', data);

            if (data.loggedIn) {
                isLoggedIn = true;
                console.log('User is logged in:', data.user);
                enablePostActions(); // 사용자 동작 활성화
                loginMessage.style.display = 'none'; // 로그인 메시지 숨기기
            } else {
                isLoggedIn = false;
                console.log('User is not logged in');
                disablePostActions(); // 사용자 동작 비활성화
                loginMessage.style.display = 'block'; // 로그인 메시지 표시
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            alert('인증 상태 확인 중 오류가 발생했습니다.');
        }
    }
        */

    // 사용자 동작 활성화 (로그인 상태일 때)
    function enablePostActions() {
        newPostBtn.style.display = 'block';
        submitPostBtn.disabled = false;
        newPostTitle.disabled = false;
        newPostContent.disabled = false;
        newPostImage.disabled = false;
    }

    // 사용자 동작 비활성화 (비로그인 상태일 때)
    function disablePostActions() {
        newPostBtn.style.display = 'none';
        submitPostBtn.disabled = true;
        newPostTitle.disabled = true;
        newPostContent.disabled = true;
        newPostImage.disabled = true;
    }

    // 서버에서 게시물 가져오기
    async function loadPosts() {
        try {
            const response = await fetch('/free/posts'); // API 호출
            const data = await response.json();
            posts = data.map(post => ({
                id: post.post_id, // 게시글 ID 추가
                title: post.title,
                content: post.content,
                image: post.image_url || '', // 서버에서 가져온 이미지 URL
                isExpanded: false,
                category: post.category || '[카테고리]', // 카테고리 추가
            }));
            renderPosts(); // 게시물 렌더링
        } catch (error) {
            console.error('게시물 로드 오류:', error);
            alert('게시물을 로드하는 중 오류가 발생했습니다.');
        }
    }

    // 게시물 렌더링
    function renderPosts(filteredPosts = posts) {
        postList.innerHTML = ''; // 게시물 목록 초기화

        filteredPosts.forEach(post => {
            const postDiv = document.createElement('div');
            postDiv.classList.add('post');

            // 제목을 클릭하면 개별 게시글 페이지로 이동하도록 설정
            const titleLink = document.createElement('a');
            titleLink.href = `/free_post.html?id=${post.id}`; // 개별 게시글 페이지 링크
            titleLink.textContent = `${post.category} ${post.title}`;
            titleLink.style.color = 'blue'; // 링크 색상
            titleLink.style.textDecoration = 'none'; // 링크 밑줄 제거
            postDiv.appendChild(titleLink);

            const contentDiv = document.createElement('div');
            contentDiv.style.whiteSpace = 'pre-wrap'; // 줄바꿈 보이도록 설정
            contentDiv.textContent = post.isExpanded
                ? post.content
                : post.content.split('\n').slice(0, 3).join('\n'); // 처음 3줄만 표시
            postDiv.appendChild(contentDiv);

            if (post.image) {
                const imageElement = document.createElement('img');
                imageElement.src = post.image;
                imageElement.style.width = '100%';
                postDiv.appendChild(imageElement);
            }

            const readMoreBtn = document.createElement('button');
            readMoreBtn.textContent = post.isExpanded ? 'Read less' : 'Read more';
            readMoreBtn.addEventListener('click', function () {
                post.isExpanded = !post.isExpanded;
                renderPosts(filteredPosts); // 게시물 표시 상태 유지
            });
            postDiv.appendChild(readMoreBtn);

            postList.appendChild(postDiv);
        });
    }

    // 게시물 작성
    submitPostBtn.addEventListener('click', async function () {
        const newTitle = newPostTitle.value.trim();
        const newContent = newPostContent.value.trim();
        const newImage = newPostImage.files[0];

        if (!newTitle || !newContent) {
            alert('제목과 내용을 입력하세요.');
            return;
        }

        const formData = new FormData();
        formData.append('title', newTitle);
        formData.append('content', newContent);
        if (newImage) {
            formData.append('image', newImage);
        }

        try {
            const response = await fetch('/free/posts', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('게시물 저장 실패');

            const savedPost = await response.json(); // 서버에서 저장된 게시물 반환
            posts.push({
                id: savedPost.post_id, // 게시글 ID 추가
                title: savedPost.title,
                content: savedPost.content,
                image: savedPost.image_url || '',
                isExpanded: false,
                category: savedPost.category || '[카테고리]', // 카테고리 추가
            });

            newPostTitle.value = ''; // 제목 입력 필드 비우기
            newPostContent.value = ''; // 내용 입력 필드 비우기
            newPostImage.value = ''; // 이미지 입력 필드 비우기
            newPostForm.style.display = 'none'; // 작성 폼 숨기기
            renderPosts(); // 게시물 목록 갱신
        } catch (error) {
            console.error('게시물 저장 오류:', error);
            alert('게시물 저장 중 오류가 발생했습니다.');
        }
    });

    // 검색 기능 구현
async function searchPosts() {
    const searchTerm = searchInput.value.trim();

    if (!searchTerm) {
        alert('검색어를 입력하세요.');
        return;
    }

    try {
        // 서버로 검색 요청 보내기
        const response = await fetch(`/free/search?query=${encodeURIComponent(searchTerm)}`);
        if (!response.ok) {
            throw new Error('서버 응답 오류');
        }
        const results = await response.json();

        // 검색 결과 렌더링
        renderPosts(results); // 검색 결과에 맞는 게시물만 표시
    } catch (error) {
        console.error('검색 오류:', error);
        alert('검색 중 오류가 발생했습니다.');
    }
}

// 검색 버튼 클릭 시 검색 실행
searchBtn.addEventListener('click', function () {
    searchPosts();
});

// 엔터 키로 검색 실행
searchInput.addEventListener('keyup', function (event) {
    if (event.key === 'Enter') {
        searchPosts();
    }
});

    // 초기 실행
    //checkAuthStatus(); // 인증 상태 확인
    loadPosts(); // 서버에서 게시물 가져오기
});
