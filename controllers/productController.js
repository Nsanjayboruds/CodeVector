const mongoose = require('mongoose');
const Product = require('../models/Product');

/**
 * @desc    Get all products with cursor-based pagination
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = async (req, res) => {
  try {
    const { category, cursorUpdatedAt, cursorId, limit = 20 } = req.query;
    const parsedLimit = parseInt(limit, 10);

    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({ error: 'Limit must be a number between 1 and 100' });
    }

    const query = {};

    // Filter by category if provided
    if (category && category !== 'All') {
      query.category = category;
    }

    // Apply cursor logic using (updated_at DESC, _id DESC)
    if (cursorUpdatedAt && cursorId) {
      if (!mongoose.Types.ObjectId.isValid(cursorId)) {
        return res.status(400).json({ error: 'Invalid cursorId format' });
      }

      const dateCursor = new Date(cursorUpdatedAt);
      
      // Cursor condition:
      // Either the updated_at is strictly less than the cursor's updated_at
      // OR the updated_at is exactly equal, but the _id is less than the cursor's _id
      query.$or = [
        { updated_at: { $lt: dateCursor } },
        { 
          updated_at: dateCursor, 
          _id: { $lt: new mongoose.Types.ObjectId(cursorId) } 
        }
      ];
    }

    // Execute query
    const products = await Product.find(query)
      .sort({ updated_at: -1, _id: -1 })
      .limit(parsedLimit);

    // Determine the next cursor
    let nextCursor = null;
    if (products.length === parsedLimit) {
      const lastProduct = products[products.length - 1];
      nextCursor = {
        updated_at: lastProduct.updated_at,
        _id: lastProduct._id
      };
    }

    res.json({
      products,
      nextCursor
    });

  } catch (error) {
    console.error('Error in getProducts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getProducts
};
