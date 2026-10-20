const db = require('../config/db');

// 1. GET all providers with case counts and risk summary
exports.getAllProviders = async (req, res) => {
    try {
        const queryText = `
            SELECT p.*,
                   COUNT(fi.id) as case_count
            FROM providers p
            LEFT JOIN fraud_intake fi ON fi.provider_id = p.id
            GROUP BY p.id
            ORDER BY p.name ASC;
        `;
        const result = await db.query(queryText);
        res.status(200).json({
            count: result.rows.length,
            providers: result.rows
        });
    } catch (error) {
        console.error('Error fetching providers:', error);
        res.status(500).json({ message: 'Hitilafu imetokea wakati wa kuchukua orodha ya vituo!' });
    }
};

// 2. CREATE new provider
exports.createProvider = async (req, res) => {
    const { provider_code, name, type, location, status } = req.body;
    try {
        const queryText = `
            INSERT INTO providers (provider_code, name, type, location, status)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const code = provider_code || `FAC-${Math.floor(100 + Math.random() * 900)}`;
        const values = [code, name, type || 'Hospital', location || 'Zanzibar', status || 'Active'];
        const result = await db.query(queryText, values);
        res.status(201).json({
            message: 'Kituo cha afya kimesajiliwa kikamilifu!',
            provider: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating provider:', error);
        res.status(500).json({ message: 'Hitilafu wakati wa kusajili kituo!' });
    }
};
