document.addEventListener('DOMContentLoaded', function() {
    // 게시판 설명 데이터를 저장하는 예시
    let boardDescriptions = {
        haksik: '학식 게시판에서 수정관, 난향관, 운정 캠퍼스의 학식 정보를 공유하고, 의견을 나눠보세요!',
        free: `자유 게시판에서 여러분이 발견한 맛집, 카페, 또는 여행 중 추천하고 싶은 맛집에 대해 이야기해보세요!<br>아쉬웠던 점도 수정이들끼리 솔직하게 얘기 나눠봐요!`
    };

    // 각 박스에 설명 표시
    const haksikPost = document.getElementById('haksik-post');
    const freePost = document.getElementById('free-post');

    // 학식과 자유 게시판 설명 표시 (줄바꿈 태그 포함)
    haksikPost.innerHTML = boardDescriptions.haksik;
    freePost.innerHTML = boardDescriptions.free;

    // 학식 박스 클릭 시 haksik.html로 이동
    document.getElementById('haksik-box').addEventListener('click', function() {
        window.location.href = 'haksik.html';
    });

    // 자유 박스 클릭 시 free.html로 이동
    document.getElementById('free-box').addEventListener('click', function() {
        window.location.href = 'free.html';
    });
});