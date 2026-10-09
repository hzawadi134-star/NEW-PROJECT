// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

// 1. Middleware ya kulinda API (Mtumiaji lazima awe na Token halali)
exports.protect = async (req, res, next) => {
    let token;

    // Angalia kama token ipo kwenye Headers za ombi
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Haujaruhusiwa kuingia! Tafadhali weka token halali.' });
    }

    try {
        // Thibitisha token kama ni sahihi
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Weka taarifa za mtumiaji kwenye req object ili controllers zizitumie
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token sio halali au imหมหมหมหมหมหมหม expire!' });
    }
};

// 2. Middleware ya kukagua Majukumu (Role Authorization mfano: Admin Pekee)
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: 'Hauna mamlaka (Permission) ya kufanya zoezi hili kulingana na jukumu lako!' 
            });
        }
        next();
    };
};