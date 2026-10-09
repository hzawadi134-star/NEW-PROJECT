// controllers/authController.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Kazi ya kutengeneza token
const signToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

// 1. API ya Kujisajili (Register User)
exports.register = async (req, res) => {
    const { username, email, password, role } = req.body;

    try {
        const userExists = await db.query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'Mtumiaji mwenye barua pepe au jina hili tayari yupo!' });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await db.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
            [username, email, hashedPassword, role || 'Intake_Officer']
        );

        res.status(201).json({
            message: 'Mtumiaji amesajiliwa salama!',
            user: newUser.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hitilafu imetokea kwenye server!' });
    }
};

// 2. API ya Kuingia Mfumo (Login User)
exports.login = async (req, res) => {
    const { email, username, password } = req.body;
    const identifier = email || username;

    try {
        if (!identifier || !password) {
            return res.status(400).json({ message: 'Tafadhali ingiza barua pepe/jina la mtumiaji na nenosiri!' });
        }

        const result = await db.query('SELECT * FROM users WHERE email = $1 OR username = $1', [identifier]);
        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Barua pepe/jina la mtumiaji au nenosiri si sahihi!' });
        }

        const user = result.rows[0];

        const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Barua pepe/jina la mtumiaji au nenosiri si sahihi!' });
        }

        const token = signToken(user.id, user.role);

        res.status(200).json({
            message: 'Umeingia kwenye mfumo kwa mafanikio!',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hitilafu imetokea kwenye server!' });
    }
};

// 3. API ya Kuona Watumiaji Wote (Get All Users)
exports.getAllUsers = async (req, res) => {
    try {
        const result = await db.query('SELECT id, username, email, role, is_active, created_at FROM users ORDER BY created_at DESC');
        res.status(200).json({
            count: result.rows.length,
            users: result.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hitilafu imetokea kwenye server!' });
    }
};

// 4. API ya Kuhariri Taarifa za Mtumiaji (Update User)
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, email, role, is_active } = req.body;

    try {
        const queryText = `
            UPDATE users 
            SET username = $1, email = $2, role = $3, is_active = $4 
            WHERE id = $5 
            RETURNING id, username, email, role, is_active;
        `;
        const result = await db.query(queryText, [username, email, role, is_active, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Mtumiaji halikupatikana!' });
        }

        res.status(200).json({
            message: 'Taarifa za mtumiaji zimeboreshwa kikamilifu!',
            user: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hitilafu imetokea wakati wa kuhariri mtumiaji!' });
    }
};

// 5. API ya Kufuta Mtumiaji (Delete User)
exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Mtumiaji halikupatikana!' });
        }

        res.status(200).json({ message: 'Mtumiaji amefutwa kikamilifu kutoka kwenye mfumo!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hitilafu imetokea wakati wa kufuta mtumiaji!' });
    }
};