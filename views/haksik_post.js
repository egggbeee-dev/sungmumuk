let currentUserId = null; // 현재 로그인한 사용자 ID
let postAuthorId = null;  // 게시글 작성자 ID

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get("id");

    await checkAuthStatus();
    await loadPost(postId);
    await loadComments(postId);
    await updateLikeUI(postId); // 좋아요 상태 초기화

    console.log("currentUserId:", currentUserId, "postAuthorId:", postAuthorId);

    showEditDeleteButtons();

    document.getElementById("edit-post-btn").addEventListener("click", () => {
        document.getElementById("edit-post-form").style.display = "block";
        document.getElementById("edit-post-content").value = 
            document.getElementById("post-content").textContent;
    });

    document.getElementById("save-edit-btn").addEventListener("click", async () => {
        const newContent = document.getElementById("edit-post-content").value.trim();
        if (!newContent) {
            alert("내용을 입력하세요.");
            return;
        }
        await updatePost(postId, newContent);
    });

    document.getElementById("delete-post-btn").addEventListener("click", async () => {
        if (confirm("정말 삭제하시겠습니까?")) {
            await deletePost(postId);
        }
    });

    document.getElementById("submit-comment-btn").addEventListener("click", async () => {
        const content = document.getElementById("comment-input").value.trim();
        if (content) {
            await submitComment(postId, content);
        } else {
            alert("댓글 내용을 입력하세요.");
        }
    });

    document.getElementById("like-btn").addEventListener("click", async () => {
        await toggleLike(postId);
        await updateLikeUI(postId);
    });
});

async function checkAuthStatus() {
    try {
        const response = await fetch("/auth/status");
        const authData = await response.json();
        currentUserId = authData.loggedIn ? authData.user.id : null;

        document.getElementById("comment-input").disabled = !authData.loggedIn;
        document.getElementById("submit-comment-btn").disabled = !authData.loggedIn;
    } catch (error) {
        console.error("로그인 상태 확인 오류:", error);
    }
}

async function loadPost(postId) {
    try {
        const response = await fetch(`/haksik/posts/${postId}`);
        const post = await response.json();

        document.getElementById("post-title").textContent = post.title;
        document.getElementById("post-author").textContent = `작성자: ${post.author}`;
        document.getElementById("post-category").textContent = post.category;
        document.getElementById("post-content").innerHTML = post.content.replace(/\n/g, '<br>');
        document.getElementById("post-date").textContent = new Date(post.created_at).toLocaleString();

        if (post.image_url) {
            const postImage = document.getElementById("post-image");
            postImage.src = post.image_url;
            postImage.style.display = "block";
        }

        postAuthorId = post.user_id;
        showEditDeleteButtons();
    } catch (error) {
        console.error("게시글 로드 오류:", error);
    }
}

function showEditDeleteButtons() {
    const editDeleteSection = document.getElementById("edit-delete-buttons");
    editDeleteSection.style.display = (currentUserId === postAuthorId) ? "flex" : "none";
}

async function updatePost(postId, content) {
    try {
        const response = await fetch(`/haksik/posts/${postId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content })
        });
        if (response.ok) {
            alert("게시글이 수정되었습니다.");
            window.location.reload();
        } else {
            alert("게시글 수정에 실패했습니다.");
        }
    } catch (error) {
        console.error("게시글 수정 오류:", error);
    }
}

async function deletePost(postId) {
    try {
        const response = await fetch(`/haksik/posts/${postId}`, { method: "DELETE" });
        if (response.ok) {
            alert("게시글이 삭제되었습니다.");
            window.location.href = "/haksik.html";
        } else {
            alert("게시글 삭제에 실패했습니다.");
        }
    } catch (error) {
        console.error("게시글 삭제 오류:", error);
    }
}

async function loadComments(postId) {
    try {
        const response = await fetch(`/haksik/posts/${postId}/comments`);
        const comments = await response.json();
        const commentsList = document.getElementById("comments-list");

        commentsList.innerHTML = comments.length === 0 
            ? "<p class='no-comments'>댓글이 없습니다. 첫 댓글을 작성해보세요!</p>"
            : comments.map(comment => createCommentHTML(comment)).join('');
    } catch (error) {
        console.error("댓글 로드 오류:", error);
    }
}

function createCommentHTML(comment) {
    const isOwner = currentUserId === comment.user_id;
    return `
        <div class="comment" id="comment-${comment.comment_id}">
            <p>${comment.content} - <strong>${comment.author || "익명"}</strong> (${new Date(comment.created_at).toLocaleString()})</p>
            <div class="comment-actions">
                <button class="like-comment-btn" onclick="likeComment(${comment.comment_id})">👍 <span class="like-count">${comment.likes || 0}</span></button>
                ${isOwner ? `<button class="delete-comment-btn" onclick="deleteComment(${comment.comment_id})">🗑️</button>` : ""}
            </div>
        </div>
    `;
}

async function submitComment(postId, content) {
    try {
        const response = await fetch(`/haksik/posts/${postId}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content })
        });
        if (response.ok) {
            document.getElementById("comment-input").value = "";
            await loadComments(postId);
        } else {
            alert("댓글 작성 실패");
        }
    } catch (error) {
        console.error("댓글 작성 오류:", error);
    }
}

async function deleteComment(commentId) {
    if (confirm("정말 삭제하시겠습니까?")) {
        try {
            const response = await fetch(`/haksik/comments/${commentId}`, { method: "DELETE" });
            if (response.ok) {
                document.getElementById(`comment-${commentId}`).remove();
            } else {
                alert("댓글 삭제 실패");
            }
        } catch (error) {
            console.error("댓글 삭제 오류:", error);
        }
    }
}

async function likeComment(commentId) {
    try {
        await fetch(`/haksik/comments/${commentId}/like`, { method: "POST" });
        await loadComments(postId); // 최신 좋아요 수 반영
    } catch (error) {
        console.error("댓글 좋아요 오류:", error);
    }
}

async function toggleLike(postId) {
    try {
        await fetch(`/haksik/posts/${postId}/like`, { method: "POST" });
    } catch (error) {
        console.error("게시글 좋아요 오류:", error);
    }
}

async function updateLikeUI(postId) {
    try {
        const likeCountRes = await fetch(`/haksik/posts/${postId}/like/count`);
        const { likeCount } = await likeCountRes.json();
        document.getElementById("like-count").textContent = likeCount;

        const likeStatusRes = await fetch(`/haksik/posts/${postId}/like/status`);
        const { liked } = await likeStatusRes.json();
        document.getElementById("like-btn").innerHTML = liked 
            ? `❤️ <span id="like-count">${likeCount}</span>`
            : `🤍 <span id="like-count">${likeCount}</span>`;
    } catch (error) {
        console.error("좋아요 UI 업데이트 오류:", error);
    }
}
