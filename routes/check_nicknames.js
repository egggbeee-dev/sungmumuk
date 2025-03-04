const express = require('express');
const router = express.Router();
const db = require('../config/db'); // DB 연결 모듈

router.get('/check-nickname', async (req, res) => {
    const { nickname } = req.query;

    if (!nickname) {
        return res.status(400).json({ message: '닉네임을 입력해주세요.' });
    }

    try {
        const [rows] = await db.execute(
            'SELECT COUNT(*) AS count FROM users WHERE nickname = ?',
            [nickname]
        );

        if (rows[0].count > 0) {
            return res.status(409).json({ message: '이미 사용 중인 닉네임입니다.' });
        } else {
            return res.status(200).json({ message: '사용 가능한 닉네임입니다.' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;
