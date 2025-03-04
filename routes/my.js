const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // MySQL 연결
const { ensureAuthenticated } = require('../middlewares/auth');

// 프로필 정보 가져오기
router.get('/profile', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [user] = await pool.query('SELECT nickname, email, department FROM users WHERE id = ?', [userId]);

    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      nickname: user[0].nickname,
      email: user[0].email,
      department: user[0].department,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 닉네임 및 학과 정보 업데이트 (닉네임 중복 검사 추가)
router.post("/profile/update", ensureAuthenticated, async (req, res) => {
  const userId = req.user.id;
  const { nickname, department } = req.body;

  try {
    console.log("Updating user:", { id: userId, nickname, department });

    // ✅ 1. 닉네임 중복 검사 (자기 자신 제외)
    const [existingNickname] = await pool.query(
      "SELECT id FROM users WHERE nickname = ? AND id != ?",
      [nickname, userId]
    );

    if (existingNickname.length > 0) {
      return res.status(409).json({ success: false, message: "이미 사용 중인 닉네임입니다." });
    }

    // ✅ 2. 닉네임 및 학과 정보 업데이트
    const [result] = await pool.query(
      "UPDATE users SET nickname = ?, department = ? WHERE id = ?",
      [nickname, department, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).send({ success: false, message: "사용자를 찾을 수 없습니다." });
    }

    // ✅ 3. 세션 갱신 (새로운 닉네임 저장)
    req.user.nickname = nickname;

    res.send({ success: true, message: "정보가 업데이트되었습니다." });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).send({ success: false, message: "업데이트 중 오류가 발생했습니다." });
  }
});

module.exports = router;
