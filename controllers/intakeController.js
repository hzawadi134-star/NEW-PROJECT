const db = require('../config/db');

// 1. API ya Kuingiza Lalamiko Jipya (Create Fraud Intake)
exports.createIntake = async (req, res) => {
    const { source, description, reported_by, provider_id, member_id } = req.body;

    try {
        const queryText = `
            INSERT INTO fraud_intake (source, description, reported_by, provider_id, member_id, status) 
            VALUES ($1, $2, $3, $4, $5, 'Pending_Validation') 
            RETURNING *;
        `;
        const values = [
            source || 'Whistleblower',
            description || 'Taarifa ya udanganyifu',
            reported_by || 'Mwananchi',
            provider_id || null,
            member_id || null
        ];
        
        const result = await db.query(queryText, values);

        res.status(201).json({
            message: 'Taarifa ya udanganyifu imepokelewa kikamilifu!',
            intake: result.rows[0]
        });
    } catch (error) {
        console.error('Create intake error:', error);
        res.status(500).json({ message: 'Hitilafu imetokea wakati wa kuhifadhi lalamiko: ' + error.message });
    }
};

// 2. API ya Kuona Malalamiko Yote (Get All Intakes)
exports.getAllIntakes = async (req, res) => {
    try {
        const queryText = `
            SELECT fi.*, p.name as provider_name, m.full_name as member_name 
            FROM fraud_intake fi
            LEFT JOIN providers p ON fi.provider_id = p.id
            LEFT JOIN members m ON fi.member_id = m.id
            ORDER BY fi.created_at DESC;
        `;
        const result = await db.query(queryText);

        res.status(200).json({
            count: result.rows.length,
            intakes: result.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hitilafu imetokea wakati wa kuchukua taarifa!' });
    }
};

// 3. API ya Kuhariri Lalamiko (Update Intake)
exports.updateIntake = async (req, res) => {
    const { id } = req.params;
    const { source, description, reported_by, status } = req.body;

    try {
        const queryText = `
            UPDATE fraud_intake 
            SET source = COALESCE($1, source), 
                description = COALESCE($2, description), 
                reported_by = COALESCE($3, reported_by), 
                status = COALESCE($4, status) 
            WHERE id = $5 
            RETURNING *;
        `;
        const result = await db.query(queryText, [source, description, reported_by, status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Lalamiko halikupatikana!' });
        }

        res.status(200).json({
            message: 'Lalamiko limeboreshwa kikamilifu!',
            intake: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hitilafu imetokea wakati wa kuhariri lalamiko!' });
    }
};

// 4. API ya Kufuta Lalamiko (Delete Fraud Intake)
exports.deleteIntake = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('DELETE FROM fraud_intake WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Lalamiko halikupatikana!' });
        }

        res.status(200).json({ message: 'Lalamiko limefutwa kikamilifu!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hitilafu imetokea wakati wa kufuta lalamiko!' });
    }
};