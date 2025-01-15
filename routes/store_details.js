const express = require('express');
const router = express.Router();
const path = require('path');
const pool = require('../config/db'); 


// HTML 반환 라우터
router.get('/', (req, res) => {
    const storeId = req.query.id;
    if (!storeId) {
        return res.status(400).send('가게 ID가 제공되지 않았습니다.');
    }
    res.sendFile(path.join(__dirname, '../views/store_details.html'));
});

// 데이터 반환 라우터 (Promise 사용)
router.get('/data', async (req, res) => {
    const storeId = req.query.id;

    if (!storeId) {
        return res.status(400).json({ error: '가게 ID가 제공되지 않았습니다.' });
    }

    try {
        const [restaurantResults] = await pool.query('SELECT * FROM restaurant WHERE restaurant_id = ?', [storeId]);
        
        if (restaurantResults.length === 0) {
            return res.status(404).json({ error: '가게 정보를 찾을 수 없습니다.' });
        }

        const [imageResults] = await pool.query('SELECT image_url FROM restaurant_image WHERE restaurant_id = ?', [storeId]);

        const images = imageResults.length > 0
            ? imageResults.map(row => row.image_url)
            : ["/restaurant/default.jpg"];

        const restaurantData = {
            ...restaurantResults[0],
            images
        };

        res.json(restaurantData);
    } catch (error) {
        console.error('데이터베이스 오류:', error);
        res.status(500).json({ error: '서버 내부 오류' });
    }
});

// 리뷰 데이터 반환 라우터 (Promise 사용)
router.get('/reviews', async (req, res) => {
    const storeId = req.query.id;
    if (!storeId) {
        return res.status(400).json({ error: '가게 ID가 제공되지 않았습니다.' });
    }

    try {
        const [results] = await pool.query('SELECT * FROM review WHERE restaurant_id = ? ORDER BY created_at DESC', [storeId]);
        res.json(results);
    } catch (error) {
        console.error('리뷰 데이터베이스 오류:', error);
        res.status(500).json({ error: '서버 오류' });
    }
});

module.exports = router;
