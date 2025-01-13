// favorites.js
const express = require('express');
const {ensureAuthenticated} = require('../middlewares/auth');
const router = express.Router();
const pool = require('../config/db'); // pool 가져오기

// 가게 데이터를 가져오는 함수 정의 (유저별 데이터 가져오기)
async function getStoreData(userId) {
  try {
    console.log('데이터베이스에 연결 중...');
    const [rows] = await pool.execute(`
      SELECT 
        f.favorites_id, f.restaurant_id, r.restaurant_name, r.category, r.campus, r.address, r.opening_hours_mon, r.opening_hours_tue, r.opening_hours_wed, r.opening_hours_thu, 
        r.opening_hours_fri, r.opening_hours_sat, r.opening_hours_sun, r.restaurant_image
      FROM 
        favorites f
      JOIN 
        restaurant r 
      ON 
        f.restaurant_id = r.restaurant_id
      WHERE 
        f.user_id = ?
    `, [userId]);
    
    console.log('데이터베이스 연결 성공:', rows)
    return { rows, storeIds: rows.map(row => row.restaurant_id) };
  } catch (error) {
    console.error('데이터를 가져오는 중 오류 발생:', error);
    throw error;
  }
}

router.get('/favorites', ensureAuthenticated, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).send('인증되지 않은 사용자입니다.');
    }
    const userId = req.user.id; // ensureAuthenticated로 인증된 사용자 정보 사용
    console.log("로그인한 사용자 ID:", userId);

    const stores = await getStoreData(userId); // 데이터 가져오기
    console.log("가져온 가게 데이터:", stores);

    res.json(stores); // 클라이언트에 JSON 응답
  } catch (error) {
    console.error('가게 데이터를 가져오는 중 오류 발생:', error);
    res.status(500).send('서버 오류');
  }
});

//찜에서 삭제하기 API
router.post('/api/remove-favorites', ensureAuthenticated, async (req, res) => {
  try {
    const { storeIds } = req.body;
    console.log('전달받은 storeIds:', storeIds);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: '사용자가 인증되지 않았습니다. 로그인이 필요합니다.' });
    }

    // storeIds 검증
    if (!Array.isArray(storeIds) || storeIds.some(id => typeof id !== 'number' || isNaN(id))) {
      return res.status(400).json({ error: '유효하지 않은 가게 ID가 포함되어 있습니다.' });
    }

    if (storeIds.length === 0) {
      return res.status(400).json({ error: '삭제할 가게 ID가 없습니다.' });
    }

    // Prepared Statement 사용
    const placeholders = storeIds.map(() => '?').join(', ');
    const query = `DELETE FROM favorites WHERE restaurant_id IN (${placeholders}) AND user_id = ?`;
    await pool.execute(query, [...storeIds, userId]);

    return res.status(200).json({ message: '선택된 가게가 삭제되었습니다.' });
  } catch (error) {
    console.error('삭제 오류:', error);
    return res.status(500).json({ error: '서버에서 오류가 발생했습니다.' });
  }
});

// 찜하기 추가 API
router.post('/api/add-favorites', ensureAuthenticated, async (req, res) => {
  try {
    let { storeIds } = req.body; // 클라이언트로부터 가게 ID 전달받기

    const userId = req.user?.id; // ensureAuthenticated로 인증된 사용자 ID 사용
    if (!userId) {
      return res.status(401).json({ error: '사용자가 인증되지 않았습니다. 로그인이 필요합니다.' });
    }

    // restaurantId를 숫자로 변환
   storeIds = parseInt(storeIds, 10);
    if (isNaN(storeIds)) {
      return res.status(400).json({ error: '유효한 가게 ID가 필요합니다.' });
    }

    // 이미 찜한 가게인지 확인
    const [existing] = await pool.execute(
      'SELECT * FROM favorites WHERE user_id = ? AND restaurant_id = ?',
      [userId, storeIds]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: '이미 찜한 가게입니다.' });
    }

    // 찜 추가
    await pool.execute(
      'INSERT INTO favorites (user_id, restaurant_id) VALUES (?, ?)',
      [userId, storeIds]
    );

    return res.status(200).json({ message: '가게가 찜 목록에 추가되었습니다.' });
  } catch (error) {
    console.error('찜 추가 중 오류 발생:', error);
    return res.status(500).json({ error: '서버에서 오류가 발생했습니다.' });
  }
});

// 사용자의 찜 목록 조회 API
router.get('/api/user-favorites', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: '사용자가 인증되지 않았습니다. 로그인이 필요합니다.' });
    }

    const query = 'SELECT restaurant_id FROM favorites WHERE user_id = ?';
    const [results] = await pool.execute(query, [userId]);

    // 가게 ID 배열 반환
    const favoriteStoreIds = results.map(row => row.restaurant_id);

    return res.status(200).json({ favoriteStoreIds });
  } catch (error) {
    console.error('찜 목록 조회 중 오류 발생:', error);
    return res.status(500).json({ error: '서버에서 오류가 발생했습니다.' });
  }
});

module.exports = router;


  