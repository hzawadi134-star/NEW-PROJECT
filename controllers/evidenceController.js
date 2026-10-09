const db = require('../config/db');

// 1. API ya Kupandisha Ushahidi (Upload Evidence)
exports.uploadEvidence = async (req, res) => {
    const { case_id, uploaded_by } = req.body;

    try {
        // Angalia kama mchunguzi ameweka faili halisi
        if (!req.file) {
            return res.status(400).json({ message: 'Tafadhali chagua faili la ushahidi la kupandisha!' });
        }

        const file_name = req.file.originalname;
        const file_path = req.file.path; // Sehemu faili lilipohifadhiwa kwenye server

        // Ingiza taarifa za ushahidi kwenye table ya evidence
        const queryText = `
            INSERT INTO evidence (case_id, file_name, file_path, uploaded_by) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *;
        `;
        const values = [case_id, file_name, file_path, uploaded_by || null];
        const result = await db.query(queryText, values);

        res.status(201).json({
            message: 'Ushahidi umepandishwa na kuhifadhiwa kikamilifu! 📁',
            evidence: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hitilafu imetokea wakati wa kupandisha ushahidi!' });
    }
};

// 2. API ya Kuona Ushahidi Wote wa Kesi Maalum (Get Evidence by Case ID)
exports.getEvidenceByCase = async (req, res) => {
    const { case_id } = req.params;

    try {
        const queryText = `
            SELECT e.*, u.username as uploaded_by_name 
            FROM evidence e
            LEFT JOIN users u ON e.uploaded_by = u.id
            WHERE e.case_id = $1
            ORDER BY e.uploaded_at DESC;
        `;
        const result = await db.query(queryText, [case_id]);

        res.status(200).json({
            count: result.rows.length,
            evidence: result.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hitilafu imetokea wakati wa kuchukua ushahidi!' });
    }
};