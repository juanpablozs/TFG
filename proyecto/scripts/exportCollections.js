const fs = require('fs');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI;

async function exportCollection(collectionName, filePath) {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db('footballDB');
    const collection = db.collection(collectionName);
    const data = await collection.find({}).toArray();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Exported ${collectionName} to ${filePath}`);
  } catch (error) {
    console.error(`Error exporting ${collectionName}:`, error);
    throw error;
  } finally {
    await client.close();
  }
}

async function main() {
  try {
    await exportCollection('teams', 'data/teams.json');
    await exportCollection('players', 'data/players.json');
    await exportCollection('matches', 'data/matches.json');
    console.log('All collections exported successfully');
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

main().catch(console.error);
