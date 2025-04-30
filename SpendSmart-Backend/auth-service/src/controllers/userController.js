const User = require('../models/User');

exports.findUserById = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.status(200).json({ user: user });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
}