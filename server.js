const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const connectDB = require('./config/db');
const productRoutes = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files (bonus requirement)
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/products', productRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
