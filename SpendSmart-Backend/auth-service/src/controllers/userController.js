const User = require('../models/User');

exports.findUserById = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.status(200).json({ user: user });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
}

exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const { name, email } = req.body;
        if (name) user.name = name;
        if (email) user.email = email;
        await user.save();
        res.status(200).json({ user: user });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
