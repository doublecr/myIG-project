const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const signup = async (req, res) => {
  try {
    const { username, email, password, phoneNumber } = req.body;

    // Check if user exists
    const query = [{ email }, { username }];
    if (phoneNumber) query.push({ phoneNumber });

    const existingUser = await User.findOne({ $or: query });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      phoneNumber
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      userId: user._id,
      username: user.username,
      avatar: user.avatar,
      message: 'User created successfully'
    });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong', error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email, username, or phone

    // Find user by email, username, or phone
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { username: identifier },
        { phoneNumber: identifier }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      userId: user._id,
      username: user.username,
      avatar: user.avatar,
      message: 'Logged in successfully'
    });
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong', error: err.message });
  }
};

module.exports = { signup, login };
