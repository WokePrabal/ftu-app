import jsPDF from "jspdf";

export function generatePDF(app) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Application Submitted in FTU", 20, 20);

  doc.setFontSize(12);
  doc.text(`Full Name: ${app.fullname || ""}`, 20, 40);
  doc.text(`Email: ${app.email || ""}`, 20, 50);
  doc.text(`Stream: ${app.stream || app.selectedStream || ""}`, 20, 60);
  doc.text(`Program: ${app.program || ""}`, 20, 70);

  // Photo (thumbnail)
  if (app.photoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = app.photoUrl;
      img.onload = () => {
        doc.addImage(img, "JPEG", 20, 80, 40, 40);
      };
    } catch (e) {
      console.error("Error adding image:", e);
    }
  }

  // Supporting Document link (opens in new tab)
  if (app.documentUrl) {
    const linkText = "Open Supporting Document";
    doc.setTextColor(0, 0, 255); // Blue
    doc.text(linkText, 20, 140);

    const textWidth = doc.getTextWidth(linkText);
    // clickable area
    doc.link(20, 135, textWidth, 10, { url: app.documentUrl });
    doc.setTextColor(0, 0, 0); // Reset
  }

  doc.save("FTU_Application.pdf");
}
