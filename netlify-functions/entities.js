const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'atak-platform';

let cachedClient = null;

async function getDb() {
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI);
    await cachedClient.connect();
  }
  return cachedClient.db(DB_NAME);
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const db = await getDb();

    // Path format: /api/entities/EntityName or /api/entities/EntityName/id
    const path = event.path.replace('/.netlify/functions/entities', '').replace('/api/entities', '');
    const parts = path.split('/').filter(Boolean);
    const entity = parts[0];
    const id = parts[1];

    if (!entity) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'No entity specified' }) };
    }

    const collection = db.collection(entity);

    // GET — list or filter
    if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {};

      if (id) {
        // Get single record by id
        let doc;
        try { doc = await collection.findOne({ _id: new ObjectId(id) }); } catch {}
        if (!doc) doc = await collection.findOne({ id });
        if (!doc) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
        return { statusCode: 200, headers, body: JSON.stringify(normalise(doc)) };
      }

      // Build filter from query params (exclude sort/limit)
      const { sort, limit, ...filterParams } = params;
      const filter = {};
      for (const [key, val] of Object.entries(filterParams)) {
        filter[key] = val;
      }

      const cursor = collection.find(filter);

      if (sort) {
        const direction = sort.startsWith('-') ? -1 : 1;
        const field = sort.replace(/^-/, '');
        cursor.sort({ [field]: direction });
      }

      if (limit) cursor.limit(parseInt(limit));

      const docs = await cursor.toArray();
      return { statusCode: 200, headers, body: JSON.stringify(docs.map(normalise)) };
    }

    // POST — create
    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body || '{}');
      data.created_date = new Date().toISOString();
      data.updated_date = new Date().toISOString();
      const result = await collection.insertOne(data);
      const created = await collection.findOne({ _id: result.insertedId });
      return { statusCode: 201, headers, body: JSON.stringify(normalise(created)) };
    }

    // PATCH — update
    if (event.httpMethod === 'PATCH') {
      if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'No id provided' }) };
      const data = JSON.parse(event.body || '{}');
      data.updated_date = new Date().toISOString();
      delete data._id;

      let filter;
      try { filter = { _id: new ObjectId(id) }; } catch { filter = { id }; }

      await collection.updateOne(filter, { $set: data });
      const updated = await collection.findOne(filter);
      return { statusCode: 200, headers, body: JSON.stringify(normalise(updated)) };
    }

    // DELETE
    if (event.httpMethod === 'DELETE') {
      if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'No id provided' }) };

      let filter;
      try { filter = { _id: new ObjectId(id) }; } catch { filter = { id }; }

      await collection.deleteOne(filter);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  } catch (err) {
    console.error('Entities function error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

// Converts MongoDB _id to id so the frontend can use it normally
function normalise(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}