import { useState } from "react";

export default function ImageUpload({
  onUpload,
  folder = "atak-platform",
  label = "Upload Image",
  currentUrl = null,
  maxSizeMB = 5,
  transformation = null,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(currentUrl);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File must be under ${maxSizeMB}MB`);
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('File must be an image');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Convert to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload to Cloudinary via Netlify function
      const res = await fetch('/.netlify/functions/uploadImage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, folder, transformation }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setPreview(data.url);
      onUpload(data.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {preview && (
        <div style={{ position: "relative", display: "inline-block" }}>
          <img
            src={preview}
            alt="Preview"
            style={{ maxWidth: "200px", maxHeight: "200px", borderRadius: "8px", border: "1px solid var(--border)", objectFit: "contain", background: "var(--bg-secondary)", padding: "4px" }}
          />
          <button
            onClick={() => { setPreview(null); onUpload(null); }}
            style={{ position: "absolute", top: "-8px", right: "-8px", background: "#ef4444", border: "none", borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", color: "#fff", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}
          >×</button>
        </div>
      )}

      <label style={{
        display: "inline-flex", alignItems: "center", gap: "8px",
        background: uploading ? "var(--bg-secondary)" : "var(--accent)",
        color: uploading ? "var(--text-secondary)" : "#000",
        border: "none", borderRadius: "8px", padding: "8px 16px",
        cursor: uploading ? "not-allowed" : "pointer",
        fontWeight: 600, fontSize: "0.875rem", width: "fit-content",
      }}>
        {uploading ? (
          <>
            <div style={{ width: "14px", height: "14px", border: "2px solid var(--border)", borderTop: "2px solid var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            Uploading...
          </>
        ) : label}
        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          disabled={uploading}
          style={{ display: "none" }}
        />
      </label>

      {error && <div style={{ color: "#ef4444", fontSize: "0.8rem" }}>{error}</div>}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}