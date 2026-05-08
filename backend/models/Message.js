const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: function() { return this.messageType === 'text'; }
  },
  audioUrl: {
    type: String
  },
  imageUrl: {
    type: String
  },
  videoUrl: {
    type: String
  },
  messageType: {
    type: String,
    enum: ['text', 'audio', 'image', 'video'],
    default: 'text'
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
