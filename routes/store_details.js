const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const path = require('path');

const app = express();

// 정적 파일 제공

// 정적 파일 제공
//app.use('/restaurant', express.static(path.join(__dirname, '../restaurant')));


// MySQL 연결 설정
const connection = mysql.createConnection({
    host: 'localhost',       // MySQL 호스트
    user: 'root',            // MySQL 사용자
    password: 'root',        // MySQL 비밀번호
    database: 'sungmukdb'    // 사용할 데이터베이스 이름
});



// HTML 반환 라우터
router.get('/', (req, res) => {
    const storeId = req.query.id;
    

    if (!storeId) {
        return res.status(400).send('가게 ID가 제공되지 않았습니다.');
    }

    res.sendFile(path.join(__dirname, '../views/store_details.html'));
});

// 데이터 반환 라우터
router.get('/data', (req, res) => {
    const storeId = req.query.id;

    if (!storeId) {
        return res.status(400).json({ error: '가게 ID가 제공되지 않았습니다.' });
    }

    // 가게 정보 쿼리 (평점 포함)
 // 1. 가게 정보 조회 쿼리
 const restaurantQuery = `SELECT * FROM restaurant WHERE restaurant_id = ?`;

 connection.query(restaurantQuery, [storeId], (err, restaurantResults) => {
     if (err) {
         console.error("가게 정보 쿼리 오류:", err);
         return res.status(500).json({ error: '서버 내부 오류' });
     }
     if (restaurantResults.length === 0) {
         return res.status(404).json({ error: '가게 정보를 찾을 수 없습니다.' });
     }

     // 이미지 데이터를 배열로 처리
     const imageQuery = `SELECT image_url FROM restaurant_image WHERE restaurant_id = ?`;

     connection.query(imageQuery, [storeId], (imgErr, imageResults) => {
         if (imgErr) {
             console.error("이미지 데이터 쿼리 오류:", imgErr);
             return res.status(500).json({ error: '서버 내부 오류' });
         }

         // 이미지가 여러 개 있을 때, 배열로 반환
         const images = imageResults.length > 0
             ? imageResults.map(row => row.image_url)
             : ["/restaurant/default.jpg"]; // 기본 이미지

         const restaurantData = {
             ...restaurantResults[0],
             images
         };

         res.json(restaurantData);
     });
 });
});



// 리뷰 데이터 반환 라우터
router.get('/reviews', (req, res) => {
    const storeId = req.query.id;
    console.log('JSON 요청 - store_details/reviews 요청 도착:', storeId);

    if (!storeId) {
        return res.status(400).json({ error: '가게 ID가 제공되지 않았습니다.' });
    }

    const query = 'SELECT * FROM review WHERE restaurant_id = ? ORDER BY created_at DESC';
    connection.query(query, [storeId], (error, results) => {
        if (error) {
            console.error('리뷰 조회 중 오류 발생:', error);
            return res.status(500).json({ error: '서버 오류로 인해 리뷰를 불러올 수 없습니다.' });
        }

        console.log('리뷰 쿼리 결과:', results);
        res.json(results);
    });
});

// 서버 종료 시 MySQL 연결 종료
process.on('SIGINT', () => {
    connection.end(err => {
        if (err) {
            console.error('MySQL 연결 종료 실패:', err);
        } else {
            console.log('MySQL 연결 종료');
        }
        process.exit();
    });
});

module.exports = router;
