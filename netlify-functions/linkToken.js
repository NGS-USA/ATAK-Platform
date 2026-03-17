const { MongoClient, ObjectId } = require('mongodb');
const crypto = require('crypto');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'atak-platform';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const tokens = db.collection('LinkToken');
    const members = db.collection('Member');

    // POST — generate a new token for a member
    if (event.httpMethod === 'POST') {
      const { member_id, member_name } = JSON.parse(event.body || '{}');
      if (!member_id) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'member_id required' }) };
      }
      await tokens.deleteMany({ member_id, used: false });
      const token = crypto.randomBytes(32).toString('hex');
      const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await tokens.insertOne({ token, member_id, member_name,
        created_at: new Date().toISOString(),
        expires_at: expires_at.toISOString(), used: false });
      return { statusCode: 200, headers, body: JSON.stringify({ token, expires_at }) };
    }

    // GET — validate and consume a token
    if (event.httpMethod === 'GET') {
      const { token, discord_username } = event.queryStringParameters || {};
      if (!token || !discord_username) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'token and discord_username required' }) };
      }
      const record = await tokens.findOne({ token, used: false });
      if (!record) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Invalid or already used token' }) };
      }
      if (new Date() > new Date(record.expires_at)) {
        return { statusCode: 410, headers, body: JSON.stringify({ error: 'Token has expired' }) };
      }
      await members.updateOne({ _id: new ObjectId(record.member_id) },
        { $set: { discord_username, discord_linked: true, discord_linked_at: new Date().toISOString() } });
      await tokens.updateOne({ token }, { $set: { used: true,
        used_at: new Date().toISOString(), used_by: discord_username } });
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, member_name: record.member_name }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    console.error('LinkToken error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  } finally {
    await client.close();
  }
};
