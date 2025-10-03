// pages/api/send-email.js
import nodemailer from 'nodemailer';
import { dbConnect } from '../../lib/db';
import Application from '../../lib/models/Application';
import axios from 'axios';

export default async function handler(req,res){
  if (req.method !== 'POST') return res.status(405).end();
  const { appId } = req.body;
  await dbConnect();
  const app = await Application.findById(appId);
  if (!app) return res.status(404).json({error:'not found'});

  // generate pdf buffer from internal helper or call generate-pdf that returns buffer
  const pdfResp = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/generate-pdf`, { appId }, { responseType: 'arraybuffer' });
  const pdfBuffer = Buffer.from(pdfResp.data);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: app.email || process.env.GMAIL_USER,
    subject: 'Application Received - Confirmation',
    html: `<p>Dear ${app.fullName || 'Applicant'},<br/>Your application has been received. Attached is a PDF summary. You can also access your supporting documents here:<br/>${(app.documents||[]).map(d => `<a href="${d.url}">${d.filename}</a>`).join('<br/>')}</p>`,
    attachments: [
      { filename: `application-${app._id}.pdf`, content: pdfBuffer },
      // optionally attach photo or include link.
    ]
  };
  await transporter.sendMail(mailOptions);
  res.json({ ok: true });
}
