const express = require('express');
const router = express.Router();
//const mysql = require('mysql2');
const pool = require('../config/db'); // 데이터베이스 연결 모듈


// 게시글 목록 조회 API (GET /free/posts)
router.get('/posts', (req, res) => {
  const query = 'SELECT * FROM posts WHERE board_type = "free" ORDER BY created_at DESC';
  pool.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: '게시물 조회에 실패했습니다.' });
    }
    res.status(200).json(results);
  });
});

// 특정 게시글 상세 조회 API (GET /free/posts/:id)
router.get('/posts/:id', (req, res) => {
  const postId = req.params.id;
  const query = `
  SELECT p.*, u.nickname AS author, u.id AS author_id
  FROM posts p
  JOIN users u ON p.user_id = u.id
  WHERE p.post_id = ? AND p.board_type = "free"
`;


  pool.query(query, [postId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: '게시물 조회에 실패했습니다.' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: '게시물이 존재하지 않습니다.' });
    }
    res.status(200).json(results[0]); // 작성자 정보 포함
  });
});

// 댓글 작성 API (POST /free/posts/:id/comments)
router.post('/posts/:id/comments', (req, res) => {
  const postId = req.params.id; // 게시글 ID
  const userId = req.user.id; // 현재 로그인한 사용자 ID (app.js에서 설정됨)
  const { content } = req.body; // 클라이언트에서 보낸 댓글 내용

  if (!content) {
    return res.status(400).json({ message: '댓글 내용을 입력하세요.' });
  }

  const query = `
  INSERT INTO comments (post_id, user_id, content, created_at, likes)
  VALUES (?, ?, ?, NOW(), 0)
`;


  pool.query(query, [postId, userId, content], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: '댓글 작성에 실패했습니다.' });
    }

    res.status(201).json({ message: '댓글이 작성되었습니다.', commentId: result.insertId });
  });
});

// 댓글 조회 API (GET /free/posts/:id/comments)
router.get('/posts/:id/comments', (req, res) => {
  const postId = req.params.id;
  const query = `
  SELECT c.comment_id, c.content, c.created_at, c.likes, u.nickname AS author
  FROM comments c
  LEFT JOIN users u ON c.user_id = u.id
  WHERE c.post_id = ?
  ORDER BY c.created_at DESC
`;


  pool.query(query, [postId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: '댓글 조회에 실패했습니다.' });
    }
    res.status(200).json(results);
  });
});

// 댓글 좋아요 API (POST /free/comments/:id/like)
router.post('/comments/:id/like', (req, res) => {
  const commentId = req.params.id;
  const updateQuery = 'UPDATE comments SET likes = likes + 1 WHERE comment_id = ?';

  pool.query(updateQuery, [commentId], (err) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: '좋아요 처리 중 오류가 발생했습니다.' });
    }
    res.status(201).json({ message: '좋아요가 추가되었습니다.' });
  });
});

// 게시글 수정 API (PUT /free/posts/:id)
router.put('/posts/:id', (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  const { content } = req.body; // 클라이언트에서 전달된 수정 내용

  if (!content) {
    return res.status(400).json({ message: '내용을 입력하세요.' });
  }

  const query = 'UPDATE posts SET content = ? WHERE post_id = ? AND user_id = ? AND board_type = "free"';

  pool.query(query, [content, postId, userId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: '게시글 수정에 실패했습니다.' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: '게시글이 존재하지 않거나 수정 권한이 없습니다.' });
    }

    res.status(200).json({ message: '게시글이 수정되었습니다.' });
  });
});

// 게시글 삭제 API (DELETE /free/posts/:id)
router.delete('/posts/:id', (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  // 댓글 삭제 후 게시글 삭제
  const deleteCommentsQuery = 'DELETE FROM comments WHERE post_id = ?';

  pool.query(deleteCommentsQuery, [postId], (err) => {
    if (err) {
      console.error('댓글 삭제 중 오류 발생:', err);
      return res.status(500).json({ message: '댓글 삭제에 실패했습니다.' });
    }

    // 댓글 삭제 후 게시글 삭제
    const deletePostQuery = 'DELETE FROM posts WHERE post_id = ? AND user_id = ? AND board_type = "free"';

    pool.query(deletePostQuery, [postId, userId], (err, result) => {
      if (err) {
        console.error('게시글 삭제 중 오류 발생:', err);
        return res.status(500).json({ message: '게시글 삭제에 실패했습니다.' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: '게시글이 존재하지 않거나 삭제 권한이 없습니다.' });
      }

      res.status(200).json({ message: '게시글 및 관련 댓글이 삭제되었습니다.' });
    });
  });
});


// 검색 기능 API (GET /free/search)
router.get('/search', (req, res) => {
  const query = req.query.query; // 클라이언트에서 보낸 검색어
  if (!query) {
    return res.status(400).json({ message: '검색어가 없습니다.' });
  }

  const searchQuery = `
  SELECT * FROM posts
  WHERE board_type = "free" AND (title LIKE ? OR content LIKE ?)
  ORDER BY created_at DESC
`;


  pool.query(searchQuery, [`%${query}%`, `%${query}%`], (err, results) => {
    if (err) {
      console.error('검색 중 오류 발생:', err);
      return res.status(500).json({ message: '검색 중 오류가 발생했습니다.' });
    }
    res.status(200).json(results);
  });
});

module.exports = router;
