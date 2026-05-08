const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true, // Allows null/empty values to be unique
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: 'https://via.placeholder.com/150/222222/ffffff?text=User'
  },
  bio: {
    type: String,
    default: '',
    maxlength: 150
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  followRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  notifications: [{
    type: {
      type: String,
      enum: ['follow', 'request', 'like', 'comment', 'mention']
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    read: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  savedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }]
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;
