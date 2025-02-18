const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // 이미 연결된 pool 객체 사용
const { ensureAuthenticated } = require('../middlewares/auth');

// 프로필 정보 가져오기
router.get('/profile',  ensureAuthenticated,async (req, res) => {
  try {
    const userId = req.user.id; // 로그인된 사용자 ID 가져오기
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [user] = await pool.query('SELECT nickname, email, department FROM users WHERE id = ?', [userId]);

    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // JSON 형태로 사용자 정보 반환
    res.json({
      nickname: user[0].nickname,
      email: user[0].email, // username은 email로 변경한 것으로 추정
      department: user[0].department,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post("/profile/update", ensureAuthenticated, async (req, res) => {
  const userId = req.user.id;
  const { nickname, department } = req.body;

  try {
    console.log("Updating user:", { id: userId, nickname, department });

    // 닉네임 및 학과 정보 업데이트
    const [result] = await pool.query(
      "UPDATE users SET nickname = ?, department = ? WHERE id = ?",
      [nickname, department, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).send({ success: false, message: "사용자를 찾을 수 없습니다." });
    }

    // ✅ 세션에 새로운 닉네임 저장 (세션 갱신)
    req.user.nickname = nickname;

    res.send({ success: true, message: "정보가 업데이트되었습니다." });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).send({ success: false, message: "업데이트 중 오류가 발생했습니다." });
  }
});

module.exports = router;
