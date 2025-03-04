// favorites.js
const express = require('express');
const {ensureAuthenticated} = require('../middlewares/auth');
const router = express.Router();
const pool = require('../config/db'); // pool 가져오기

async function getStoreData(userId) {
  try {
    console.log('데이터베이스에 연결 중...');
    const [rows] = await pool.execute(`
      SELECT 
        f.favorites_id, 
        f.restaurant_id, 
        r.restaurant_name, 
        r.category, 
        r.campus, 
        r.address, 
        r.opening_hours_mon, 
        r.opening_hours_tue, 
        r.opening_hours_wed, 
        r.opening_hours_thu, 
        r.opening_hours_fri, 
        r.opening_hours_sat, 
        r.opening_hours_sun,
        ri.image_url
      FROM 
        favorites f
      JOIN 
        restaurant r 
      ON 
        f.restaurant_id = r.restaurant_id
      LEFT JOIN 
        restaurant_image ri 
      ON 
        r.restaurant_id = ri.restaurant_id
      WHERE 
        f.user_id = ?
    `, [userId]);

    console.log('데이터베이스 연결 성공:', rows);

    // 중복 제거 및 대표사진 지정
    const stores = rows.reduce((acc, row) => {
      const existingStore = acc.find(store => store.restaurant_id === row.restaurant_id);
      if (existingStore) {
        // 이미 대표 사진이 지정된 경우 추가 작업 필요 없음
        return acc;
      } else {
        // 새 레코드 생성
        acc.push({
          favorites_id: row.favorites_id,
          restaurant_id: row.restaurant_id,
          restaurant_name: row.restaurant_name,
          category: row.category,
          campus: row.campus,
          address: row.address,
          opening_hours: {
            mon: row.opening_hours_mon,
            tue: row.opening_hours_tue,
            wed: row.opening_hours_wed,
            thu: row.opening_hours_thu,
            fri: row.opening_hours_fri,
            sat: row.opening_hours_sat,
            sun: row.opening_hours_sun,
          },
          representative_image: row.image_url || null // 첫 번째 이미지를 대표사진으로 설정
        });
      }
      return acc;
    }, []);

    console.log('대표사진이 포함된 데이터:', stores);
    return stores;
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

// MyPage에서 상위 3개 찜한 가게를 가져오는 API
router.get('/mypage/favorites', ensureAuthenticated, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
    }
    const userId = req.user.id; // 로그인된 사용자 ID
    console.log("로그인한 사용자 ID:", userId);

    // getStoreData로 사용자 데이터를 가져옴
    const allStores = await getStoreData(userId);

    // 상위 3개의 데이터만 선택
    const top3Stores = allStores.slice(0, 3);
    console.log('마이페이지에서 상위 3개 찜한 가게:', top3Stores);

    res.json(top3Stores); // 상위 3개 데이터를 클라이언트로 반환
  } catch (error) {
    console.error('마이페이지 찜한 가게 데이터를 가져오는 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류' });
  }
});

router.get('/api/check-favorite-status', ensureAuthenticated, async (req, res) => {
  const userId = req.user?.id;
  const storeId = parseInt(req.query.id, 10);

  if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  if (isNaN(storeId)) {
      return res.status(400).json({ error: '유효한 가게 ID가 필요합니다.' });
  }

  const [rows] = await pool.execute(
      'SELECT 1 FROM favorites WHERE user_id = ? AND restaurant_id = ?',
      [userId, storeId]
  );

  const isFavorite = rows.length > 0;
  return res.status(200).json({ isFavorite });
});



module.exports = router;


  