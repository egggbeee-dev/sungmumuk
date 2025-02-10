const express = require('express');
const router = express.Router();
const {ensureAuthenticated} = require('../middlewares/auth');
const pool = require('../config/db'); // 데이터베이스 연결 설정

router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id; // 로그인된 사용자 ID 가져오기
        
        // 사용자 정보 조회 (is_admin 값 확인)
        const [userRows] = await pool.query(
            'SELECT is_admin FROM users WHERE id = ?',
            [userId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ error: '사용자 정보를 찾을 수 없습니다.' });
        }

        const isAdmin = userRows[0].is_admin; // 관리자 여부 확인

        let inquiriesQuery = 'SELECT inquiry_id,title, content, created_at, answered_at, answer,status FROM inquiry';
        let queryParams = [];

        if (isAdmin !== 1) {
            // 일반 사용자는 본인 문의만 확인 가능
            inquiriesQuery += ' WHERE user_id = ?';
            queryParams.push(userId);
        }

        const [inquiries] = await pool.query(inquiriesQuery, queryParams);
        console.log('데이터베이스 연결 성공:', inquiries);

        res.status(200).json(inquiries);
    } catch (error) {
        console.error('Error fetching inquiries:', error);
        res.status(500).json({ error: '서버 에러, 데이터를 불러올 수 없습니다.' });
    }
});

router.post('/admin/reply/:id', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { answer } = req.body;

        // 로그인한 사용자의 is_admin 값 확인
        const [userRows] = await pool.query('SELECT is_admin FROM users WHERE id = ?', [userId]);

        if (userRows.length === 0 || userRows[0].is_admin !== 1) {
            return res.status(403).json({ error: '관리자만 답변을 작성할 수 있습니다.' });
        }

        // 문의 존재 여부 확인
        const [inquiryRows] = await pool.query('SELECT * FROM inquiry WHERE inquiry_id = ?', [id]);

        if (inquiryRows.length === 0) {
            return res.status(404).json({ error: '해당 문의를 찾을 수 없습니다.' });
        }

        // 답변 저장
        await pool.query(
            'UPDATE inquiry SET answer = ?, status = "답변 완료", answered_at = NOW() WHERE inquiry_id = ?',
            [answer, id]
        );

        res.json({ message: '답변이 등록되었습니다.' });
    } catch (error) {
        console.error('답변 등록 오류:', error);
        res.status(500).json({ message: '서버 오류 발생' });
    }
});



module.exports = router;