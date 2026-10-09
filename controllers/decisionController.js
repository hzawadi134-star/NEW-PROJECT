
// controllers/decisionController.js
const db = require('../config/db');

// 1. API ya Kutoa Uamuzi (POST)
exports.createDecision = async (req, res) => {
    const { case_id, classification, decision, sanction_type, amount_to_recover, decided_by } = req.body;
    try {
        const caseExists = await db.query('SELECT * FROM cases WHERE id = \$1', [case_id]);
        if (caseExists.rows.length === 0) {
            return res.status(404).json({ message: 'Kesi haikupatikana!' });
        }
        const queryText = `
            INSERT INTO case_decisions (case_id, classification, decision, sanction_type, amount_to_recover, decided_by)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
        `;
        const values = [case_id, classification, decision, sanction_type, amount_to_recover || 0.00, decided_by];
        const newDecision = await db.query(queryText, values);
        await db.query("UPDATE cases SET status = 'Closed', updated_at = CURRENT_TIMESTAMP WHERE id = \$1", [case_id]);
        res.status(201).json({ message: 'Maamuzi yamehifadhiwa! ⚖️', decision_details: newDecision.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hitilafu imetokea!' });
    }
};

// 2. API ya Kuona Ripoti ya Kesi Maalum (GET /case/:case_id)
exports.getCaseDecision = async (req, res) => {
    const { case_id } = req.params;
    try {
        const queryText = `
            SELECT cd.*, c.case_number, c.risk_level, u.username as officer_name 
            FROM case_decisions cd JOIN cases c ON cd.case_id = c.id
            LEFT JOIN users u ON cd.decided_by = u.id WHERE cd.case_id = $1;
        `;
        const result = await db.query(queryText, [case_id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Kesi hii bado haina maamuzi!' });
        }
        res.status(200).json({ decision: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hitilafu imetokea!' });
    }
};

// 3. API ya Kuona Maamuzi Yote (GET /) <-- HAPA NDIPO PALIPOLETWA KOSA
exports.getAllDecisions = async (req, res) => {
    try {
        const queryText = `
            SELECT cd.*, c.case_number, c.risk_level, u.username as officer_name 
            FROM case_decisions cd JOIN cases c ON cd.case_id = c.id
            LEFT JOIN users u ON cd.decided_by = u.id ORDER BY cd.decided_at DESC;
        `;
        const result = await db.query(queryText);
        res.status(200).json({ count: result.rows.length, decisions: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hitilafu imetokea wakati wa kuchukua orodha!' });
    }
};

// 4. API ya Kuhariri Maamuzi (PUT)
exports.updateDecision = async (req, res) => {
    const { id } = req.params;
    const { classification, decision, sanction_type, amount_to_recover } = req.body;
    try {
        const queryText = `
            UPDATE case_decisions SET classification = $1, decision = $2, sanction_type = $3, amount_to_recover = $4
            WHERE id = $5 RETURNING *;
        `;
        const result = await db.query(queryText, [classification, decision, sanction_type, amount_to_recover, id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Maamuzi hayapo!' });
        res.status(200).json({ message: 'Yameboreshwa! ⚖️', updated_decision: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hitilafu imetokea!' });
    }
};

// 5. API ya Kufuta Maamuzi (DELETE)
exports.deleteDecision = async (req, res) => {
    const { id } = req.params;
    try {
        const decisionResult = await db.query('SELECT case_id FROM case_decisions WHERE id = \$1', [id]);
        if (decisionResult.rows.length === 0) return res.status(404).json({ message: 'Maamuzi hayapo!' });
        const case_id = decisionResult.rows[0].case_id;
        await db.query('DELETE FROM case_decisions WHERE id = \$1', [id]);
        await db.query("UPDATE cases SET status = 'Under_Investigation' WHERE id = \$1", [case_id]);
        res.status(200).json({ message: 'Maamuzi yamefutwa kikamilifu!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Hitilafu imetokea!' });
    }
};
