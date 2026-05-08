const express = require('express');
const { sendMessage, getMessages, getConversations, markAsRead, deleteMessage, getUnreadCount } = require('../controllers/messageController');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post('/', authMiddleware, sendMessage);
router.get('/unread-count', authMiddleware, getUnreadCount);
router.get('/conversations', authMiddleware, getConversations);
router.get('/:userId', authMiddleware, getMessages);
router.patch('/:userId/read', authMiddleware, markAsRead);
router.delete('/:id', authMiddleware, deleteMessage);

module.exports = router;
