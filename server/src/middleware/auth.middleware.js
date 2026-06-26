const jwt = require('jsonwebtoken');
const db = require('../utils/db');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        req.userId = decoded.id;
        req.roleId = decoded.roleId;
        req.roleName = decoded.roleName;
        req.rolePermissions = decoded.rolePermissions;
        next();
    });
};

const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.roleName) {
            return res.status(403).json({ message: 'Role not found' });
        }

        // Superadmin always has access
        if (req.roleName === 'Superadmin') return next();

        if (allowedRoles.includes(req.roleName)) {
            next();
        } else {
            res.status(403).json({ message: `Access denied. Requires one of: ${allowedRoles.join(', ')}` });
        }
    };
};

// Always reads permissions fresh from DB to reflect latest role changes
const checkPagePermission = (pageKey) => {
    return async (req, res, next) => {
        if (!req.roleName) {
            return res.status(403).json({ message: 'Role not found' });
        }

        // Superadmin always has access
        if (req.roleName === 'Superadmin') return next();

        try {
            // Query DB for the latest permissions (not from JWT which can be stale)
            const [rows] = await db.query(
                'SELECT r.permissions FROM Role r JOIN User u ON u.roleId = r.id WHERE u.id = ? LIMIT 1',
                [req.userId]
            );

            if (!rows || rows.length === 0) {
                return res.status(403).json({ message: 'Role not found in database' });
            }

            let permissions = rows[0].permissions;
            if (typeof permissions === 'string') {
                try {
                    permissions = JSON.parse(permissions);
                } catch (e) {
                    permissions = null;
                }
            }

            if (permissions && permissions.pages && permissions.pages[pageKey] === true) {
                return next();
            }

            res.status(403).json({ message: `Access denied. Page '${pageKey}' is not allowed for your role.` });
        } catch (error) {
            console.error('checkPagePermission error:', error);
            res.status(500).json({ message: 'Server error checking permissions' });
        }
    };
};

module.exports = { verifyToken, checkRole, checkPagePermission };