const express = require('express');
const router = express.Router();
const {ensureAuthenticated} = require('../middlewares/auth');
const pool = require('../config/db'); // 데이터베이스 연결 설정

router.get('/', ensureAuthenticated, async (req, res) => {
        try {
            const userId = req.user.id; // 로그인된 사용자 ID 가져오기
            const [inquiries] = await pool.query(
                'SELECT title, content, created_at, answered_at, status FROM inquiry WHERE user_id = ?',
                [userId]
            );
            console.log('데이터베이스 연결 성공:', inquiries);
    
            // JSON 형식으로 문의 데이터 반환
            res.status(200).json(inquiries);
        } catch (error) {
            console.error('Error fetching inquiries:', error);
            res.status(500).json({ error: '서버 에러, 데이터를 불러올 수 없습니다.' });
        }
    });

module.exports = router;