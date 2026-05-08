const Post = require('../models/Post');
const User = require('../models/User');

const createPost = async (req, res) => {
  try {
    const { imageUrl, caption, mediaType } = req.body;
    const newPost = new Post({
      user: req.userId,
      imageUrl,
      caption,
      mediaType: mediaType || 'image'
    });
    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getFeed = async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    // Find posts from users current user follows + their own posts
    const posts = await Post.find({
      user: { $in: [...currentUser.following, req.userId] }
    })
    .sort({ createdAt: -1 })
    .populate('user', 'username avatar')
    .populate('comments.user', 'username');

    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const posts = await Post.find({ user: user._id }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const index = post.likes.indexOf(req.userId);
    if (index === -1) {
      post.likes.push(req.userId);
      // Add notification to post owner
      if (post.user.toString() !== req.userId) {
        const postOwner = await User.findById(post.user);
        postOwner.notifications.push({
          type: 'like',
          from: req.userId,
          read: false
        });
        await postOwner.save();
      }
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({ user: req.userId, text });
    await post.save();
    
    const updatedPost = await Post.findById(req.params.id).populate('comments.user', 'username');
    res.status(201).json(updatedPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getExplorePosts = async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    // Fetch posts: 
    // 1. Not from current user
    // 2. Either the user is Public OR current user is already following them
    const posts = await Post.find({
      user: { $ne: req.userId }
    })
    .populate({
      path: 'user',
      select: 'username avatar isPrivate followers'
    })
    .sort({ createdAt: -1 })
    .limit(30);

    // Filter out private accounts not followed by current user
    const filteredPosts = posts.filter(post => {
      if (!post.user.isPrivate) return true;
      return post.user.followers.includes(req.userId);
    });

    res.status(200).json(filteredPosts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const toggleSavePost = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const postId = req.params.id;

    if (user.savedPosts.includes(postId)) {
      user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId);
      await user.save();
      return res.status(200).json({ message: 'Post unsaved', saved: false });
    }

    user.savedPosts.push(postId);
    await user.save();
    res.status(200).json({ message: 'Post saved', saved: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getSavedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const posts = await Post.find({
      _id: { $in: user.savedPosts }
    })
    .sort({ createdAt: -1 })
    .populate('user', 'username avatar');

    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Check if user is the author
    if (post.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { 
  createPost, 
  getFeed, 
  getUserPosts, 
  likePost, 
  addComment, 
  getExplorePosts, 
  toggleSavePost,
  getSavedPosts,
  deletePost
};
