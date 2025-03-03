const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// 랜덤 가게 추천 API
router.get('/get-random-restaurant', async (req, res) => {
    const { food, visit, price, campus } = req.query;
    let query = `
        SELECT r.*, ri.image_url
        FROM restaurant r
        LEFT JOIN restaurant_image ri ON r.restaurant_id = ri.restaurant_id
        WHERE 1=1
    `;
    const params = [];

    // 음식 카테고리 필터링
    const decodedFood = decodeURIComponent(food || '전체'); // 기본값 "전체"
    if (decodedFood !== '전체') {
        const foodArray = decodedFood.split(','); // 쉼표로 구분된 문자열을 배열로 변환
        const placeholders = foodArray.map(() => '?').join(','); // SQL IN 구문에 사용할 자리표시자 생성
        query += ` AND category IN (${placeholders})`; // IN 구문으로 SQL 조건 추가
        params.push(...foodArray); // 배열을 펼쳐서 params에 추가
    }

    // 방문 인원 필터링
    if (visit) {
        if (visit === '1인') {
            query += ' AND solo_meal = 1';
        } else if (visit === '단체') {
            query += ' AND group_meal = 1';
        }
        // "2인~4인"은 모든 가게를 포함하므로 조건 추가하지 않음
    }

    
    if (price) {
        query += ` AND TRIM(average_price) LIKE '%${price.trim()}%'`;
    }
    console.log("현재 선택된 가격 필터:", price);

    

    // 캠퍼스 필터링
    if (campus) {
        query += ' AND campus = ?';
        params.push(campus);
    }

    // 디버깅용 로그
    console.log('Generated Query:', query);
    console.log('Query Parameters:', params);

    try {
        const [rows] = await pool.query(query, params);
        if (rows.length > 0) {
            const randomRestaurant = rows[Math.floor(Math.random() * rows.length)];
            res.json(randomRestaurant); // 무작위 선택된 레스토랑 반환
        } else {
            res.status(404).send('조건에 맞는 가게가 없습니다.');
        }
    } catch (error) {
        console.error('Database query error:', error);
        res.status(500).send('서버 오류가 발생했습니다.');
    }
});


module.exports = router;
