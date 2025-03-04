const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth');
const pool = require('../config/db'); // 데이터베이스 연결 설정

// 게시글 목록 조회 API (GET /free/posts)
router.get('/posts', async (req, res) => {
  const query = 'SELECT * FROM posts WHERE board_type = "free" ORDER BY created_at DESC';

  try {
    const [results] = await pool.query(query);
    res.status(200).json(results);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: '게시물 조회에 실패했습니다.' });
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
          SET title = ?, content = ?
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

  const deleteCommentsQuery = 'DELETE FROM comments WHERE post_id = ?';
  const deletePostQuery = 'DELETE FROM posts WHERE post_id = ? AND user_id = ? AND board_type = "free"';


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

module.exports = router;
