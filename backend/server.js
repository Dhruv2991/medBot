const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Basic check-in data intake endpoint
app.post('/api/patient/checkin', async (req, res) => {
    const { name, age, phone, complaint } = req.body;

    // --- Patent/Research Triage Classifier Area ---
    // Rule engine matching the frontend configuration logic
    let triage_level = 'green';
    let department = 'General Medicine';

    const emergencyKeywords = ['chest pain', 'heart attack', 'breathing', 'stroke', 'unconscious', 'severe bleeding'];
    const yellowKeywords = ['fracture', 'high fever', 'vomiting', 'deep cut', 'intense pain'];

    const lowerComplaint = complaint.toLowerCase();

    if (emergencyKeywords.some(kw => lowerComplaint.includes(kw))) {
        triage_level = 'red';
        department = 'Emergency';
    } else if (yellowKeywords.some(kw => lowerComplaint.includes(kw))) {
        triage_level = 'yellow';
        department = 'Urgent Care';
    }

    try {
        const query = `
            INSERT INTO patients (name, age, phone, chief_complaint, triage_level, department)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, name, triage_level, department, checkin_time;
        `;
        const result = await pool.query(query, [name, age, phone, complaint, triage_level, department]);
        const savedRecord = result.rows[0];

        // Format return to match TokenDisplay.js specifications
        res.status(201).json({
            token: `TK-${savedRecord.id + 1000}`,
            patient_id: savedRecord.id,
            department: savedRecord.department,
            message: savedRecord.triage_level === 'red' 
                ? 'Please proceed immediately to the ER desk.' 
                : 'Please take a seat. A nurse will call your token shortly.'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database storage failure' });
    }
});

// Dashboard streaming data query endpoint
app.get('/api/patients', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM patients ORDER BY checkin_time DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database retrieval failure' });
    }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 API active on port ${PORT}`));