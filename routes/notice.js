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

router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // 조회수 증가
        await pool.query('UPDATE notice SET views = views + 1 WHERE notice_id = ?', [id]);

        // 상세 정보 조회
        const [rows] = await pool.query(`
            SELECT 
                notice_id AS id,
                notice_title AS title,
                notice_content AS content,
                DATE_FORMAT(notice_created_at, '%Y-%m-%d') AS date,
                views
            FROM notice
            WHERE notice_id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: '공지사항이 존재하지 않습니다.' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('공지사항 상세 조회 실패:', error);
        res.status(500).json({ message: '서버 에러' });
    }
});


module.exports = router;
