document.getElementById('write-form').onsubmit = async function (e) {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;

    const authResponse = await fetch('/auth/status');
    const authStatus = await authResponse.json();

    if (!authStatus.user || authStatus.user.isAdmin !== 1) {
        alert('관리자만 작성 가능합니다.');
        return;
    }

    const response = await fetch('/notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
    });

    if (response.ok) {
        alert('공지사항이 작성되었습니다.');
        location.href = '/notice.html';
    } else {
        const errorData = await response.json();
        alert(`작성 실패: ${errorData.message}`);
    }
};
