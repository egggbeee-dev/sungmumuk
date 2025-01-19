// compare.js
const express = require('express');
const router = express.Router();
const {ensureAuthenticated} = require('../middlewares/auth');
const pool = require('../config/db'); // MySQL 연결을 위한 pool 객체 가져오기

// /compare GET 요청
router.get('/compare', ensureAuthenticated, async (req, res) => {
    const userId = req.user.id;
    try {
        const query = `
            SELECT 
                r.*, 
                ri.image_url AS representative_image
            FROM 
                compare c
            JOIN 
                restaurant r ON c.restaurant_id = r.restaurant_id
            LEFT JOIN (
                SELECT 
                    restaurant_id, 
                    MIN(image_id) AS min_image_id
                FROM 
                    restaurant_image
                GROUP BY 
                    restaurant_id
            ) min_images ON r.restaurant_id = min_images.restaurant_id
            LEFT JOIN 
                restaurant_image ri ON min_images.min_image_id = ri.image_id
            WHERE 
                c.user_id = ?
            ORDER BY 
                c.created_at ASC
            LIMIT 2
        `;
        const [rows] = await pool.query(query, [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: '비교함에 추가된 가게가 없습니다.' });
        }
        res.json(rows);
    } catch (error) {
        console.error('Error fetching compare list:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});


// /api/compare POST 요청
router.post('/api/compare', ensureAuthenticated, async (req, res) => {
    const { storeIds } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(storeIds) || storeIds.length === 0) {
        return res.status(400).json({ message: '가게 ID가 필요합니다.' });
    }
    if (storeIds.length > 2) {
        return res.status(400).json({ message: '비교함에는 최대 2개의 가게만 추가할 수 있습니다.' });
    }

    try {
        const insertQuery = `
            INSERT INTO compare (user_id, restaurant_id) 
            VALUES ?
        `;
        const values = storeIds.map(id => [userId, id]);
        await pool.query(insertQuery, [values]);

        res.status(200).json({ message: '가게가 비교함에 추가되었습니다.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: '이미 비교함에 있는 가게입니다.' });
        }
        console.error('비교함 추가 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;


