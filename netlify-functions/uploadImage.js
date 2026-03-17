const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { image, folder = 'atak-platform', transformation } = JSON.parse(event.body || '{}');

    if (!image) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'No image provided' }) };
    }

    const options = {
      folder,
      resource_type: 'image',
      transformation: transformation || [
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    };

    const result = await cloudinary.uploader.upload(image, options);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
      }),
    };
  } catch (err) {
    console.error('Upload error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};