async function fetchNotices() {
    try {
        const response = await fetch('/notice');
        const notices = await response.json();
        renderNotices(notices);
    } catch (error) {
        console.error('공지사항 불러오기 실패:', error);
    }
}

function renderNotices(notices) {
    const tbody = document.getElementById('notice-list');
    tbody.innerHTML = '';

    notices.forEach(notice => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${notice.notice_id}</td>
            <td><a href="#">${notice.notice_title}</a></td>
            <td>${notice.date}</td>
            <td>${notice.views}</td>
        `;
        tbody.appendChild(tr);
    });
}

// 페이지 로드 시 공지사항 가져오기
fetchNotices();

async function checkAdmin() {
    try {
        const authResponse = await fetch('/auth/status');
        const authStatus = await authResponse.json();
        console.log("인증 상태 확인:", authStatus); // 🔍 확인 로그 추가
        
        if (authStatus.user && authStatus.user.isAdmin === 1) {
            const writeBtn = document.createElement('button');
            writeBtn.innerText = '글쓰기';
            writeBtn.classList.add('write-btn');
            writeBtn.onclick = () => location.href = '/write-notice.html';
            document.querySelector('.notice-container').prepend(writeBtn);
        }
    } catch (error) {
        console.error('관리자 체크 실패:', error);
    }
}

// 페이지 로드 시 관리자 체크
// 비동기 함수이기 때문에 즉시 실행 함수로 감싸는 게 안정적임
(async () => {
    await checkAdmin();
})();

