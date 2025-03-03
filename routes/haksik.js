const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth');
const pool = require('../config/db'); // 데이터베이스 연결 설정

// 🔹 ensureAuthenticated 적용 (로그인 필수)
router.use(ensureAuthenticated);

// 🔹 게시글 목록 조회 API (GET /haksik/posts)
router.get('/posts', async (req, res) => {
  const query = 'SELECT * FROM posts WHERE board_type = "haksik" ORDER BY created_at DESC';

  try {
    const [results] = await pool.query(query);
    res.status(200).json(results);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: '게시물 조회에 실패했습니다.' });
  }
});

// 🔹 특정 게시글 상세 조회 API (GET /haksik/posts/:id)
router.get('/posts/:id', async (req, res) => {
  const postId = req.params.id;
  const query = `
    SELECT p.*, u.nickname AS author, u.id AS author_id
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.post_id = ? AND p.board_type = "haksik"`;

  try {
    const [results] = await pool.query(query, [postId]);
    if (results.length === 0) {
      return res.status(404).json({ message: '게시물이 존재하지 않습니다.' });
    }
    res.status(200).json(results[0]); // 작성자 정보 포함
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: '게시물 조회에 실패했습니다.' });
  }
});

// 🔹 댓글 작성 API (POST /haksik/posts/:id/comments)
router.post('/posts/:id/comments', async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: '댓글 내용을 입력하세요.' });
  }

  const query = `
    INSERT INTO comments (post_id, user_id, content, created_at, likes)
    VALUES (?, ?, ?, NOW(), 0)`;

  try {
    const [result] = await pool.query(query, [postId, userId, content]);
    res.status(201).json({ message: '댓글이 작성되었습니다.', commentId: result.insertId });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: '댓글 작성에 실패했습니다.' });
  }
});

// 🔹 댓글 조회 API (GET /haksik/posts/:id/comments)
router.get('/posts/:id/comments', async (req, res) => {
  const postId = req.params.id;
  const query = `
    SELECT c.comment_id, c.content, c.created_at, c.likes, u.nickname AS author
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at DESC`;

  try {
    const [results] = await pool.query(query, [postId]);
    res.status(200).json(results);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: '댓글 조회에 실패했습니다.' });
  }
});

// 🔹 댓글 좋아요 API (POST /haksik/comments/:id/like)
router.post('/comments/:id/like', async (req, res) => {
  const commentId = req.params.id;
  const query = 'UPDATE comments SET likes = likes + 1 WHERE comment_id = ?';

  try {
    await pool.query(query, [commentId]);
    res.status(201).json({ message: '좋아요가 추가되었습니다.' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: '좋아요 처리 중 오류가 발생했습니다.' });
  }
});

// 🔹 게시글 수정 API (PUT /haksik/posts/:id)
router.put('/posts/:id', async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: '내용을 입력하세요.' });
  }

  const query = 'UPDATE posts SET content = ? WHERE post_id = ? AND user_id = ? AND board_type = "haksik"';

  try {
    const [results] = await pool.query(query, [content, postId, userId]);
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: '게시글이 존재하지 않거나 수정 권한이 없습니다.' });
    }
    res.status(200).json({ message: '게시글이 수정되었습니다.' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: '게시글 수정에 실패했습니다.' });
  }
});

// 🔹 게시글 삭제 API (DELETE /haksik/posts/:id)
router.delete('/posts/:id', async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  const deleteCommentsQuery = 'DELETE FROM comments WHERE post_id = ?';
  const deletePostQuery = 'DELETE FROM posts WHERE post_id = ? AND user_id = ? AND board_type = "haksik"';

  try {
    await pool.query(deleteCommentsQuery, [postId]);
    const [result] = await pool.query(deletePostQuery, [postId, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '게시글이 존재하지 않거나 삭제 권한이 없습니다.' });
    }

    res.status(200).json({ message: '게시글 및 관련 댓글이 삭제되었습니다.' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: '게시글 삭제에 실패했습니다.' });
  }
});

// 🔹 검색 기능 API (GET /haksik/search)
router.get('/search', async (req, res) => {
  const query = req.query.query;
  if (!query) {
    return res.status(400).json({ message: '검색어가 없습니다.' });
  }

  const searchQuery = `
    SELECT * FROM posts
    WHERE board_type = "haksik" AND (title LIKE ? OR content LIKE ?)
    ORDER BY created_at DESC`;

  try {
    const [results] = await pool.query(searchQuery, [`%${query}%`, `%${query}%`]);
    res.status(200).json(results);
  } catch (err) {
    console.error('검색 중 오류 발생:', err);
    res.status(500).json({ message: '검색 중 오류가 발생했습니다.' });
  }
});

// 게시글 좋아요 추가
router.post("/posts/:postId/like", async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;// 현재 로그인된 사용자 ID

  if (!userId) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  try {
    // 기존 좋아요 여부 확인
    const [existingLike] = await pool.query(
      "SELECT * FROM likes WHERE user_id = ? AND post_id = ?",
      [userId, postId]
    );

    if (existingLike.length > 0) {
      // 이미 좋아요를 눌렀으면 취소
      await pool.query(
        "DELETE FROM likes WHERE user_id = ? AND post_id = ?",
        [userId, postId]
      );
      return res.status(200).json({ message: "좋아요 취소!" });
    } else {
      // 좋아요 추가
      await pool.query(
        "INSERT INTO likes (user_id, post_id, created_at,board_type) VALUES (?, ?, NOW(), 'haksik')",
        [userId, postId]
      );
      return res.status(201).json({ message: "좋아요 추가!" });
    }
  } catch (error) {
    console.error("좋아요 처리 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

// 특정 게시글의 좋아요 개수 가져오기
router.get("/posts/:postId/like/count", async (req, res) => {
  const { postId } = req.params;

  try {
    const [result] = await pool.query(
      "SELECT COUNT(*) AS likeCount FROM likes WHERE post_id = ?",
      [postId]
    );
    res.json({ likeCount: result[0].likeCount });
  } catch (error) {
    console.error("좋아요 개수 조회 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

// 특정 사용자가 해당 게시글에 좋아요를 눌렀는지 확인하는 API
router.get("/posts/:postId/like/status", async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id; // 로그인된 사용자 ID

  if (!userId) {
    return res.json({ liked: false }); // 로그인하지 않은 경우 좋아요 X
  }

  try {
    const [result] = await pool.query(
      "SELECT COUNT(*) AS count FROM likes WHERE user_id = ? AND post_id = ?",
      [userId, postId]
    );

    res.json({ liked: result[0].count > 0 });
  } catch (error) {
    console.error("좋아요 상태 확인 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});


module.exports = router;

