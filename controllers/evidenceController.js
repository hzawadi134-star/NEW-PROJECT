const db = require('../config/db');

// 1. API ya Kupandisha Ushahidi (Upload Evidence)
exports.uploadEvidence = async (req, res) => {
    let { case_id, uploaded_by } = req.body;

    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Tafadhali chagua faili la ushahidi la kupandisha!' });
        }

        // Tafuta numeric case_id kama kesi imetumwa kama namba ya kesi (case_number)
        let resolvedCaseId = parseInt(case_id, 10);
        if (isNaN(resolvedCaseId) && case_id) {
            const caseLookup = await db.query(
                'SELECT id FROM cases WHERE case_number = $1 OR case_number ILIKE $2',
                [case_id, `%${case_id}%`]
            );
            if (caseLookup.rows.length > 0) {
                resolvedCaseId = caseLookup.rows[0].id;
            }
        }

        // Kama bado haijapatikana kesi yoyote, tafuta kesi ya kwanza au weka null
        if (isNaN(resolvedCaseId)) {
            const anyCase = await db.query('SELECT id FROM cases ORDER BY id DESC LIMIT 1');
            resolvedCaseId = anyCase.rows.length > 0 ? anyCase.rows[0].id : null;
        }

        const file_name = req.file.originalname;
        const normalizedPath = req.file.path.replace(/\\/g, '/');
        const fileUrl = `${req.protocol}://${req.get('host')}/${normalizedPath}`;

        const queryText = `
            INSERT INTO evidence (case_id, file_name, file_path, uploaded_by) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *;
        `;
        const values = [resolvedCaseId, file_name, normalizedPath, uploaded_by || req.user?.id || null];
        const result = await db.query(queryText, values);

        const savedEvidence = {
            ...result.rows[0],
            file_url: fileUrl,
            fileUrl: fileUrl,
            fileName: file_name,
        };

        res.status(201).json({
            message: 'Ushahidi umepandishwa na kuhifadhiwa kikamilifu! 📁',
            evidence: savedEvidence
        });

    } catch (error) {
        console.error('Upload evidence error:', error);
        res.status(500).json({ message: 'Hitilafu imetokea wakati wa kupandisha ushahidi: ' + error.message });
    }
};

// 2. API ya Kuona Ushahidi Wote wa Kesi Maalum (Get Evidence by Case ID)
exports.getEvidenceByCase = async (req, res) => {
    const { case_id } = req.params;

    try {
        let resolvedCaseId = parseInt(case_id, 10);
        if (isNaN(resolvedCaseId)) {
            const caseLookup = await db.query(
                'SELECT id FROM cases WHERE case_number = $1 OR case_number ILIKE $2',
                [case_id, `%${case_id}%`]
            );
            if (caseLookup.rows.length > 0) {
                resolvedCaseId = caseLookup.rows[0].id;
            }
        }

        const queryText = `
            SELECT e.*, c.case_number, u.username as uploaded_by_name 
            FROM evidence e
            LEFT JOIN cases c ON e.case_id = c.id
            LEFT JOIN users u ON e.uploaded_by = u.id
            WHERE e.case_id = $1
            ORDER BY e.uploaded_at DESC;
        `;
        const result = await db.query(queryText, [resolvedCaseId || 0]);

        const formatted = result.rows.map(item => ({
            ...item,
            file_url: `${req.protocol}://${req.get('host')}/${item.file_path}`,
            fileUrl: `${req.protocol}://${req.get('host')}/${item.file_path}`,
            fileName: item.file_name,
        }));

        res.status(200).json({
            count: formatted.length,
            evidence: formatted
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hitilafu imetokea wakati wa kuchukua ushahidi!' });
    }
};

// 3. API ya Kuona Ushahidi Wote (Get All Evidence)
exports.getAllEvidence = async (req, res) => {
    try {
        const queryText = `
            SELECT e.*, c.case_number, u.username as uploaded_by_name 
            FROM evidence e
            LEFT JOIN cases c ON e.case_id = c.id
            LEFT JOIN users u ON e.uploaded_by = u.id
            ORDER BY e.uploaded_at DESC;
        `;
        const result = await db.query(queryText);

        const formatted = result.rows.map(item => ({
            ...item,
            file_url: `${req.protocol}://${req.get('host')}/${item.file_path}`,
            fileUrl: `${req.protocol}://${req.get('host')}/${item.file_path}`,
            fileName: item.file_name,
        }));

        res.status(200).json({
            count: formatted.length,
            evidence: formatted
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hitilafu imetokea wakati wa kuchukua orodha ya ushahidi!' });
    }
};

// 4. API ya Kufuta Ushahidi (Delete Evidence)
exports.deleteEvidence = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM evidence WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Ushahidi haukupatikana!' });
        }
        res.status(200).json({ message: 'Ushahidi umefutwa kikamilifu!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hitilafu imetokea wakati wa kufuta ushahidi!' });
    }
};