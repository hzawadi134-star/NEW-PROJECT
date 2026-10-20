const db = require('../config/db');

// 1. API ya Kufanya Triage na Kutengeneza Kesi (Triage & Create Case)
exports.createCaseFromIntake = async (req, res) => {
    const { intake_id, assigned_to } = req.body;

    try {
        // Kuchukua maelezo ya lalamiko
        const intakeResult = await db.query('SELECT description FROM fraud_intake WHERE id = $1', [intake_id]);
        if (intakeResult.rows.length === 0) {
            return res.status(404).json({ message: 'Lalamiko (Intake) halikupatikana!' });
        }

        const description = (intakeResult.rows[0].description || '').toLowerCase();
        let riskScore = 10; // Alama ya kuanzia

        // Algorithm ya kupiga hesabu (Risk Scoring Logic)
        if (description.includes('wagonjwa hewa') || description.includes('ghost patients')) riskScore += 40;
        if (description.includes('kadi') || description.includes('bima')) riskScore += 15;
        if (description.includes('ghushi') || description.includes('forge') || description.includes('madai')) riskScore += 25;
        if (description.includes('pesa') || description.includes('milioni') || description.includes('fedha')) riskScore += 10;

        if (riskScore > 100) riskScore = 100;

        // Kuamua Kiwango cha Hatari
        let riskLevel = 'Low';
        if (riskScore >= 30 && riskScore < 60) riskLevel = 'Medium';
        if (riskScore >= 60 && riskScore < 85) riskLevel = 'High';
        if (riskScore >= 85) riskLevel = 'Critical';

        const caseNumber = `ZHSF-CASE-${Math.floor(100000 + Math.random() * 900000)}`;

        // Kuingiza kwenye table ya cases
        const queryText = `
            INSERT INTO cases (intake_id, case_number, risk_score, risk_level, assigned_to, status)
            VALUES ($1, $2, $3, $4, $5, 'Assigned')
            RETURNING *;
        `;
        const values = [intake_id, caseNumber, riskScore, riskLevel, assigned_to || null];
        const newCase = await db.query(queryText, values);

        // Kubadili status ya lalamiko kuwa 'Deduplicated'
        await db.query("UPDATE fraud_intake SET status = 'Deduplicated' WHERE id = $1", [intake_id]);

        res.status(201).json({
            message: 'Kesi imetengenezwa na kufanyiwa Triage kikamilifu!',
            case_details: newCase.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hitilafu imetokea wakati wa kutengeneza kesi!' });
    }
};

// 2. API ya Kuona Kesi Zote (Get All Cases)
exports.getAllCases = async (req, res) => {
    try {
        const queryText = `
            SELECT c.*, fi.description, fi.source, fi.reported_by,
                   p.name as provider_name, m.full_name as member_name,
                   u.username as investigator_name 
            FROM cases c
            LEFT JOIN fraud_intake fi ON c.intake_id = fi.id
            LEFT JOIN providers p ON fi.provider_id = p.id
            LEFT JOIN members m ON fi.member_id = m.id
            LEFT JOIN users u ON c.assigned_to = u.id
            ORDER BY c.created_at DESC;
        `;
        const result = await db.query(queryText);
        res.status(200).json({
            count: result.rows.length,
            cases: result.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hitilafu imetokea wakati wa kuchukua orodha ya kesi!' });
    }
};

// 3. API ya Kuona Kesi Moja (Get Case By ID)
exports.getCaseById = async (req, res) => {
    const { id } = req.params;
    try {
        const queryText = `
            SELECT c.*, fi.description, fi.source, fi.reported_by,
                   p.name as provider_name, m.full_name as member_name,
                   u.username as investigator_name 
            FROM cases c
            LEFT JOIN fraud_intake fi ON c.intake_id = fi.id
            LEFT JOIN providers p ON fi.provider_id = p.id
            LEFT JOIN members m ON fi.member_id = m.id
            LEFT JOIN users u ON c.assigned_to = u.id
            WHERE c.id = $1 OR c.case_number = $1;
        `;
        const result = await db.query(queryText, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Kesi haikupatikana!' });
        }
        res.status(200).json({ case: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hitilafu imetokea wakati wa kutafuta kesi!' });
    }
};

// 4. API ya Kugawa Kesi kwa Afisa (Assign Case)
exports.assignCase = async (req, res) => {
    const { id } = req.params;
    const { assigned_to, assigned_date, assignment_status, status } = req.body;

    try {
        const queryText = `
            UPDATE cases 
            SET assigned_to = COALESCE($1, assigned_to),
                assigned_date = COALESCE($2, assigned_date, CURRENT_DATE),
                assignment_status = COALESCE($3, 'Assigned'),
                status = COALESCE($4, 'Under_Investigation'),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $5 OR case_number = $5
            RETURNING *;
        `;
        const result = await db.query(queryText, [
            assigned_to || null,
            assigned_date || new Date(),
            assignment_status || 'Assigned',
            status || 'Assigned',
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Kesi haikupatikana!' });
        }

        res.status(200).json({
            message: 'Kesi imegawiwa kikamilifu!',
            case: result.rows[0]
        });
    } catch (error) {
        console.error('Assign case error:', error);
        res.status(500).json({ message: 'Hitilafu imetokea wakati wa kugawa kesi: ' + error.message });
    }
};

// 5. API ya Kuboresha Kesi (Update Case Status/Details)
exports.updateCase = async (req, res) => {
    const { id } = req.params;
    const { status, risk_score, risk_level, assignment_status } = req.body;

    try {
        const queryText = `
            UPDATE cases 
            SET status = COALESCE($1, status),
                risk_score = COALESCE($2, risk_score),
                risk_level = COALESCE($3, risk_level),
                assignment_status = COALESCE($4, assignment_status),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $5 OR case_number = $5
            RETURNING *;
        `;
        const result = await db.query(queryText, [status, risk_score, risk_level, assignment_status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Kesi haikupatikana!' });
        }

        res.status(200).json({
            message: 'Kesi imeboreshwa kikamilifu!',
            case: result.rows[0]
        });
    } catch (error) {
        console.error('Update case error:', error);
        res.status(500).json({ message: 'Hitilafu imetokea wakati wa kuboresha kesi!' });
    }
};