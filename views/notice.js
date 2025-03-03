const fixedNotices = [
    {
        id: 'fixed-1',
        title: '[이벤트] 사용자 설문조사 참여 이벤트 안내',
        date: '2025-03-04',
        views: '-',
        link: 'fixed_notice_1.html'
    }
];

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
        const dbNotices = await response.json();

        renderNotices(dbNotices);  // 일반 공지 렌더링 (고정 공지보다 나중)
    } catch (error) {
        console.error('공지사항 불러오기 실패:', error);
    }
}

// 고정 공지 렌더링 (맨 위에 표시)
function renderFixedNotices() {
    const tbody = document.getElementById('notice-list');
    console.log("🔍 notice-list 요소 확인:", tbody); // 디버깅

    if (!tbody) return;  // 요소가 없으면 함수 종료

    fixedNotices.forEach(notice => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <a href="${notice.link}" class="notice-link" style="color: #7a69c4; font-weight: bold;">
                    ${notice.title}
                </a>
            </td>
            <td>${notice.date}</td>
            <td>${notice.views}</td>
        `;
        tbody.appendChild(tr);
    });
}

// 일반 공지 렌더링 (고정 공지 아래에 표시)
function renderNotices(notices) {
    const tbody = document.getElementById('notice-list');
    if (!tbody) return;

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

// 고정 공지를 먼저 렌더링하고, 일반 공지를 불러오는 방식
document.addEventListener('DOMContentLoaded', () => {
    renderFixedNotices();  // 먼저 고정 공지 렌더링
    fetchNotices();  // 그 다음 일반 공지 불러오기
});

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

document.querySelector('.search-btn').addEventListener('click', () => {
    const filter = document.querySelector('.search-filter').value;
    const keyword = document.querySelector('.search-input').value;

    const query = new URLSearchParams({ filter, keyword }).toString();

    location.href = `/notice.html?${query}`;  // URL에 검색어와 필터 추가
});
