const fs = require('fs');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI;

async function importCollection(filePath, collectionName) {
  const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection(collectionName);

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    await collection.deleteMany({});
    await collection.insertMany(data);
    console.log(`Imported ${filePath} to ${collectionName}`);
  } catch (error) {
    console.error(`Error importing ${filePath}:`, error);
    throw error;
  } finally {
    await client.close();
  }
}

async function main() {
  try {
    await importCollection('data/teams.json', 'teams');
    await importCollection('data/players.json', 'players');
    await importCollection('data/matches.json', 'matches');
    console.log('All collections imported successfully');
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

main().catch(console.error);
