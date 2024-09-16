const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI;

async function importCollection(filePath, collectionName) {
  const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection(collectionName);

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const updatedData = data.map(doc => {
      if (doc._id) {
        doc._id = new ObjectId(doc._id);
      }
      return doc;
    });

    await collection.deleteMany({});
    await collection.insertMany(updatedData);
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
    await importCollection('data/matches_bundesliga.json', 'matches_bundesliga');
    await importCollection('data/matches_2022.json', 'matches_2022');
    console.log('All collections imported successfully');
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

main().catch(console.error);
