document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const noticeId = params.get('id');

    if (!noticeId) {
        alert('잘못된 접근입니다.');
        window.location.href = '/notice.html';
        return;
    }

    try {
        const response = await fetch(`/notice/${noticeId}`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error('공지사항 정보를 불러오는데 실패했습니다.');
        }

        const notice = await response.json();

        document.getElementById('notice-title').innerText = notice.title;
        document.getElementById('notice-date').innerText = notice.date;
        document.getElementById('notice-views').innerText = notice.views;
        document.getElementById('notice-content').innerText = notice.content;

    } catch (error) {
        console.error('공지사항 불러오기 실패:', error);
        alert('공지사항 정보를 불러오는데 실패했습니다.');
        window.location.href = '/notice.html';
    }
});

function goBack() {
    window.location.href = '/notice.html';
}
