const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();

const db = require('../utils/db');

const { verifyToken } = require('../middleware/auth.middleware');

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const query = `
            SELECT u.*, r.name as roleName, r.permissions as rolePermissions 
            FROM User u 
            JOIN Role r ON u.roleId = r.id 
            WHERE u.username = ?
        `;
        const [userRows] = await db.query(query, [username]);

        if (!userRows || userRows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = userRows[0];

        if (user.is_approved === 0) {
            return res.status(403).json({ message: 'Registration is pending admin approval' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email, roleId: user.roleId, roleName: user.roleName, rolePermissions: user.rolePermissions },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.roleName,
                permissions: typeof user.rolePermissions === 'string' ? JSON.parse(user.rolePermissions) : (user.rolePermissions || {}),
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error: ' + error.message, stack: error.stack });
    }
});

router.get('/me', verifyToken, async (req, res) => {
    try {
        const query = `
            SELECT u.id, u.username, u.email, r.name as roleName, r.permissions as rolePermissions
            FROM User u
            JOIN Role r ON u.roleId = r.id
            WHERE u.id = ?
        `;
        const [rows] = await db.query(query, [req.userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = rows[0];
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.roleName,
            permissions: typeof user.rolePermissions === 'string' ? JSON.parse(user.rolePermissions) : (user.rolePermissions || {})
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Check user existence
        const [existingUsers] = await db.query(
            'SELECT id FROM User WHERE username = ? OR email = ? LIMIT 1',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        // Get 'User' role ID
        const [roles] = await db.query('SELECT id FROM Role WHERE name = ? LIMIT 1', ['User']);
        if (roles.length === 0) {
            return res.status(500).json({ message: 'User role not configured in database' });
        }

        const roleId = roles[0].id;
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user pending approval
        await db.query(
            'INSERT INTO User (username, email, password, roleId, is_approved, createdAt, updatedAt) VALUES (?, ?, ?, ?, 0, NOW(), NOW())',
            [username, email, hashedPassword, roleId]
        );

        res.status(201).json({ message: 'Registration created, waiting for admin approval.' });
    } catch (error) {
        console.error("Error creating registration:", error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

module.exports = router;
