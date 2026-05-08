const User = require('../models/User');

const getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password')
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.userId);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userToFollow.followers.includes(currentUser._id)) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    if (userToFollow.isPrivate) {
      if (!userToFollow.followRequests.includes(currentUser._id)) {
        userToFollow.followRequests.push(currentUser._id);
        userToFollow.notifications.push({ type: 'request', from: currentUser._id });
        await userToFollow.save();
        return res.status(200).json({ message: 'Request sent' });
      } else {
        return res.status(400).json({ message: 'Request already pending' });
      }
    }

    currentUser.following.push(userToFollow._id);
    userToFollow.followers.push(currentUser._id);
    userToFollow.notifications.push({ type: 'follow', from: currentUser._id });

    await currentUser.save();
    await userToFollow.save();

    res.status(200).json({ message: 'Followed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const unfollowUser = async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.userId);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    currentUser.following = currentUser.following.filter(id => id.toString() !== userToUnfollow._id.toString());
    userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== currentUser._id.toString());

    await currentUser.save();
    await userToUnfollow.save();

    res.status(200).json({ message: 'Unfollowed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getSuggestions = async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    const suggestions = await User.find({
      _id: { $nin: [...currentUser.following, currentUser._id] }
    })
    .limit(5)
    .select('username avatar');

    res.status(200).json(suggestions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(200).json([]);

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phoneNumber: { $regex: query, $options: 'i' } }
      ]
    })
    .limit(10)
    .select('username avatar bio');

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;
    const user = await User.findByIdAndUpdate(req.userId, { avatar }, { new: true }).select('-password');
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const handleFollowRequest = async (req, res) => {
  try {
    const { requesterId, action } = req.body;
    const currentUser = await User.findById(req.userId);

    if (action === 'accept') {
      currentUser.followers.push(requesterId);
      const requester = await User.findById(requesterId);
      requester.following.push(req.userId);
      await requester.save();
      // Optionally notify requester that they are now following
      currentUser.notifications.push({ type: 'follow', from: requesterId });
    }

    currentUser.followRequests = currentUser.followRequests.filter(id => id.toString() !== requesterId);
    await currentUser.save();
    res.status(200).json({ message: `Request ${action}ed` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { isPrivate } = req.body;
    const user = await User.findByIdAndUpdate(req.userId, { isPrivate }, { new: true }).select('-password');
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('notifications.from', 'username avatar')
      .populate('followRequests', 'username avatar');
    res.status(200).json({
      notifications: user.notifications.reverse(),
      requests: user.followRequests
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getUnreadNotificationsCount = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const count = user.notifications.filter(n => !n.read).length;
    res.status(200).json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const markNotificationsRead = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    user.notifications.forEach(n => n.read = true);
    await user.save();
    res.status(200).json({ message: 'Notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { username, bio } = req.body;
    
    // Check if username is already taken by someone else
    if (username) {
      const existingUser = await User.findOne({ username, _id: { $ne: req.userId } });
      if (existingUser) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.userId, 
      { username, bio }, 
      { new: true }
    ).select('-password');
    
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { 
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
};
