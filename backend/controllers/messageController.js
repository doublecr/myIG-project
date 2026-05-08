const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');

const sendMessage = async (req, res) => {
  try {
    const { receiverId, text, messageType, audioUrl, imageUrl, videoUrl } = req.body;
    const newMessage = new Message({
      sender: req.userId,
      receiver: receiverId,
      text,
      messageType,
      audioUrl,
      imageUrl,
      videoUrl
    });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.sender.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this message' });
    }
    await Message.findByIdAndDelete(id);
    res.status(200).json({ message: 'Message unsent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: req.userId, receiver: userId },
        { sender: userId, receiver: req.userId }
      ]
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getConversations = async (req, res) => {
  try {
    const currentUserId = new mongoose.Types.ObjectId(req.userId);
    
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: currentUserId }, { receiver: currentUserId }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", currentUserId] },
              "$receiver",
              "$sender"
            ]
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$receiver", currentUserId] }, { $eq: ["$isRead", false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: "$user._id",
          username: "$user.username",
          avatar: "$user.avatar",
          lastMessageText: "$lastMessage.text",
          lastMessageType: "$lastMessage.messageType",
          lastMessageAt: "$lastMessage.createdAt",
          unreadCount: 1
        }
      },
      { $sort: { lastMessageAt: -1 } }
    ]);

    res.status(200).json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    await Message.updateMany(
      { sender: userId, receiver: req.userId, isRead: false },
      { $set: { isRead: true } }
    );
    res.status(200).json({ message: 'Messages marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({ receiver: req.userId, isRead: false });
    res.status(200).json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { sendMessage, getMessages, getConversations, markAsRead, deleteMessage, getUnreadCount };
