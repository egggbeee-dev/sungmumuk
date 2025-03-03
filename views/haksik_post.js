let currentUserId = null; // 현재 로그인한 사용자 ID
let postAuthorId = null; // 게시글 작성자 ID

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("id");
  

  await checkAuthStatus();
  await loadPost(postId);
  await loadComments(postId);

  console.log("페이지 로드 후 currentUserId:", currentUserId);  // 확인 로그 추가
  console.log("페이지 로드 후 postAuthorId:", postAuthorId);  // 확인 로그 추가

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
      try {
          const response = await fetch(`/haksik/posts/${postId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content: newContent }),
          });
          if (response.ok) {
              alert("게시글이 수정되었습니다.");
              window.location.reload();
          } else {
              alert("게시글 수정에 실패했습니다.");
          }
      } catch (error) {
          console.error("수정 오류:", error);
      }
  });

  document.getElementById("delete-post-btn").addEventListener("click", async () => {
      const confirmDelete = confirm("정말 삭제하시겠습니까?");
      if (!confirmDelete) return;

      try {
          const response = await fetch(`/haksik/posts/${postId}`, {
              method: "DELETE",
          });
          if (response.ok) {
              alert("게시글이 삭제되었습니다.");
              window.location.href = "/haksik.html";
          } else {
              alert("게시글 삭제에 실패했습니다.");
          }
      } catch (error) {
          console.error("삭제 오류:", error);
      }
  });

  function showEditDeleteButtons() {
      console.log("showEditDeleteButtons() 호출 - currentUserId:", currentUserId, "postAuthorId:", postAuthorId);  // ✅ 확인 로그 추가
      if (currentUserId === postAuthorId) {
          document.getElementById("edit-delete-buttons").style.display = "block";
      } else {
          document.getElementById("edit-delete-buttons").style.display = "none";
      }
  }

  document.getElementById("submit-comment-btn").addEventListener("click", async () => {
      const content = document.getElementById("comment-input").value.trim();
      if (!content) {
          alert("댓글 내용을 입력하세요.");
          return;
      }
      await submitComment(postId, content);
  });
});

async function checkAuthStatus() {
  try {
      const response = await fetch("/auth/status");
      const authData = await response.json();
      if (authData.loggedIn) {
          currentUserId = authData.user.id;
          document.getElementById("comment-input").disabled = false;
          document.getElementById("submit-comment-btn").disabled = false;
      } else {
      }
  } catch (error) {
      console.error("로그인 상태 확인 오류:", error);
  }
}

      async function loadPost(postId) {
        try {
          const response = await fetch(`/haksik/posts/${postId}`);
          const post = await response.json();

          console.log(post); // 전체 post 객체 확인
          console.log(post.image_url); // 이미지 URL 확인

          document.getElementById("post-title").textContent = post.title;
          document.getElementById(
            "post-author"
          ).textContent = `작성자: ${post.author}`;
          document.getElementById("post-content").textContent = post.content;
          document.getElementById("post-date").textContent = new Date(
            post.created_at
          ).toLocaleString();
          document.getElementById("post-category").textContent = post.category;

          postAuthorId = post.user_id;

          if (post.image_url) {
            const postImage = document.getElementById("post-image");
            postImage.src = post.image_url; // 서버에서 반환된 이미지 경로
            postImage.style.display = "block";
          } else {
            console.warn("이미지 URL이 존재하지 않습니다.");
          }
        } catch (error) {
          console.error("게시글 데이터 로드 오류:", error);
        }
      }

      async function loadComments(postId) {
        try {
          const response = await fetch(`/haksik/posts/${postId}/comments`);
          const comments = await response.json();

          const commentsList = document.getElementById("comments-list");
          commentsList.innerHTML = "";

          if (comments.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.textContent =
              "댓글이 없습니다. 첫 댓글을 작성해보세요!";
            commentsList.appendChild(emptyMessage);
          } else {
            comments.forEach((comment) => {
              const commentDiv = document.createElement("div");
              commentDiv.classList.add("comment");
              commentDiv.id = `comment-${comment.comment_id}`;
              commentDiv.innerHTML = `
                            <p>${comment.content} - 작성자: ${
                comment.author || "익명"
              } (${new Date(comment.created_at).toLocaleString()})</p>
                            <button onclick="likeComment(${
                              comment.comment_id
                            })">👍 <span class="like-count">${
                comment.likes || 0
              }</span></button>
                        `;
              commentsList.appendChild(commentDiv);
            });
          }
        } catch (error) {
          console.error("댓글 로드 오류:", error);
        }
      }

      async function submitComment(postId, content) {
        try {
          const response = await fetch(`/haksik/posts/${postId}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
          });
          if (response.ok) {
            alert("댓글이 작성되었습니다.");
            document.getElementById("comment-input").value = "";
            await loadComments(postId);
          } else {
            alert("댓글 작성에 실패했습니다.");
          }
        } catch (error) {
          console.error("댓글 작성 오류:", error);
        }
      }

      async function likeComment(commentId) {
        try {
          const response = await fetch(`/haksik/comments/${commentId}/like`, {
            method: "POST",
          });
          if (response.ok) {
            const likeCountElement = document.querySelector(
              `#comment-${commentId} .like-count`
            );
            if (likeCountElement) {
              const currentCount = parseInt(likeCountElement.textContent);
              likeCountElement.textContent = currentCount + 1;
            }
            alert("좋아요가 추가되었습니다.");
          } else {
            alert("좋아요 처리에 실패했습니다.");
          }
        } catch (error) {
          console.error("좋아요 처리 오류:", error);
        }
      }

  //게시글 좋아요
  document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get("id");
  
    const likeBtn = document.getElementById("like-btn");
    const likeCountSpan = document.getElementById("like-count");
  
    await updateLikeUI(postId); // 초기 좋아요 상태 체크
  
    likeBtn.addEventListener("click", async () => {
      try {
        const response = await fetch(`/haksik/posts/${postId}/like`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
  
        if (response.ok) {
          await updateLikeUI(postId); // 좋아요 상태 업데이트
        } else {
          alert("좋아요 요청 실패");
        }
      } catch (error) {
        console.error("좋아요 처리 오류:", error);
      }
    });
  });
  
  // 좋아요 UI 업데이트 함수
  async function updateLikeUI(postId) {
    try {
      // 좋아요 개수 가져오기
      const likeCountResponse = await fetch(`/haksik/posts/${postId}/like/count`);
      const likeCountData = await likeCountResponse.json();
      document.getElementById("like-count").textContent = likeCountData.likeCount || 0;
  
      // 사용자의 좋아요 상태 확인
      const likeStatusResponse = await fetch(`/haksik/posts/${postId}/like/status`);
      const likeStatusData = await likeStatusResponse.json();
      const likeBtn = document.getElementById("like-btn");
  
      // 좋아요 여부에 따라 버튼 스타일 변경
      if (likeStatusData.liked) {
        likeBtn.innerHTML = "❤️ <span id='like-count'>" + likeCountData.likeCount + "</span>";
      } else {
        likeBtn.innerHTML = "🤍 <span id='like-count'>" + likeCountData.likeCount + "</span>";
      }
    } catch (error) {
      console.error("좋아요 UI 업데이트 오류:", error);
    }
  }
  
      