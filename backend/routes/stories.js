const express = require('express');
const { createStory, getFeedStories, likeStory, deleteStory, viewStory, repostStory } = require('../controllers/storyController');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post('/', authMiddleware, createStory);
router.get('/feed', authMiddleware, getFeedStories);
router.post('/:id/like', authMiddleware, likeStory);
router.post('/:id/view', authMiddleware, viewStory);
router.post('/:id/repost', authMiddleware, repostStory);
router.delete('/:id', authMiddleware, deleteStory);

module.exports = router;
