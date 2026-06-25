const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../models/Product');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/codevector_products';
const TOTAL_PRODUCTS = 200000;
const BATCH_SIZE = 10000;

const categories = ["Electronics", "Books", "Fashion", "Sports", "Home", "Beauty", "Toys"];
const adjectives = ['Awesome', 'Sleek', 'Durable', 'Portable', 'Ergonomic', 'Premium', 'Eco-friendly', 'Compact'];
const nouns = ['Widget', 'Device', 'Tool', 'Gadget', 'Accessory', 'System', 'Machine', 'Kit'];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    console.log('Clearing existing products...');
    await Product.deleteMany({});
    
    console.log(`Starting to insert ${TOTAL_PRODUCTS} products...`);
    const startTime = Date.now();
    const startDate = new Date('2023-01-01');
    const endDate = new Date(); // now

    for (let i = 0; i < TOTAL_PRODUCTS; i += BATCH_SIZE) {
      const batch = [];
      for (let j = 0; j < BATCH_SIZE; j++) {
        const name = `${getRandomItem(adjectives)} ${getRandomItem(nouns)} ${Math.floor(Math.random() * 1000)}`;
        const category = getRandomItem(categories);
        const price = parseFloat((Math.random() * 500 + 10).toFixed(2));
        
        // Generate random timestamps
        const created_at = getRandomDate(startDate, endDate);
        // updated_at can be same as created_at or later
        const updated_at = Math.random() > 0.5 ? created_at : getRandomDate(created_at, endDate);
        
        batch.push({
          name,
          category,
          price,
          created_at,
          updated_at
        });
      }
      
      await Product.insertMany(batch, { ordered: false });
      console.log(`Inserted ${i + BATCH_SIZE} / ${TOTAL_PRODUCTS} products...`);
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(`Successfully inserted ${TOTAL_PRODUCTS} products in ${duration} seconds.`);

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seedDatabase();
