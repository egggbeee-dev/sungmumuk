const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // 데이터베이스 연결

router.post('/store-register', async (req, res) => {
    const { storeName, storeUrl, additionalInfo, userId } = req.body;
    console.log('전달된 userId:', userId);

    // 유효성 검사
    if (!storeName || !storeUrl) {
        return res.status(400).json({ error: '가게 이름과 URL은 필수 항목입니다.' });
    }
    
    try {
        const [result] = await pool.execute(
            'INSERT INTO store_register (store_name, store_url, additional_info, user_id) VALUES (?, ?, ?, ?)',
            [storeName, storeUrl, additionalInfo, userId]
        );

        res.status(201).json({ message: '가게 등록 요청이 저장되었습니다.', id: result.insertId });
    } catch (error) {
        console.error('가게 등록 요청 저장 오류:', error);
        res.status(500).json({ error: '서버 오류로 인해 요청을 저장할 수 없습니다.' });
    }
});

module.exports = router;
