const express = require('express');
const router = express.Router();
const pool = require('../config/db'); 

// 공지사항 목록 조회 API
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT notice_id, notice_title, DATE_FORMAT(notice_created_at, "%Y-%m-%d") as date, views FROM notice ORDER BY notice_created_at DESC');
        res.json(rows);
    } catch (err) {
        console.error('공지사항 조회 에러:', err);
        res.status(500).send('서버 에러');
    }
});

// 공지사항 작성 API (POST)
router.post('/', async (req, res) => {
    const { title, content } = req.body;

    // 로그인 유저 정보 확인 (세션 기반 예시)
    const user = req.session.user;  // 세션 기반일 경우
    if (!user || user.isAdmin !== 1) {
        return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO notice (notice_title, notice_content) VALUES (?, ?)',
            [title, content]
        );

        res.status(201).json({ message: '공지사항 작성 완료', noticeId: result.insertId });
    } catch (err) {
        console.error('공지사항 작성 실패:', err);
        res.status(500).json({ message: '서버 에러' });
    }
});


module.exports = router;
