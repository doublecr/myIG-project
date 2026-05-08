const Story = require('../models/Story');
const User = require('../models/User');

const createStory = async (req, res) => {
  try {
    const { imageUrl, mentions } = req.body; // mentions is an array of user IDs
    const newStory = new Story({
      user: req.userId,
      imageUrl,
      mentions: mentions || []
    });
    await newStory.save();

    // Send notifications to mentioned users
    if (mentions && mentions.length > 0) {
      await Promise.all(mentions.map(async (userId) => {
        const user = await User.findById(userId);
        if (user) {
          user.notifications.push({
            type: 'mention',
            from: req.userId,
            read: false
          });
          await user.save();
        }
      }));
    }

    res.status(201).json(newStory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const repostStory = async (req, res) => {
  try {
    const originalStory = await Story.findById(req.params.id);
    if (!originalStory) return res.status(404).json({ message: 'Original story not found' });

    const newStory = new Story({
      user: req.userId,
      imageUrl: originalStory.imageUrl,
      repostOf: originalStory._id
    });
    await newStory.save();
    res.status(201).json(newStory);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getFeedStories = async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    // Find stories from users current user follows + their own + public accounts
    const publicUsers = await User.find({ isPrivate: false }).select('_id');
    const publicUserIds = publicUsers.map(u => u._id);

    const stories = await Story.find({
      $or: [
        { user: { $in: [...currentUser.following, req.userId] } },
        { user: { $in: publicUserIds } }
      ],
      expiresAt: { $gt: new Date() }
    })
    .sort({ createdAt: -1 })
    .populate('user', 'username avatar')
    .populate('views', 'username avatar');

    res.status(200).json(stories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const likeStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (story.likes.includes(req.userId)) {
      story.likes = story.likes.filter(id => id.toString() !== req.userId);
    } else {
      story.likes.push(req.userId);
      // Add notification to story owner
      if (story.user.toString() !== req.userId) {
        const storyOwner = await User.findById(story.user);
        storyOwner.notifications.push({
          type: 'like',
          from: req.userId,
          read: false
        });
        await storyOwner.save();
      }
    }
    await story.save();
    res.status(200).json(story);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    if (story.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Story.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Story deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const viewStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    // Don't count owner's own view
    if (story.user.toString() !== req.userId && !story.views.includes(req.userId)) {
      story.views.push(req.userId);
      await story.save();
    }
    res.status(200).json({ message: 'View recorded' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createStory, getFeedStories, likeStory, deleteStory, viewStory, repostStory };
