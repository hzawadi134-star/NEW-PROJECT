const db = require('../config/db');

// 1. GET all members with associated cases count
exports.getAllMembers = async (req, res) => {
    try {
        const queryText = `
            SELECT m.*,
                   COUNT(fi.id) as case_count
            FROM members m
            LEFT JOIN fraud_intake fi ON fi.member_id = m.id
            GROUP BY m.id
            ORDER BY m.full_name ASC;
        `;
        const result = await db.query(queryText);
        res.status(200).json({
            count: result.rows.length,
            members: result.rows
        });
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({ message: 'Hitilafu imetokea wakati wa kuchukua wanachama!' });
    }
};

// 2. CREATE new member
exports.createMember = async (req, res) => {
    const { member_number, full_name, gender, dob, status } = req.body;
    try {
        const queryText = `
            INSERT INTO members (member_number, full_name, gender, dob, status)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const num = member_number || `ZHSF-MEM-${Math.floor(1000 + Math.random() * 9000)}`;
        const resolvedGender = (gender && String(gender).toLowerCase().startsWith('f')) ? 'Female' : 'Male';
        const values = [num, full_name, resolvedGender, dob || '1990-01-01', status || 'Active'];
        const result = await db.query(queryText, values);
        res.status(201).json({
            message: 'Mwanachama amesajiliwa kikamilifu!',
            member: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating member:', error);
        res.status(500).json({ message: 'Hitilafu wakati wa kusajili mwanachama!' });
    }
};
