const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // 데이터베이스 연결 설정

// 새로운 가게 리스트 API
router.get('/', async (req, res) => {
    try {
        // 태그가 'new'인 가게 가져오기
         const query = `
            SELECT r.restaurant_id, r.restaurant_name, r.category, r.address, 
                   r.campus, r.average_rating, r.solo_meal, r.group_meal,
                   r.cafe_study, r.good_price, r.good_mood, r.late_night,
                   ri.image_url
            FROM restaurant r
            LEFT JOIN restaurant_image ri
            ON r.restaurant_id = ri.restaurant_id
            WHERE FIND_IN_SET('new', r.tags)
            GROUP BY r.restaurant_id 
            ORDER BY r.restaurant_id ASC
        `;
        const [rows] = await pool.query(query);
         // 한 가게에 여러 이미지가 있을 경우 첫 번째 이미지만 반환
         const stores = rows.map(store => ({
            ...store,
            image_url: store.image_url ? `/restaurant/${store.image_url}` : '/restaurant/default.jpg'
        }));
        res.json(rows); // JSON 형태로 클라이언트에 반환
    } catch (error) {
        console.error('새로운 가게를 가져오는 중 오류 발생:', error);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;
