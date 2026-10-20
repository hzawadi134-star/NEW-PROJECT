const db = require('../config/db');

// 1. API ya Kuingiza Lalamiko Jipya (Create Fraud Intake)
exports.createIntake = async (req, res) => {
    let {
        source,
        sourceChannel,
        description,
        reported_by,
        intakeOfficer,
        provider_id,
        facilityProvider,
        facility,
        member_id,
        memberId,
        suspectedFraudCategory,
        category,
        claimAuthorization,
        claimId,
        serviceType,
        suspectedAmount,
        amount,
        redFlag
    } = req.body;

    try {
        const finalSource = sourceChannel || source || 'Whistleblower';
        const finalReportedBy = intakeOfficer || reported_by || req.user?.username || 'Intake Officer';

        // Tafuta au unda provider_id
        let resolvedProviderId = parseInt(provider_id, 10);
        const facilityName = facilityProvider || facility;
        if (isNaN(resolvedProviderId) && facilityName) {
            const provCheck = await db.query('SELECT id FROM providers WHERE name ILIKE $1 LIMIT 1', [facilityName.trim()]);
            if (provCheck.rows.length > 0) {
                resolvedProviderId = provCheck.rows[0].id;
            } else {
                const newProv = await db.query(
                    'INSERT INTO providers (provider_code, name, type, location, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                    [`FAC-${Math.floor(100 + Math.random() * 900)}`, facilityName.trim(), 'Hospital', 'Zanzibar', 'Active']
                );
                resolvedProviderId = newProv.rows[0].id;
            }
        }

        // Tafuta au unda member_id
        let resolvedMemberId = parseInt(member_id, 10);
        const memNum = memberId;
        if (isNaN(resolvedMemberId) && memNum) {
            const memCheck = await db.query('SELECT id FROM members WHERE member_number ILIKE $1 LIMIT 1', [memNum.trim()]);
            if (memCheck.rows.length > 0) {
                resolvedMemberId = memCheck.rows[0].id;
            } else {
                const newMem = await db.query(
                    'INSERT INTO members (member_number, full_name, gender, dob, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                    [memNum.trim(), `Member ${memNum}`, 'M', '1990-01-01', 'Active']
                );
                resolvedMemberId = newMem.rows[0].id;
            }
        }

        // Unganisha taarifa za lalamiko kama maelezo ya kina
        let fullDescription = description || '';
        const detailsArray = [];
        if (suspectedFraudCategory || category) detailsArray.push(`Aina: ${suspectedFraudCategory || category}`);
        if (redFlag) detailsArray.push(`Red Flag: ${redFlag}`);
        if (suspectedAmount || amount) detailsArray.push(`Kiasi: TZS ${suspectedAmount || amount}`);
        if (claimAuthorization || claimId) detailsArray.push(`Claim/Auth: ${claimAuthorization || claimId}`);
        if (serviceType) detailsArray.push(`Huduma: ${serviceType}`);
        if (facilityName) detailsArray.push(`Kituo: ${facilityName}`);

        if (detailsArray.length > 0) {
            fullDescription = `${fullDescription ? fullDescription + ' | ' : ''}${detailsArray.join(' | ')}`;
        }

        const queryText = `
            INSERT INTO fraud_intake (source, description, reported_by, provider_id, member_id, status) 
            VALUES ($1, $2, $3, $4, $5, 'Pending_Validation') 
            RETURNING *;
        `;
        const values = [
            finalSource,
            fullDescription || 'Taarifa ya udanganyifu iliyopokelewa',
            finalReportedBy,
            isNaN(resolvedProviderId) ? null : resolvedProviderId,
            isNaN(resolvedMemberId) ? null : resolvedMemberId
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