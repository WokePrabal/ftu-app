import PDFDocument from "pdfkit";
import Application from "@/lib/models/Application";
import dbConnect from "@/lib/db";

export default async function handler(req, res) {
  const { id } = req.query;

  await dbConnect();

  const app = await Application.findById(id);
  if (!app) {
    return res.status(404).json({ error: "Application not found" });
  }

  // create PDF
  const doc = new PDFDocument();
  let buffers = [];
  doc.on("data", buffers.push.bind(buffers));
  doc.on("end", () => {
    let pdfData = Buffer.concat(buffers);
    res.writeHead(200, {
      "Content-Length": Buffer.byteLength(pdfData),
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment;filename=application.pdf",
    }).end(pdfData);
  });

  // Heading
  doc.fontSize(20).text("Your application is submitted in FTU", {
    align: "center",
  });
  doc.moveDown();

  // Details
  doc.fontSize(14).text(`Full Name: ${app.fullname}`);
  doc.text(`Email: ${app.email}`);
  doc.text(`Stream: ${app.stream}`);
  doc.text(`Program: ${app.program}`);
  doc.text(`Status: ${app.status}`);
  doc.moveDown();

  // Photo (agar hai)
  if (app.photoUrl) {
    try {
      doc.text("Photo:");
      doc.image(app.photoUrl, {
        fit: [100, 100],
      });
    } catch {
      doc.text("(Photo could not be loaded)");
    }
    doc.moveDown();
  }

  // Document link
  if (app.documentUrl) {
    doc.text(`Supporting Document: ${app.documentUrl}`, {
      link: app.documentUrl,
      underline: true,
    });
  }

  doc.end();
}
