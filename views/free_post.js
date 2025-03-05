let currentUserId = null;  // 현재 로그인한 사용자 ID
let postAuthorId = null;   // 현재 게시글 작성자 ID
let postId = null;         // 현재 게시글 ID

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    postId = urlParams.get("id");

    await checkAuthStatus();
    await loadPost();
    await loadComments();
    showEditDeleteButtons();
    attachPostButtonHandlers();  // 수정/삭제 버튼 이벤트 연결

    await updateLikeUI();  // 좋아요 초기 상태 불러오기

    // 좋아요 버튼 클릭 이벤트
    document.getElementById("like-btn").addEventListener("click", async () => {
        await toggleLike();
        await updateLikeUI();
    });
});

// 로그인 상태 확인
async function checkAuthStatus() {
    const response = await fetch("/auth/status");
    const authData = await response.json();
    if (authData.loggedIn) {
        currentUserId = authData.user.id;
    }
}

// 게시글 정보 불러오기
async function loadPost() {
    const response = await fetch(`/free/posts/${postId}`);
    const post = await response.json();

    document.getElementById("post-title").textContent = post.title;
    document.getElementById("post-author").textContent = `작성자: ${post.author}`;
    document.getElementById("post-category").textContent = post.category;
    document.getElementById("post-content").innerHTML = post.content.replace(/\n/g, '<br>');
    document.getElementById("post-date").textContent = new Date(post.created_at).toLocaleString('ko-KR');

    if (post.image_url) {
        const postImage = document.getElementById("post-image");
        postImage.src = post.image_url;
        postImage.style.display = "block";
    }

    postAuthorId = post.user_id;
}

// 수정/삭제 버튼 보이기 여부 처리
function showEditDeleteButtons() {
    if (currentUserId === postAuthorId) {
        document.getElementById("edit-delete-buttons").style.display = "flex";
    } else {
        document.getElementById("edit-delete-buttons").style.display = "none";
    }
}

// 수정/삭제 버튼 이벤트 연결
function attachPostButtonHandlers() {
    const editBtn = document.getElementById("edit-post-btn");
    const deleteBtn = document.getElementById("delete-post-btn");
    const saveEditBtn = document.getElementById("save-edit-btn");
    const cancelEditBtn = document.getElementById("cancel-edit-btn");

    editBtn.onclick = startEditing;
    deleteBtn.onclick = deletePost;
    saveEditBtn.onclick = saveEditedPost;
    cancelEditBtn.onclick = cancelEditing;
}

// 게시글 좋아요 상태 및 개수 불러오기
async function updateLikeUI() {
    try {
        const countRes = await fetch(`/free/posts/${postId}/like/count`);
        const { likeCount } = await countRes.json();
        document.getElementById("like-count").textContent = likeCount;

        const statusRes = await fetch(`/free/posts/${postId}/like/status`);
        const { liked } = await statusRes.json();

        const likeBtn = document.getElementById("like-btn");
        likeBtn.innerHTML = liked 
            ? `❤️ <span id="like-count">${likeCount}</span>` 
            : `🤍 <span id="like-count">${likeCount}</span>`;
    } catch (error) {
        console.error("좋아요 UI 업데이트 오류:", error);
    }
}

// 게시글 좋아요 추가/취소
async function toggleLike() {
    try {
        const response = await fetch(`/free/posts/${postId}/like`, { method: "POST" });
        if (!response.ok) {
            alert("좋아요 처리 실패");
        }
    } catch (error) {
        console.error("좋아요 처리 오류:", error);
    }
}

// 수정 모드 진입
function startEditing() {
    document.getElementById("edit-post-title").value = document.getElementById("post-title").textContent;
    document.getElementById("edit-post-content").value = document.getElementById("post-content").innerText;

    document.getElementById("post-title").style.display = "none";
    document.getElementById("post-content").style.display = "none";
    document.getElementById("edit-post-title").style.display = "block";
    document.getElementById("edit-post-content").style.display = "block";

    document.getElementById("edit-delete-buttons").style.display = "none";
    document.getElementById("edit-buttons").style.display = "flex";
}

// 수정 취소
function cancelEditing() {
    document.getElementById("edit-post-title").style.display = "none";
    document.getElementById("edit-post-content").style.display = "none";
    document.getElementById("post-title").style.display = "block";
    document.getElementById("post-content").style.display = "block";

    document.getElementById("edit-buttons").style.display = "none";
    document.getElementById("edit-delete-buttons").style.display = "flex";
}

// 게시글 수정 저장
async function saveEditedPost() {
    const newTitle = document.getElementById("edit-post-title").value.trim();
    const newContent = document.getElementById("edit-post-content").value.trim();

    await fetch(`/free/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, content: newContent })
    });

    window.location.reload();
}

// 게시글 삭제
async function deletePost() {
    if (confirm("정말 삭제하시겠습니까?")) {
        await fetch(`/free/posts/${postId}`, { method: "DELETE" });
        window.location.href = "/free.html";
    }
}

// 댓글 불러오기
async function loadComments() {
    const response = await fetch(`/free/posts/${postId}/comments`);
    const comments = await response.json();

    const commentsList = document.getElementById("comments-list");
    commentsList.innerHTML = "";

    if (comments.length === 0) {
        commentsList.innerHTML = "<p>댓글이 없습니다.</p>";
        return;
    }

    comments.forEach(comment => {
        const commentDiv = document.createElement("div");
        commentDiv.classList.add("comment");

        commentDiv.innerHTML = `
            <p><strong>${comment.author}</strong> - ${new Date(comment.created_at).toLocaleString('ko-KR')}</p>
            <p>${comment.content}</p>
            <div class="comment-actions">
                <button class="like-comment-btn" onclick="likeComment(${comment.comment_id})">👍 ${comment.likes}</button>
                ${currentUserId === comment.user_id ? `<button class="delete-comment-btn" onclick="deleteComment(${comment.comment_id})">🗑️</button>` : ""}
            </div>
        `;
        commentsList.appendChild(commentDiv);
    });
}

// 댓글 작성
async function submitComment() {
    const content = document.getElementById("comment-input").value.trim();
    if (!content) return alert("댓글 내용을 입력하세요.");

    await fetch(`/free/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
    });
    await loadComments();
}

// 댓글 삭제
async function deleteComment(commentId) {
    if (confirm("댓글을 삭제하시겠습니까?")) {
        await fetch(`/free/comments/${commentId}`, { method: "DELETE" });
        await loadComments();
    }
}

// 댓글 좋아요
async function likeComment(commentId) {
    await fetch(`/free/comments/${commentId}/like`, { method: "POST" });
    await loadComments();
}
