const { MongoClient } = require('mongodb');

exports.handler = async (event) => {
  const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
  const GUILD_ID  = process.env.DISCORD_GUILD_ID;
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('atak-platform');

    // Fetch guild members and roles from Discord
    const [membersRes, rolesRes] = await Promise.all([
      fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000`,
        { headers: { Authorization: `Bot ${BOT_TOKEN}` } }),
      fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/roles`,
        { headers: { Authorization: `Bot ${BOT_TOKEN}` } }),
    ]);
    const guildMembers = await membersRes.json();
    const guildRoles   = await rolesRes.json();

    const roleMap = {};
    guildRoles.forEach(r => { roleMap[r.id] = r.name; });

    const discordRoleMap = {};
    guildMembers.forEach(m => {
      if (m.user) discordRoleMap[m.user.id] = m.roles.map(rid => roleMap[rid]).filter(Boolean);
    });

    // Update members in MongoDB
    const appMembers = await db.collection('Member').find({ discord_id: { $exists: true } }).toArray();
    let updated = 0;
    for (const m of appMembers) {
      if (discordRoleMap[m.discord_id] !== undefined) {
        await db.collection('Member').updateOne({ _id: m._id }, { $set: { discord_roles: discordRoleMap[m.discord_id] } });
        updated++;
      }
    }
    return { statusCode: 200, body: JSON.stringify({ updated, total_discord_members: guildMembers.length }) };
  } finally {
    await client.close();
  }
};
