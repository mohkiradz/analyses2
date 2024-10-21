const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const path = require('path'); // Import the path module

const app = express();
const port = 3000;

// Serve static files from the 'analyses' directory
app.use('/analyses', express.static(path.join(__dirname, 'analyses')));


// Serve static files with correct MIME types
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Set the directory for your views

// Middleware to parse JSON body
app.use(bodyParser.json());

// Set CORS headers to allow requests from any origin
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow access from any origin
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // Allowed HTTP methods
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Allowed request headers
  next();
});

// Create a PostgreSQL pool
const pool = new Pool({
  user: 'postgres',
  host: 'elomari.noip.me',
  database: 'LaboPharm',
  password: 'zdnetf',
  port: 5432, // Default PostgreSQL port
}); 
// Define a route to handle the query and render the results
app.get('/results', async (req, res) => {
  const prelevementValue = req.query.prelevement; // Store the value of prelevement

  try {
// Execute the first SQL query
const { rows: formRows } = await pool.query(
  `SELECT form_data.id, nom, prenom, dob, prelevement, num, 
          SUM(prix_labo) AS Total_Labo, SUM(prix_pharm) AS Total_Pharm
   FROM form_data
   JOIN patient ON form_data.patient_id = patient.id
   JOIN selected_options ON form_data.id = selected_options.form_data_id
   JOIN analyses ON analyses.id = selected_options.analyses_id
   WHERE prelevement = $1 and valid ='1'
   GROUP BY form_data.id, nom, prenom, dob, prelevement, num
   ORDER BY form_data.id ASC`,
  [prelevementValue]
);

// Execute the second SQL query for each form_data.id
const optionPromises = formRows.map(async formRow => {
  const { rows: options } = await pool.query(
    `SELECT analyses_id, designation, prix_labo, prix_pharm 
     FROM selected_options
     JOIN analyses ON selected_options.analyses_id = analyses.id
     WHERE form_data_id = $1
     ORDER BY designation ASC`,
    [formRow.id]
  );
  return { ...formRow, options };
});

// Wait for all queries to finish
const combinedRows = await Promise.all(optionPromises);

console.log('Prelevement value:', prelevementValue); // Log the value of prelevement
console.log('Combined result:', combinedRows); // Log the combined result

// Render the results in a view template
res.render('results', { rows: combinedRows });
  } catch (error) {
    console.error('Error executing SQL query:', error);
    res.status(500).send('Internal Server Error');
  }
});
// Define a route to fetch data from the database with optional date parameter
app.get('/data', async (req, res) => {
  try {
    // Get the selected date from the query parameters
    const selectedDate = req.query.date;

    // Construct the SQL query dynamically based on the selected date
    let sqlQuery = `
      SELECT form_data.id, form_data.valid, nom, prenom, dob, prelevement, num, sum(prix_labo) AS Total_Labo, sum(prix_pharm) AS Total_Pharm
      FROM form_data
      JOIN patient ON form_data.patient_id = patient.id
      JOIN selected_options ON form_data.id = selected_options.form_data_id
      JOIN analyses ON analyses.id = selected_options.analyses_id
      
      
    `;

    // If a date is provided, filter the results by that date
    if (selectedDate) {
      sqlQuery += ` WHERE prelevement = $1 and valid ='1'`;
    }

    sqlQuery += `
      GROUP BY form_data.id, nom, prenom, dob, prelevement, num
      ORDER BY form_data.id ASC
    `;

    console.log('Generated SQL Query:', sqlQuery); // Log the generated SQL query

    // Execute the SQL query
    let queryResult;
    if (selectedDate) {
      queryResult = await pool.query(sqlQuery, [selectedDate]);
    } else {
      queryResult = await pool.query(sqlQuery);
    }

    // Send the JSON data along with the generated SQL query to the client
    res.json({ sqlQuery: sqlQuery, data: queryResult.rows });
  } catch (error) {
    console.error('Error executing SQL query:', error);
    res.status(500).json({ error: 'An error occurred while fetching data.' });
  }
});

// Server-side route to update the validity
app.post('/update-validity', async (req, res) => {
  try {
      const formId = req.body.form_id;
      console.log('Received form ID:', formId); // Log the received form ID

      // Construct the SQL query
      const sqlQuery = 'UPDATE public.form_data SET valid = 0 WHERE id = $1';
      console.log('SQL Query:', sqlQuery, 'with form ID:', formId); // Log SQL query with form ID

      // Perform the update operation in the database
      await pool.query(sqlQuery, [formId]);
      console.log('Validity updated successfully for form ID:', formId); // Log successful update

      // Respond with success status
      res.json({ success: true });
      console.log('Response sent: success'); // Log successful response
  } catch (error) {
      console.error('Error updating validity:', error);
      res.status(500).json({ success: false, error: 'An error occurred while updating validity.' });
      console.log('Response sent: error'); // Log error response
  }
});

// Define route to handle updating analysis in the database
app.post('/update-analysis', async (req, res) => {
  try {
      // Extract analysis data from request body
      const { id, designation, prix_labo, prix_pharm } = req.body;

      // Update analysis in the database
      const query = `
          UPDATE analyses
          SET designation = $1, prix_labo = $2, prix_pharm = $3
          WHERE id = $4
      `;
      await pool.query(query, [designation, prix_labo, prix_pharm, id]);

      // Send success response
      res.status(200).json({ message: 'Analysis updated successfully' });
  } catch (error) {
      console.error('Error updating analysis:', error);
      // Send error response
      res.status(500).json({ error: 'An error occurred while updating the analysis' });
  }
});

