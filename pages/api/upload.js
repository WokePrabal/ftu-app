// pages/api/upload.js
import nextConnect from "next-connect";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import dbConnect from "../../lib/db";
import Application from "../../lib/models/Application";


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "photo") {
      // only images for photo
      if (file.mimetype.startsWith("image/")) cb(null, true);
      else cb(new Error("Profile photo must be an image"));
    } else {
      // documents: pdf/doc/docx allowed
      const allowed = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/png",
        "image/jpeg"
      ];
      if (allowed.includes(file.mimetype)) cb(null, true);
      else cb(new Error("Document must be PDF/DOC/DOCX or image"));
    }
  },
});

const handler = nextConnect({
  onError(err, req, res) {
    console.error(err);
    res.status(500).json({ error: err.message || "Upload error" });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  },
});

handler.use(upload.fields([
  { name: "photo", maxCount: 1 },
  { name: "documents", maxCount: 5 },
]));

// helper to upload buffer to cloudinary
function streamUpload(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (result) resolve(result);
      else reject(error);
    });
    readable.pipe(stream);
  });
}

handler.post(async (req, res) => {
  await dbConnect();

  const { files } = req;
  const { appId, userId } = req.body; // client must send appId (or userId)

  if (!appId && !userId) {
    return res.status(400).json({ error: "Provide appId or userId" });
  }

  // find or create application
  let app = null;
  if (appId) {
    app = await Application.findById(appId);
  } else if (userId) {
    // get latest app for user or create new
    app = await Application.findOne({ userId }).sort({ createdAt: -1 });
  }

  if (!app) {
    app = await Application.create({
      userId: userId || "anonymous",
      status: "Pending",
    });
  }

  const uploadedFiles = { photo: null, documents: [] };

  try {
    // Photo
    if (files.photo && files.photo[0]) {
      const p = files.photo[0];
      const result = await streamUpload(p.buffer, { folder: "ftu/photos", resource_type: "image" });
      uploadedFiles.photo = {
        url: result.secure_url,
        filename: result.original_filename || result.public_id,
        public_id: result.public_id,
        resource_type: result.resource_type || "image",
      };
      // set/replace photo in app
      app.photo = uploadedFiles.photo;
    }

    // Documents (could be multiple)
    if (files.documents && files.documents.length) {
      for (const doc of files.documents) {
        // resource_type 'raw' for non-image; use 'auto' / let cloudinary detect
        const opts = { folder: "ftu/docs" };
        // if mimetype is image, upload as image, else raw
        if (!doc.mimetype.startsWith("image/")) opts.resource_type = "raw";
        const result = await streamUpload(doc.buffer, opts);
        const d = {
          url: result.secure_url,
          filename: result.original_filename || result.public_id,
          public_id: result.public_id,
          resource_type: result.resource_type || (doc.mimetype.startsWith("image/") ? "image" : "raw"),
        };
        uploadedFiles.documents.push(d);
        // push to app.documents
        app.documents = app.documents || [];
        app.documents.push(d);
      }
    }

    // mark step completed
    app.stepsCompleted = app.stepsCompleted || {};
    app.stepsCompleted.uploadDocuments = true;

    await app.save();

    return res.status(200).json({ success: true, application: app, uploaded: uploadedFiles });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: err.message || "Upload failed" });
  }
});

// disable default body parser (multer handles)
export const config = {
  api: { bodyParser: false },
};

export default handler;
