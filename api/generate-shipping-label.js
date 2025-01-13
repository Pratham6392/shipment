import express from 'express';
import axios from 'axios';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

const app = express();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { waybill } = req.body;

  if (!waybill) {
    return res.status(400).json({ error: "Waybill is required." });
  }

  try {
    // Call the FShip API to get shipping details
    const fshipResponse = await axios.post(
      "https://capi-qc.fship.in/api/shippinglabel",
      { waybill },
      {
        headers: {
          "Content-Type": "application/json",
          signature: "085c36066064af83c66b9dbf44d190d40feec79f437bc1c1cb",
        },
      }
    );

    const data = fshipResponse.data;
    
    // Default shipping details (same as before)
    const defaultShippingDetails = {
      // ... (keep all the default shipping details from the previous code)
    };

    // Use API data if available, otherwise use default data
    const shippingDetails = data.resultDetails[waybill] || defaultShippingDetails;

    // Create PDF document
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const chunks = [];

    // Collect PDF chunks
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=shipping_label_${waybill}.pdf`);
      res.send(pdfBuffer);
    });

    // Generate PDF content (same as before)
    // ... (keep all the PDF generation code from the previous server/index.js)

    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "An error occurred while processing the request." });
  }
}