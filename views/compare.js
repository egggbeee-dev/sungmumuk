 document.addEventListener('DOMContentLoaded', async () => {
            try {
                const authResponse = await fetch('/auth/status');
                const authStatus = await authResponse.json();
        
                if (!authStatus.loggedIn) {
                    const userResponse = confirm('비교함은 로그인 후 이용 가능합니다.');
                    if (userResponse) {
                        window.location.href = '/login.html'; // 로그인 페이지로 이동
                    } else {
                        window.history.back(); // 이전 페이지로 이동
                    }
                }
                
        
                const response = await fetch('/compare');
                if (!response.ok) throw new Error('데이터 가져오기에 실패했습니다.');
        
                const stores = await response.json();
                if (stores.length > 0) {
                    renderComparison(stores); // 데이터가 있으면 렌더링
                } else {
                    renderDefaultCard(); // 데이터가 없을 경우 기본 카드 표시
                }
            } catch (error) {
                console.error('비교 데이터 로드 중 오류:', error);
            }
        });
        
        // 데이터가 없을 경우 기본 카드 렌더링 함수
        function renderDefaultCard() {
            const container = document.querySelector('.comparison-container');
            container.innerHTML = `
                <div class="store">
                    <div class="store-header">
                        <button class="register-button" onclick="location.href='/store_search.html?query=';">가게 등록</button>
                        <img src="성뭐먹1.png   " alt="기본 이미지" class="store-image">
                        <h2 class="store-name">비교할 가게가 없습니다.</h2>
                    </div>
                    <div class="store-details">
                        <p>비교할 가게를 추가해주세요!</p>
                    </div>
                </div>
            `;
        }
        
        // 데이터가 있을 경우 HTML 렌더링 함수
        function renderComparison(stores) {
            const container = document.querySelector('.comparison-container');
        
            // HTML 렌더링
            container.innerHTML = stores
                .map(store => {
                    // 대표 이미지가 없을 경우 기본 이미지 사용
                    const representativeImage = store.representative_image || '/images/default-image.jpg';
        
                    // 영업시간 필드
                    const days = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];
                    const hours = [
                        store.opening_hours_mon,
                        store.opening_hours_tue,
                        store.opening_hours_wed,
                        store.opening_hours_thu,
                        store.opening_hours_fri,
                        store.opening_hours_sat,
                        store.opening_hours_sun
                    ];
                    const openingHours = days.map((day, index) => {
                        return `<tr><td>${day}</td><td>${hours[index] || '정보 없음'}</td></tr>`;
                    }).join('');
        
                    // HTML 템플릿
                    return `
                        <div class="store">
                            <div class="store-header">
                                <button class="remove-button" onclick="removeFromComparison(${store.restaurant_id})">X</button>
                                <img src="${representativeImage}" alt="가게 이미지" class="store-image">
                                <h2 class="store-name">${store.restaurant_name}</h2>
                                <button class="register-button" onclick="location.href='/store_search.html?query=';">가게 등록</button>
                            </div>
                            <div class="store-details">
                                <p><strong>주소:</strong> ${store.address || '정보 없음'}</p>
                                <p><strong>캠퍼스:</strong> ${store.campus || '정보 없음'}</p>
                                <p><strong>카테고리:</strong> ${store.category || '정보 없음'}</p>
                                <p><strong>평균 가격:</strong> ${store.average_price || '정보 없음'}</p>
                                <p><strong>연락처:</strong> ${store.contact_number || '정보 없음'}</p>
                                <p><strong>제휴:</strong> ${store.partnership || '제휴 없음'}</p>
                                <h3>영업시간:</h3>
                                <table>
                                    <tr><th>요일</th><th>영업시간</th></tr>
                                    ${openingHours}
                                </table>
                            </div>
                        </div>
                    `;
                })
                .join('');
        }
        // 비교함에서 가게 삭제 함수
async function removeFromComparison(restaurantId) {
    try {
        const response = await fetch('/compare/remove', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ restaurantId }),
        });

        if (!response.ok) throw new Error('가게 삭제 중 오류가 발생했습니다.');

        const result = await response.json();
        
        // 성공 메시지 표시
        alert(result.message); // "가게가 비교함에서 삭제되었습니다." 메시지를 사용자에게 표시
        
        // 서버에서 성공적으로 삭제되었으면 클라이언트에서 렌더링 업데이트
        const stores = await fetchComparisonData();
        renderComparison(stores);
    } catch (error) {
        console.error('비교함에서 가게 삭제 중 오류:', error);
        alert('가게를 삭제하는 중 문제가 발생했습니다.');
    }
}

// 비교 데이터 다시 가져오기
async function fetchComparisonData() {
    try {
        const response = await fetch('/compare');
        if (!response.ok) throw new Error('비교 데이터를 다시 가져오는 중 오류 발생');
        return await response.json();
    } catch (error) {
        console.error('비교 데이터 로드 오류:', error);
        return [];
    }
} 
