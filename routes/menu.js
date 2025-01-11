const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // pool 가져오기

// 가게 데이터를 가져오는 함수 정의 (필요 시 사용)
async function getStoreData(category) {
    try {
        console.log('데이터베이스에 연결 중...');
        const [rows] = await pool.query('SELECT * FROM restaurant WHERE category = ?', [category]);
        console.log('데이터베이스 연결 성공:', rows);
        return rows; // rows 반환

    } catch (error) {
        console.error('데이터를 가져오는 중 오류 발생:', error);
        throw error;
    }
}


router.get('/api', async (req, res) => {
    const category = req.query.category;
    const sortOption = req.query.sort; // 정렬 옵션 추가

    let query = `
        SELECT r.*, 
               (SELECT ri.image_url FROM restaurant_image ri WHERE ri.restaurant_id = r.restaurant_id LIMIT 1) AS image_url
        FROM restaurant r
        WHERE r.category = ?
    `;
    const queryParams = [category];

    if (sortOption === 'favorite') {
        query += ' ORDER BY likes DESC';
    } else if (sortOption === 'review') {
        query += ' ORDER BY reviews DESC';
    } else if (sortOption === 'sujeong') {
        query += ' AND campus = "수정캠퍼스"';
    } else if (sortOption === 'unjeong') {
        query += ' AND campus = "운정캠퍼스"';
    }
   
    try {
        const [rows] = await pool.query(query, queryParams);
        res.json({ stores: rows });
    } catch (error) {
        console.error('데이터 가져오기 오류:', error);
        res.status(500).json({ error: '서버 오류 발생' });
    }
});
module.exports = router;

/*router.get('/api', async (req, res) => {
    // routes/menu.js
    console.log('라우트가 등록되었습니다: /menu/api');
    const category = req.query.category;
    try {
        const stores = await getStoreData(category);
        console.log('클라이언트에 전달할 stores 데이터:', stores); // 응답 전 데이터 확인
        res.json({ stores }); // JSON 형식으로 응답
    } catch (error) {
        console.error('데이터 가져오기 오류:', error);
        res.status(500).json({ error: '서버 오류 발생' });
    }
});
*/



