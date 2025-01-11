const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // 데이터베이스 연결 설정

// 특정 partnership 값을 기반으로 가게 데이터를 반환하는 라우트
router.get('/get-restaurants', async (req, res) => {
    const { partnership } = req.query;

    if (!partnership) {
        return res.status(400).send('파트너십 값이 제공되지 않았습니다.');
    }

    try {
        // SQL 쿼리로 partnership 값을 기준으로 데이터 조회
        const query = `
            SELECT r.*, 
                   (SELECT ri.image_url 
                    FROM restaurant_image ri 
                    WHERE ri.restaurant_id = r.restaurant_id 
                    LIMIT 1) AS image_url
            FROM restaurant r
            WHERE r.partnership = ?
        `;
        const [rows] = await pool.query(query, [partnership]);

        if (rows.length > 0) {
            res.json(rows); // JSON 형식으로 데이터 반환
        } else {
            res.json([]); // 조건에 맞는 데이터가 없을 경우 빈 배열 반환
        }
    } catch (error) {
        console.error('Database query error:', error);
        res.status(500).send('서버 오류가 발생했습니다.');
    }
});

module.exports = router;
