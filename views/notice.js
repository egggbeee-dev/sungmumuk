async function fetchNotices() {
    const params = new URLSearchParams(location.search);
    const filter = params.get('filter');
    const keyword = params.get('keyword');

    let url = '/notice';
    if (filter && keyword) {
        url += `?filter=${encodeURIComponent(filter)}&keyword=${encodeURIComponent(keyword)}`;
    }

    try {
        const response = await fetch(url);
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
            <td><a href="/notice_detail.html?id=${notice.notice_id}" class="notice-link">${notice.notice_title}</a></td>
            <td>${notice.date}</td>
            <td>${notice.views}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function checkAdmin() {
    try {
        const authResponse = await fetch('/auth/status', {
            credentials: 'include'  // 세션 쿠키 포함
        });
        const authStatus = await authResponse.json();
        console.log("인증 상태 확인:", authStatus);

        if (authStatus.user && authStatus.user.isAdmin === 1) {
            const writeBtn = document.createElement('button');
            writeBtn.innerText = '글쓰기';
            writeBtn.classList.add('write-btn');
            writeBtn.onclick = () => location.href = '/write_notice.html';

            const container = document.querySelector('.notice-container');
            if (container) {
                container.prepend(writeBtn);
            } else {
                console.error('.notice-container 요소가 없습니다.');
            }
        }
    } catch (error) {
        console.error('관리자 체크 실패:', error);
    }
}

// DOM 준비 후 실행
document.addEventListener('DOMContentLoaded', async () => {
    await checkAdmin();
    fetchNotices();
});

document.querySelector('.search-btn').addEventListener('click', () => {
    const filter = document.querySelector('.search-filter').value;
    const keyword = document.querySelector('.search-input').value;

    const query = new URLSearchParams({ filter, keyword }).toString();

    location.href = `/notice.html?${query}`;  // URL에 검색어와 필터 추가
});
