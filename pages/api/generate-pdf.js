// pages/api/generate-pdf.js
import { dbConnect } from '../../lib/db';
import Application from '../../lib/models/Application';
import PDFDocument from 'pdfkit';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { appId } = req.body;
  await dbConnect();
  const app = await Application.findById(appId).lean();
  if (!app) return res.status(404).json({ error: 'not found' });

  const doc = new PDFDocument();
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', () => {
    const pdfData = Buffer.concat(buffers);
    // option: store PDF to Cloudinary as raw file and return URL
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=application-${appId}.pdf`);
    res.send(pdfData);
  });

  doc.fontSize(18).text('Application Summary', { underline: true });
  doc.moveDown();
  doc.fontSize(12).text(`Full Name: ${app.fullName || ''}`);
  doc.text(`Email: ${app.email || ''}`);
  doc.text(`Stream: ${app.stream || ''}`);
  doc.text(`Degree: ${app.degree || ''}`);
  doc.moveDown();

  // include photo if exists
  if (app.photo && app.photo.url) {
    try {
      const imageRes = await axios.get(app.photo.url, { responseType: 'arraybuffer' });
      const imgBuffer = Buffer.from(imageRes.data, 'binary');
      doc.image(imgBuffer, { width: 120 });
      doc.moveDown();
    } catch (e) {
      // ignore image errors
    }
  }

  doc.moveDown();
  doc.text('Documents:');
  (app.documents || []).forEach(d => {
    doc.fillColor('blue').text(d.url, { link: d.url });
  });

  doc.end();
}
