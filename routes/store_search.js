const express = require('express');
const router = express.Router();
const db = require('../config/db'); // 데이터베이스 연결 모듈

// 검색 및 필터링 라우터
router.get('/', async (req, res) => {
    try {
        const { query = '', price, cafe, campus, affiliation, sort, page } = req.query;

        // 조건 저장 배열
        let filters = [];
        let params = [];

        // 검색 조건 추가
        if (query.trim()) {
            filters.push('(restaurant_name LIKE ? OR recommended_menu LIKE ?OR category LIKE ?)');
            params.push(`%${query}%`, `%${query}%`, `%${query}%`);
        }

        // 가격 필터 추가
        if (price) {
            if (price === 'low') filters.push('average_price < 10000');
            else if (price === 'mid') filters.push('average_price BETWEEN 10000 AND 30000');
            else if (price === 'high') filters.push('average_price > 30000');
        }

        // 카페 유형 필터 추가
        if (cafe) {
            if (cafe === '공부') filters.push('cafe_study = 1');
            else if (cafe === '심야') filters.push('late_night = 1');
            else if (cafe === '분위기') filters.push('good_mood = 1');
        }

        // 캠퍼스 필터 추가
        if (campus) {
            filters.push('campus = ?');
            params.push(campus);
        }

        // 제휴 필터 추가
        if (affiliation) {
            filters.push('partnership = ?');
            params.push(affiliation);
        }

        // 정렬 조건 추가
        let orderBy = '';
        if (sort) {
            if (sort === 'high-rating') orderBy = 'ORDER BY reviews DESC';
            else if (sort === 'most-reviews') orderBy = 'ORDER BY likes DESC';
            else orderBy = 'ORDER BY restaurant_name ASC'; // 기본 정렬
        }

        // 페이징 처리
        const limit = 12; // 페이지당 10개
        const offset = (parseInt(page, 12) - 1 || 0) * limit;

        // WHERE 절 생성
        const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

        // SQL 쿼리 생성
        let sql;
        if (!query.trim()) {
            sql = `
                SELECT 
                    restaurant_id,
                    restaurant_name,
                    recommended_menu,
                    average_rating,
                    average_price,
                    IFNULL(reviews, 0) AS reviews
                FROM restaurant
                ORDER BY RAND()
                LIMIT ${limit} OFFSET ${offset};
            `;
        } else {
            // 검색어가 있는 경우 기존 로직 실행
            sql = `
                SELECT 
                    restaurant_id,
                    restaurant_name,
                    recommended_menu,
                    average_rating,
                    average_price,
                    IFNULL(reviews, 0) AS reviews
                FROM restaurant
                ${whereClause}
                ${orderBy}
                LIMIT ${limit} OFFSET ${offset};
            `;
        }

        console.log('Generated SQL:', sql); // SQL 디버깅
        console.log('Params:', params); // 파라미터 디버깅

        // SQL 실행
        const [results] = await db.query(sql, params);

         // 레스토랑 이미지를 별도 테이블에서 가져오기
        const restaurantIds = results.map(r => r.restaurant_id);
        if (restaurantIds.length > 0) {
            const imageSql = `SELECT restaurant_id, image_url FROM restaurant_image WHERE restaurant_id IN (?);`;
            const [imageResults] = await db.query(imageSql, [restaurantIds]);
        
            const imagesMap = imageResults.reduce((map, img) => {
                map[img.restaurant_id] = img.image_url;
                return map;
            }, {});
        
            results.forEach(restaurant => {
                restaurant.restaurant_image = imagesMap[restaurant.restaurant_id] || 'default-logo.png';
            });
        } else {
            results.forEach(restaurant => {
                restaurant.restaurant_image = 'default-logo.png';
            });
        }

        // 전체 페이지 계산
        const countSql = `SELECT COUNT(*) as total FROM restaurant ${whereClause};`;
        const [countResult] = await db.query(countSql, params);
        const totalPages = Math.ceil(countResult[0].total / limit);

        // 응답 반환
        res.json({ data: results, totalPages });
    } catch (err) {
        console.error('Error in combined search and filter:', err);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});
  

module.exports = router;
