const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // MySQL connection pool 가져오기

// 찜 많은 순으로 상위 3개 레스토랑 가져오기
router.get('/top-restaurants', async (req, res) => {
    try {
        const query = `
            SELECT r.restaurant_id, r.restaurant_name, r.likes, 
                   (SELECT ri.image_url FROM restaurant_image ri WHERE ri.restaurant_id = r.restaurant_id LIMIT 1) AS restaurant_image
            FROM restaurant r
            ORDER BY r.likes DESC
            LIMIT 3
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching top restaurants:', error);
        res.status(500).json({ error: 'Failed to fetch top restaurants' });
    }
});

router.get('/top-reviews', async (req, res) => {
    try {
        const query = `
            SELECT r.restaurant_id, r.restaurant_name, r.reviews, 
                   (SELECT ri.image_url FROM restaurant_image ri WHERE ri.restaurant_id = r.restaurant_id LIMIT 1) AS restaurant_image
            FROM restaurant r
            ORDER BY r.reviews DESC
            LIMIT 3
        `;
        const [rows] = await pool.query(query);
        console.log('Fetched Data:', rows); // 데이터 확인
        res.json(rows);
    } catch (err) {
        console.error('API Error:', err);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});


module.exports = router;