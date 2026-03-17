exports.handler = async (event) => {
  const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
  const GUILD_ID = process.env.DISCORD_GUILD_ID;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const { discord_id } = event.queryStringParameters || {};

    // If discord_id provided, fetch that member's roles in the guild
    if (discord_id) {
      const memberRes = await fetch(
        `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discord_id}`,
        { headers: { Authorization: `Bot ${BOT_TOKEN}` } }
      );

      if (!memberRes.ok) {
        return { statusCode: 200, headers, body: JSON.stringify({ roles: [] }) };
      }

      const memberData = await memberRes.json();

      // Also fetch all guild roles to map IDs to names
      const rolesRes = await fetch(
        `https://discord.com/api/v10/guilds/${GUILD_ID}/roles`,
        { headers: { Authorization: `Bot ${BOT_TOKEN}` } }
      );
      const allRoles = await rolesRes.json();

      const roleMap = {};
      allRoles.forEach(r => { roleMap[r.id] = r.name; });

      const memberRoleNames = (memberData.roles || [])
        .map(id => roleMap[id])
        .filter(name => name && name !== '@everyone');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ roles: memberRoleNames }),
      };
    }

    // Otherwise fetch all guild roles
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${GUILD_ID}/roles`,
      { headers: { Authorization: `Bot ${BOT_TOKEN}` } }
    );
    const roles = await res.json();
    const filtered = roles
      .filter(r => r.name !== '@everyone')
      .sort((a, b) => b.position - a.position)
      .map(r => ({ id: r.id, name: r.name }));

    return { statusCode: 200, headers, body: JSON.stringify({ roles: filtered }) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};