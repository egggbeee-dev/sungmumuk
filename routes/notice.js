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

module.exports = router;
