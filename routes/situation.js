
const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // 데이터베이스 연결 풀 가져오기

async function getStoreDataByFilter(filterColumn, sortOption) {
    try {
        let query = `
                   SELECT DISTINCT r.restaurant_id, r.restaurant_name, r.category, r.address, r.campus, r.average_rating,
       r.solo_meal, r.group_meal, r.cafe_study, r.good_price, r.good_mood, r.late_night, 
       r.reviews, 
       (SELECT ri.image_url FROM restaurant_image ri WHERE ri.restaurant_id = r.restaurant_id LIMIT 1) AS image_url
FROM restaurant r
WHERE 1=1
    `;

;

        // 필터 조건 추가
        if (filterColumn) {
            query += ` AND ${filterColumn} = 1`;
        }

        // 캠퍼스 정렬 조건 추가
        if (sortOption === 'sujeong') {
            query += ` AND campus = "수정캠퍼스"`;
        } else if (sortOption === 'unjeong') {
            query += ` AND campus = "운정캠퍼스"`;
        }

        // 정렬 기준 추가
        if (sortOption === 'favorite') {
            query += ` ORDER BY likes DESC`; // 찜 많은 순
        } else {
            query += ` ORDER BY reviews DESC`; // 리뷰 많은 순 (기본값)
        }

        console.log('최종 실행 쿼리:', query); // 쿼리 확인 로그

        const [rows] = await pool.query(query);
        return rows;
    } catch (error) {
        console.error('쿼리 실행 오류:', error);
        throw error;
    }
}



// 필터와 정렬 옵션을 처리하는 API 라우트
router.get('/api', async (req, res) => {
    const filterColumn = req.query.filter;
    const sortOption = req.query.sort || 'review'; // 기본 정렬: 리뷰 많은 순

    try {
        const stores = await getStoreDataByFilter(filterColumn, sortOption);
        res.json({ stores });
    } catch (error) {
        console.error('데이터 가져오기 오류:', error);
        res.status(500).json({ error: '서버 오류 발생' });
    }
});



module.exports = router;
