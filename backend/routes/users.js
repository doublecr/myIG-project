const express = require('express');
const { 
  getProfile, 
  followUser, 
  unfollowUser, 
  getSuggestions, 
  searchUsers, 
  updateAvatar,
  handleFollowRequest,
  updateSettings,
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationsRead,
  updateProfile
} = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.get('/profile/:username', getProfile);
router.get('/search', authMiddleware, searchUsers);
router.get('/suggestions', authMiddleware, getSuggestions);
router.get('/notifications', authMiddleware, getNotifications);
router.get('/notifications/unread-count', authMiddleware, getUnreadNotificationsCount);
router.post('/notifications/read', authMiddleware, markNotificationsRead);
router.post('/follow/:id', authMiddleware, followUser);
router.post('/unfollow/:id', authMiddleware, unfollowUser);
router.post('/follow-request', authMiddleware, handleFollowRequest);
router.patch('/avatar', authMiddleware, updateAvatar);
router.patch('/profile/update', authMiddleware, updateProfile);
router.patch('/settings', authMiddleware, updateSettings);

module.exports = router;
