// server/index.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();
const DB_FILE = path.join(__dirname, 'bris.db');
const db = new Database(DB_FILE);

// Load schema if DB is empty
if (!fs.existsSync(DB_FILE) || fs.statSync(DB_FILE).size === 0) {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
}

app.use(cors());
app.use(bodyParser.json());

// Helper to generate IDs
const generateId = (prefix) => `${prefix}-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;

/*** Puroks ***/
app.get('/puroks', (req, res) => {
  const rows = db.prepare('SELECT * FROM puroks').all();
  res.json(rows);
});

/*** Households ***/
app.get('/households', (req, res) => {
  const rows = db.prepare('SELECT * FROM households').all();
  res.json(rows);
});

app.post('/households', (req, res) => {
  const data = req.body;
  const id = generateId('hh');
  const stmt = db.prepare(`
    INSERT INTO households (id, familyName, address, purokId, houseOwnership,
                           is4Ps, "4PsHouseholdID", createdAt)
    VALUES (@id, @familyName, @address, @purokId, @houseOwnership,
            @is4Ps, @psHouseholdID, datetime('now'))
  `);
  stmt.run({
    id,
    familyName: data.familyName,
    address: data.address,
    purokId: data.purokId,
    houseOwnership: data.houseOwnership,
    is4Ps: data.is4Ps ? 1 : 0,
    psHouseholdID: data['4PsHouseholdID'] || null,
  });
  res.json({ id });
});

/*** Residents ***/
app.get('/residents', (req, res) => {
  const rows = db.prepare('SELECT * FROM residents').all();
  res.json(rows);
});

app.post('/residents', (req, res) => {
  const data = req.body;
  const id = generateId('res');
  const stmt = db.prepare(`
    INSERT INTO residents (id, householdId, fullName, relationshipToHead,
                         dateOfBirth, sex, civilStatus, educationalAttainment,
                         contactNumber, occupation, status, createdAt)
    VALUES (@id, @hh, @fullName, @rel, @dob, @sex, @civil, @educ,
            @contact, @occup, 'Active', datetime('now'))
  `);
  stmt.run({
    id,
    hh: data.householdId,
    fullName: data.fullName,
    rel: data.relationshipToHead,
    dob: data.dateOfBirth,
    sex: data.sex,
    civil: data.civilStatus,
    educ: data.educationalAttainment,
    contact: data.contactNumber,
    occup: data.occupation,
  });

  if (data.relationshipToHead === 'Head of Family') {
    db.prepare('UPDATE households SET headResidentId = ? WHERE id = ?')
      .run(id, data.householdId);
  }

  res.json({ id });
});

app.put('/residents/:id', (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const stmt = db.prepare(`
    UPDATE residents SET
      fullName = @fullName,
      relationshipToHead = @rel,
      dateOfBirth = @dob,
      sex = @sex,
      civilStatus = @civil,
      educationalAttainment = @educ,
      contactNumber = @contact,
      occupation = @occup,
      householdId = @hh
    WHERE id = @id
  `);
  stmt.run({
    id,
    fullName: data.fullName,
    rel: data.relationshipToHead,
    dob: data.dateOfBirth,
    sex: data.sex,
    civil: data.civilStatus,
    educ: data.educationalAttainment,
    contact: data.contactNumber,
    occup: data.occupation,
    hh: data.householdId,
  });
  res.json({ success: true });
});

app.delete('/residents/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM residents WHERE id = ?').run(id);
  res.json({ success: true });
});

/*** Profile ***/
app.get('/profile', (req, res) => {
  const row = db.prepare('SELECT * FROM profile LIMIT 1').get();
  res.json(row || {});
});

app.post('/profile', (req, res) => {
  const data = req.body;
  db.prepare('DELETE FROM profile').run();
  db.prepare(`
    INSERT INTO profile (barangayName, municipality, province)
    VALUES (@b, @m, @p)
  `).run({ b: data.barangayName, m: data.municipality, p: data.province });
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`BRIS API listening on ${PORT}`));
