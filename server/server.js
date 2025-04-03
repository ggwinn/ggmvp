const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const multer = require('multer');
const { ApiError, Client, Environment } = require('square');
const { randomUUID } = require('crypto');
const cors = require('cors');

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Initialize Square client
const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.NODE_ENV === 'production'
    ? Environment.Production
    : Environment.Sandbox
});

const app = express();
app.use(express.json());
app.use(cors());

// Set up multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Serve static files from React build folder
app.use(express.static(path.join(__dirname, '../client/build')));

// ========================================================
// Authentication Routes using Supabase Auth
// ========================================================

// Registration endpoint using Supabase Auth
app.post('/register', async (req, res) => {
    // ... (rest of the register route remains the same)
});

// Login endpoint
app.post('/login', async (req, res) => {
    // ... (rest of the login route remains the same)
});

// Email verification using 6-digit code
app.post('/verify', async (req, res) => {
    // ... (rest of the verify route remains the same)
});

// ========================================================
// Clothing Listings API
// ========================================================

// Endpoint to post a new clothing listing
app.post('/listings', upload.single('image'), async (req, res) => {
  const { title, size, itemType, condition, washInstructions, startDate, endDate, pricePerDay, totalPrice, phoneNumber } = req.body; // Receive phoneNumber
  const { file } = req;
  const userEmail = req.headers['user-id'];

  console.log("Received listing data:", {
      userEmail,
      title,
      size,
      itemType,
      condition,
      washInstructions,
      startDate,
      endDate,
      pricePerDay,
      phoneNumber, // Log phone number
      hasFile: !!file
  });

  if (!userEmail) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
  }

  try {
      // First, get the user UUID from the email
      const { data: authData, error: authError } = await supabase.auth
          .admin.listUsers();

      if (authError) {
          console.error("Error listing users:", authError);
          throw authError;
      }

      // Find the user with the matching email
      const user = authData.users.find(u => u.email === userEmail);

      if (!user) {
          console.error("User not found with email:", userEmail);
          return res.status(404).json({ success: false, message: 'User not found' });
      }

      const userId = user.id;
      console.log("Found user ID:", userId);

      let imageURL = null;

      if (file) {
          const fileName = `${Date.now()}_${file.originalname}`;
          console.log("Uploading file:", fileName);

          const { data: fileData, error: fileError } = await supabase.storage
              .from('clothing-images')
              .upload(fileName, file.buffer, {
                  contentType: file.mimetype,
                  upsert: true
              });

          if (fileError) {
              console.error("File upload error:", fileError);
              throw fileError;
          }

          const { data: publicUrlData } = supabase.storage
              .from('clothing-images')
              .getPublicUrl(fileName);

          imageURL = publicUrlData.publicUrl;
          console.log("File uploaded successfully, URL:", imageURL);
      }

      console.log("Attempting insert with UUID:", userId);

      const { data, error } = await supabase
          .from('listings')
          .insert([{
              user: userId,
              title,
              size,
              itemType,
              condition,
              washInstructions,
              startDate, // Changed from dateAvailable
              endDate,   // Added end date
              pricePerDay, // Changed from price
              imageURL,
              phone_number: phoneNumber // Store phone number
          }])
          .select();

      if (error) {
          console.error("Supabase error details:", error);
          throw error;
      }

      console.log("Insert successful, returned data:", data);
      res.json({ success: true, message: 'Listing posted successfully', listing: data[0] });
  } catch (error) {
      console.error("Full error object:", error);
      res.status(500).json({ success: false, message: error.message || 'Error posting listing' });
  }
});

// Search Listings Endpoint
app.get('/search', async (req, res) => {
    // ... (rest of the search route remains the same)
});

// ========================================================
// NEW: Rental and Payment API Endpoints
// ========================================================

// Process payment and create rental record
app.post('/api/process-payment', async (req, res) => {
    // ... (rest of the process-payment route remains the same)
});

// Get user's rental history
app.get('/api/rentals', async (req, res) => {
    // ... (rest of the rentals route remains the same)
});

// Helper function to send confirmation email
async function sendConfirmationEmail(email, listing, startDate, endDate, amount, rentalId) {
    // ... (rest of the sendConfirmationEmail function remains the same)
}

// ========================================================
// Serve React Frontend
// ========================================================
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});