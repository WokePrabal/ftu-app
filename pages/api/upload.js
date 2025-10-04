// pages/api/upload.js
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import dbConnect from "../../lib/db";
import Application from "../../lib/models/Application";

// Configure Cloudinary (ensure env vars are correct)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// multer memory storage + fileFilter
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 }, // 12MB
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "photo") {
      return file.mimetype.startsWith("image/") ? cb(null, true) : cb(new Error("Profile photo must be an image"));
    }
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
    ];
    return allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Document must be PDF/DOC/DOCX or image"));
  },
});

// helper to run multer middleware as promise
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// upload buffer -> cloudinary stream
function streamUpload(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    readable.pipe(stream);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method not allowed" });

  // ensure Cloudinary config present
  if (!process.env.CLOUDINARY_CLOUD_NAME && !process.env.CLOUDINARY_URL) {
    console.error("Missing Cloudinary env vars");
    return res.status(500).json({ success: false, error: "Server misconfiguration: Cloudinary env not set" });
  }

  try {
    // parse multipart/form-data
    await runMiddleware(req, res, upload.fields([
      { name: "photo", maxCount: 1 },
      { name: "documents", maxCount: 5 },
    ]));

    console.log("/api/upload called, body keys:", Object.keys(req.body || {}));
    console.log("files keys:", req.files ? Object.keys(req.files) : "no files");

    await dbConnect();

    const { appId, userId } = req.body;
    const files = req.files || {};

    if (!appId && !userId) {
      return res.status(400).json({ success: false, error: "Provide appId or userId in form data" });
    }

    // find or create application
    let app = null;
    if (appId) {
      app = await Application.findById(appId);
    } else if (userId) {
      app = await Application.findOne({ userId }).sort({ createdAt: -1 });
    }

    if (!app) {
      app = await Application.create({
        userId: userId || "anonymous",
        status: "Pending",
      });
    }

    const uploadedFiles = { photo: null, documents: [] };

    // Photo upload
    if (files.photo && files.photo[0]) {
      const p = files.photo[0];
      console.log("Uploading photo:", p.originalname, p.mimetype, p.size);
      try {
        const result = await streamUpload(p.buffer, { folder: "ftu/photos", resource_type: "image" });
        uploadedFiles.photo = {
          url: result.secure_url,
          filename: result.original_filename || result.public_id || p.originalname,
          public_id: result.public_id,
          resource_type: result.resource_type || "image",
        };
        // set object shape
        app.photo = uploadedFiles.photo;
        // set compatibility string field
        app.photoUrl = uploadedFiles.photo.url;
      } catch (err) {
        console.error("Cloudinary photo upload error:", err);
        return res.status(500).json({ success: false, error: "Photo upload failed: " + (err.message || "unknown") });
      }
    }

    // Documents upload (multiple)
    if (files.documents && files.documents.length) {
      for (const doc of files.documents) {
        console.log("Uploading document:", doc.originalname, doc.mimetype, doc.size);
        const opts = { folder: "ftu/docs" };
        if (!doc.mimetype.startsWith("image/")) opts.resource_type = "raw";
        try {
          const result = await streamUpload(doc.buffer, opts);
          const d = {
            url: result.secure_url,
            filename: result.original_filename || result.public_id || doc.originalname,
            public_id: result.public_id,
            resource_type: result.resource_type || (doc.mimetype.startsWith("image/") ? "image" : "raw"),
          };
          uploadedFiles.documents.push(d);
          app.documents = app.documents || [];
          app.documents.push(d);
        } catch (err) {
          console.error("Cloudinary document upload error:", err);
          return res.status(500).json({ success: false, error: "Document upload failed: " + (err.message || "unknown") });
        }
      }

      // compatibility fields: documentUrls array and first-document shortcut
      const newUrls = uploadedFiles.documents.map(d => d.url);
      app.documentUrls = (app.documentUrls || []).concat(newUrls);
      if (!app.documentUrl) app.documentUrl = uploadedFiles.documents[0].url;
    }

    // mark step done
    app.stepsCompleted = app.stepsCompleted || {};
    app.stepsCompleted.uploadDocuments = true;

    // Save & return saved application (so client gets up-to-date doc)
    try {
      const saved = await app.save();
      console.log("Saved application (after uploads):", {
        id: saved._id || saved.id,
        photoUrl: saved.photoUrl,
        documentUrl: saved.documentUrl,
        documentsCount: (saved.documents || []).length,
        stepsCompleted: saved.stepsCompleted,
      });
      return res.status(200).json({ success: true, application: saved, uploaded: uploadedFiles });
    } catch (err) {
      console.error("DB save error:", err);
      return res.status(500).json({ success: false, error: "Saving application failed: " + (err.message || "db error") });
    }
  } catch (err) {
    console.error("Upload handler error:", err);
    return res.status(500).json({ success: false, error: err.message || "Upload failed" });
  }
}

// disable Next body parsing so multer can handle it
export const config = { api: { bodyParser: false } };