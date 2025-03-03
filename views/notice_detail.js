document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const noticeId = params.get('id');

    if (!noticeId) {
        alert('잘못된 접근입니다.');
        window.location.href = '/notice.html';
        return;
    }

    let noticeData = {};

    try {
        const response = await fetch(`/notice/${noticeId}`);
        if (!response.ok) throw new Error('공지사항 정보를 불러오는데 실패했습니다.');

        noticeData = await response.json();

        document.getElementById('notice-title').innerText = noticeData.title;
        document.getElementById('notice-date').innerText = noticeData.date;
        document.getElementById('notice-views').innerText = noticeData.views;
        document.getElementById('notice-content').innerText = noticeData.content;

        // 관리자 여부 체크하고 수정 버튼 추가
        checkAdmin(noticeId, noticeData);
    } catch (error) {
        console.error('공지사항 불러오기 실패:', error);
        alert('공지사항 정보를 불러오는데 실패했습니다.');
        window.location.href = '/notice.html';
    }
});

async function checkAdmin(noticeId, noticeData) {
    try {
        const authResponse = await fetch('/auth/status', { credentials: 'include' });
        const authStatus = await authResponse.json();

        if (authStatus.user && authStatus.user.isAdmin === 1) {
            addEditButton(noticeId, noticeData);
        }
    } catch (error) {
        console.error('관리자 체크 실패:', error);
    }
}

function addEditButton(noticeId, noticeData) {
    const adminActions = document.getElementById('admin-actions');

    // 수정 버튼
    const editButton = document.createElement('button');
    editButton.innerText = '수정하기';
    editButton.classList.add('btn-edit');
    editButton.onclick = () => toggleEditMode(true, noticeData);

    // 삭제 버튼
    const deleteButton = document.createElement('button');
    deleteButton.innerText = '삭제하기';
    deleteButton.classList.add('btn-delete');
    deleteButton.onclick = () => deleteNotice(noticeId);

    // 수정 완료 버튼 (인라인 수정용)
    const saveButton = document.createElement('button');
    saveButton.innerText = '수정 완료';
    saveButton.classList.add('btn-save');
    saveButton.style.display = 'none';
    saveButton.onclick = () => saveEdit(noticeId);

    adminActions.appendChild(editButton);
    adminActions.appendChild(deleteButton);
    adminActions.appendChild(saveButton);
}


function toggleEditMode(editMode, noticeData) {
    const titleElement = document.getElementById('notice-title');
    const contentElement = document.getElementById('notice-content');
    const editTitle = document.getElementById('edit-title');
    const editContent = document.getElementById('edit-content');
    const editButton = document.querySelector('.btn-edit');
    const saveButton = document.querySelector('.btn-save');

    if (editMode) {
        // 편집 모드 활성화
        editTitle.value = noticeData.title;
        editContent.value = noticeData.content;

        titleElement.style.display = 'none';
        contentElement.style.display = 'none';
        editTitle.style.display = 'block';
        editContent.style.display = 'block';
        editButton.style.display = 'none';
        saveButton.style.display = 'inline-block';
    } else {
        // 원래 뷰 모드로
        titleElement.innerText = editTitle.value;
        contentElement.innerText = editContent.value;

        titleElement.style.display = 'block';
        contentElement.style.display = 'block';
        editTitle.style.display = 'none';
        editContent.style.display = 'none';
        editButton.style.display = 'inline-block';
        saveButton.style.display = 'none';
    }
}

async function saveEdit(noticeId) {
    const updatedNotice = {
        title: document.getElementById('edit-title').value,
        content: document.getElementById('edit-content').value
    };

    try {
        const response = await fetch(`/notice/${noticeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedNotice)
        });

        if (response.ok) {
            alert('공지사항이 수정되었습니다.');
            toggleEditMode(false, updatedNotice);
        } else {
            alert('수정 실패');
        }
    } catch (error) {
        console.error('수정 요청 실패:', error);
        alert('수정 중 오류가 발생했습니다.');
    }
}

function goBack() {
    window.location.href = '/notice.html';
}

async function deleteNotice(noticeId) {
    if (!confirm('정말 삭제하시겠습니까?')) {
        return;  // 사용자가 취소한 경우
    }

    try {
        const response = await fetch(`/notice/${noticeId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('공지사항이 삭제되었습니다.');
            location.href = '/notice.html';  // 목록으로 이동
        } else {
            alert('삭제에 실패했습니다.');
        }
    } catch (error) {
        console.error('삭제 요청 실패:', error);
        alert('삭제 중 오류가 발생했습니다.');
    }
}
