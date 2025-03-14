const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth');
const pool = require('../config/db'); // 데이터베이스 연결 설정

router.get("/posts", async (req, res) => {
  const { filter } = req.query; // 클라이언트에서 보낸 필터 값

  let orderBy = "created_at DESC"; // 기본값: 최신순
  if (filter === "low") {
      orderBy = "created_at ASC"; // 오래된 순
  } else if (filter === "mid") {
      orderBy = "(SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.post_id) DESC, created_at DESC"; // 좋아요 많은 순
  }

  try {
      const [posts] = await pool.query(
          `SELECT posts.*, 
                  (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.post_id) AS like_count
           FROM posts 
           WHERE board_type = "free"  -- 학식 게시판 글만 가져오도록 추가
           ORDER BY ${orderBy}`
      );
      res.json(posts);
  } catch (error) {
      console.error("게시물 필터링 오류:", error);
      res.status(500).json({ message: "게시물 필터링 중 오류 발생" });
  }
});

// 특정 게시글 상세 조회 API (GET /free/posts/:id)
router.get('/posts/:id', async (req, res) => {
  const postId = req.params.id;
  const query = `
    SELECT p.*, u.nickname AS author, u.id AS author_id
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.post_id = ? AND p.board_type = "free"`;

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

// 댓글 작성 API (POST /free/posts/:id/comments)
router.post('/posts/:id/comments', ensureAuthenticated, async (req, res) => {
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

// 댓글 조회 API (GET /free/posts/:id/comments)
router.get('/posts/:id/comments', async (req, res) => {
  const postId = req.params.id;
  const query = `
  SELECT c.comment_id, c.content, c.created_at, c.likes, c.user_id, u.nickname AS author
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

// 댓글 좋아요 API (POST /free/comments/:id/like)
router.post('/comments/:id/like', ensureAuthenticated, async (req, res) => {
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

// 게시글 수정 API (PUT /free/posts/:id)
router.put('/posts/:id', async (req, res) => {
  const { title, content } = req.body;  // title도 받음
  const { id } = req.params;

  try {
      const query = `
          UPDATE posts
          SET title = ?, content = ?,updated_at = NOW()
          WHERE post_id = ?
      `;
      await pool.execute(query, [title, content, id]);

      res.status(200).json({ message: "게시글이 수정되었습니다." });
  } catch (error) {
      console.error("게시글 수정 오류:", error);
      res.status(500).json({ error: "서버 오류로 수정 실패" });
  }
});


// 게시글 삭제 API (DELETE /free/posts/:id)
router.delete('/posts/:id', ensureAuthenticated, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  const connection = await pool.getConnection();
  try {
      await connection.beginTransaction();

      // 1. 댓글 먼저 삭제
      await connection.query('DELETE FROM comments WHERE post_id = ?', [postId]);

      // 2. 좋아요 삭제 (likes 테이블도 참조 중일 가능성 있음)
      await connection.query('DELETE FROM likes WHERE post_id = ?', [postId]);

      // 3. 게시글 삭제
      const [result] = await connection.query('DELETE FROM posts WHERE post_id = ?', [postId]);

      await connection.commit();

      if (result.affectedRows === 0) {
          return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
      }

      res.status(200).json({ message: '게시글이 삭제되었습니다.' });
  } catch (error) {
      await connection.rollback();
      console.error('게시글 삭제 오류:', error);
      res.status(500).json({ message: '게시글 삭제 중 오류 발생' });
  } finally {
      connection.release();
  }
});

// 검색 기능 API (GET /free/search)
router.get('/search', async (req, res) => {
  const query = req.query.query;
  if (!query) {
    return res.status(400).json({ message: '검색어가 없습니다.' });
  }

  const searchQuery = `
  SELECT * FROM posts
  WHERE board_type = "free" AND (title LIKE ? OR content LIKE ?)
  ORDER BY created_at DESC`;


  try {
    const [results] = await pool.query(searchQuery, [`%${query}%`, `%${query}%`]);
    res.status(200).json(results);
  } catch (err) {
    console.error('검색 중 오류 발생:', err);
    res.status(500).json({ message: '검색 중 오류가 발생했습니다.' });
  }
});

//댓글 삭제 API
router.delete('/comments/:id', ensureAuthenticated, async (req, res) => {
  const commentId = req.params.id;
  const userId = req.user.id; // 로그인한 사용자

  const query = 'DELETE FROM comments WHERE comment_id = ? AND user_id = ?';

  try {
      const [result] = await pool.query(query, [commentId, userId]);

      if (result.affectedRows === 0) {
          return res.status(404).json({ message: '댓글이 존재하지 않거나 삭제 권한이 없습니다.' });
      }

      res.status(200).json({ message: '댓글이 삭제되었습니다.' });
  } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ message: '댓글 삭제에 실패했습니다.' });
  }
});
// 게시글 좋아요 추가
// 게시글 좋아요 추가/취소 (board_type 추가 반영)
router.post("/posts/:postId/like", async (req, res) => {
  const { postId } = req.params;
  const userId = req.user?.id; // 현재 로그인된 사용자 ID
  const boardType = "haksik"; // 현재 게시판 타입 고정

  if (!userId) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  try {
    // 기존 좋아요 여부 확인 (board_type 조건 추가)
    const [existingLike] = await pool.query(
      "SELECT * FROM likes WHERE user_id = ? AND post_id = ? AND board_type = ?",
      [userId, postId, boardType]
    );

    if (existingLike.length > 0) {
      // 이미 좋아요를 눌렀으면 취소
      await pool.query(
        "DELETE FROM likes WHERE user_id = ? AND post_id = ? AND board_type = ?",
        [userId, postId, boardType]
      );
      return res.status(200).json({ message: "좋아요 취소!" });
    } else {
      // 좋아요 추가
      await pool.query(
        "INSERT INTO likes (user_id, post_id, created_at, board_type) VALUES (?, ?, NOW(), ?)",
        [userId, postId, boardType]
      );
      return res.status(201).json({ message: "좋아요 추가!" });
    }
  } catch (error) {
    console.error("좋아요 처리 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});


// 특정 게시글의 좋아요 개수 가져오기
// 특정 게시글의 좋아요 개수 가져오기 (board_type 추가 반영)
router.get("/posts/:postId/like/count", async (req, res) => {
  const { postId } = req.params;
  const boardType = "haksik"; // 현재 게시판 타입 고정

  try {
    const [result] = await pool.query(
      "SELECT COUNT(*) AS likeCount FROM likes WHERE post_id = ? AND board_type = ?",
      [postId, boardType]
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
  const userId = req.user?.id; // 로그인된 사용자 ID
  const boardType = "haksik"; // 현재 게시판 타입 고정

  if (!userId) {
    return res.json({ liked: false });
  }

  try {
    const [result] = await pool.query(
      "SELECT COUNT(*) AS count FROM likes WHERE user_id = ? AND post_id = ? AND board_type = ?",
      [userId, postId, boardType]
    );
    res.json({ liked: result[0].count > 0 });
  } catch (error) {
    console.error("좋아요 상태 확인 오류:", error);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

module.exports = router;
