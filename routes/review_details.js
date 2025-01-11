const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // DB 연결 설정

// 리뷰 상세 API
router.get('/api/review_details/:id', async (req, res) => {
    const reviewId = req.params.id; // URL에서 리뷰 ID 가져오기
    try {
        const [rows] = await pool.query('SELECT * FROM review WHERE review_id = ?', [reviewId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
        }
        res.json(rows[0]); // 리뷰 데이터를 JSON 형식으로 반환
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '리뷰 데이터를 불러오는 중 오류가 발생했습니다.' });
    }
});

module.exports = router;