// Define route to handle adding a new row to the database
app.post('/add-row', async (req, res) => {
  try {
      // Extract data from the request body
      const { designation, type_tube, prix_labo, prix_pharm } = req.body;

      // Insert a new row into the database table
      const query = `
          INSERT INTO analyses (designation, type_tube, prix_labo, prix_pharm)
          VALUES ($1, $2, $3, $4)
          RETURNING *;`;
      const { rows } = await pool.query(query, [designation, type_tube, prix_labo, prix_pharm]);

      // Send success response with the inserted row data
      res.status(200).json({ message: 'New row added successfully', newRow: rows[0] });
  } catch (error) {
      console.error('Error adding new row:', error);
      // Send error response
      res.status(500).json({ error: 'An error occurred while adding a new row' });
  }
});


// New route to handle search queries for medical analyses
app.get('/search-analyses', async (req, res) => {
  try {
      const searchTerm = req.query.search.toLowerCase();
      const result = await pool.query(`
          SELECT id, designation, prix_labo, type_tube, abreviation, prix_pharm 
          FROM analyses 
          WHERE LOWER(designation) LIKE $1`,
          [`%${searchTerm}%`]);
      res.json(result.rows);
  } catch (err) {
      console.error('Error fetching analyses from analyses table:', err);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});
// Define a route to fetch selected options based on form ID
app.get('/selected-options', async (req, res) => {
  try {
    const formId = req.query.form_id; // Get the form ID from the query parameters
    // Execute your updated SQL query to fetch selected options based on the form ID
    const queryResult = await pool.query(`
      SELECT analyses_id, designation, prix_labo, prix_pharm 
      FROM selected_options
      JOIN analyses ON selected_options.analyses_id = analyses.id
      WHERE form_data_id = $1
      ORDER BY designation ASC
      
    `, [formId]);

    // Send the JSON data to the client
    res.json(queryResult.rows);
  } catch (error) {
    console.error('Error executing SQL query:', error);
    res.status(500).json({ error: 'An error occurred while fetching selected options.' });
  }
});



// Define endpoint to handle form submissions
app.post('/submit-form', async (req, res) => {
  let formDataId; // Declare formDataId here

  try {
    // Extract form data from request body
    const { name, lastName, dob, num, pre, selectedOptionsData } = req.body;

    // Insert form data into the database
    const client = await pool.connect();

    const checkPatientQuery = `
    SELECT id FROM patient 
    WHERE nom = $1 AND prenom = $2 AND date_naissance = $3`;
    try {
      const checkPatientResult = await client.query(checkPatientQuery, [name, lastName, dob]);
      if (checkPatientResult.rows.length > 0) {
        // Patient already exists
        const patientId = checkPatientResult.rows[0].id;
        console.log('Patient already exists with ID:', patientId);
        // Insert data into the form_data table using patientId
        const formDataQuery = `
            INSERT INTO form_data (name, last_name, dob, num, prelevement, patient_id) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING id`;
        const formDataResult = await client.query(formDataQuery, [name, lastName, dob, num, pre, patientId]);
        formDataId = formDataResult.rows[0].id; // Assign formDataId here
        console.log('Form data inserted successfully with ID:', formDataId);
        // Proceed with the rest of your logic
      } else {
        // Patient does not exist, insert them into the patient table first
        // Insert data into the patient table
        const patientInsertQuery = `
            INSERT INTO patient (nom, prenom, date_naissance) 
            VALUES ($1, $2, $3) 
            RETURNING id`;
        const patientInsertResult = await client.query(patientInsertQuery, [name, lastName, dob]);
        const patientId = patientInsertResult.rows[0].id;
        console.log('New patient inserted with ID:', patientId);

        // Insert data into the form_data table using patientId
        const formDataQuery = `
            INSERT INTO form_data (name, last_name, dob, num, prelevement, patient_id) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING id`;
        const formDataResult = await client.query(formDataQuery, [name, lastName, dob, num, pre, patientId]);
        formDataId = formDataResult.rows[0].id; // Assign formDataId here
        console.log('Form data inserted successfully with ID:', formDataId);
        // Proceed with the rest of your logic
      }
    } catch (error) {
      console.error('Error inserting patient data or form data:', error);
      // Handle the error appropriately
    }

    // Insert selected options into the database
    for (const option of selectedOptionsData) {
      const party = `${option.id}`;

      const selectedOptionsQuery = 'INSERT INTO selected_options (form_data_id, analyses_id) VALUES ($1, $2)';
      await client.query(selectedOptionsQuery, [formDataId, party]);
    }
    client.release();
    res.status(200).json({ message: 'Prelevement ajoute avec succes' });
  } catch (error) {
    console.error('Error submitting form data:', error);
    res.status(500).json({ message: 'An error occurred' });
  }
});
app.get('/options', async (req, res) => {
  try {
    const searchTerm = req.query.search.toLowerCase();
    const client = await pool.connect();
    const result = await client.query('SELECT id, designation, prix_labo, type_tube, prix_pharm FROM analyses WHERE LOWER(designation) LIKE $1', [`%${searchTerm}%`]);
    const options = result.rows.map(row => {
      return {
        id: row.id,
        designation: row.designation,
        prix_labo: row.prix_labo,
        type_tube: row.type_tube,
        prix_pharm: row.prix_pharm
      };
    });
    client.release();
    res.json(options);
  } catch (err) {
    console.error('Error fetching options from analysemedicale table:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// Start the server
app.listen(port, () => {
  console.log(`Server is good on http://localhost:${port}`);
  app.use(express.static(__dirname));
});
