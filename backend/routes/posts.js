const express = require('express');
const { 
  createPost, 
  getFeed, 
  getUserPosts, 
  likePost, 
  addComment,
  getExplorePosts,
  toggleSavePost,
  getSavedPosts,
  deletePost
} = require('../controllers/postController');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post('/', authMiddleware, createPost);
router.get('/feed', authMiddleware, getFeed);
router.get('/explore', authMiddleware, getExplorePosts);
router.get('/user/:username', authMiddleware, getUserPosts);
router.post('/:id/like', authMiddleware, likePost);
router.post('/:id/comment', authMiddleware, addComment);
router.post('/:id/save', authMiddleware, toggleSavePost);
router.get('/saved', authMiddleware, getSavedPosts);
router.delete('/:id', authMiddleware, deletePost);

module.exports = router;
