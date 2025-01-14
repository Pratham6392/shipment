const express = require("express");
const axios = require("axios");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const cors = require("cors");
const dotenv = require("dotenv");

const app = express();
dotenv.config();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// const baseURL = process.env.API_BASE_URL || 'http://localhost:3000';

app.post("https://shipment-sand.vercel.app/generate-shipping-label", async (req, res) => {
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
    
    // Default shipping details matching the image exactly
    const defaultShippingDetails = {
      OrderId: "LF110177",
      AWBNumber: "LF9358",
      RoutingCode: "N/S-01/6C/002 RTO",
      ShipmentType: "Standard",
      PaymentMode: "PREPAID",
      OrderDate: "08-12-2024",
      ShipmentWt: "0.83",
      ConsigneeDetails: {
        CustomerName: "Ankush Saha",
        CustomerAddress1: "Flat No: 1305 Wing: I-23 Evershine",
        CustomerAddress2: "Amavi 303, Global City, Virar West",
        City: "Mumbai",
        State: "Maharashtra",
        Pincode: "401303",
        CustomerContact: "92845 20941",
        PhoneNo: "9988776655"
      },
      ReturnTo: {
        CompanyName: "Lorith France",
        ReturnAddress: "Plot No.19, Krishna Industrial Park, Bakrol-Dhamvant, Road, opp. Swarnim Industrial Estate, nr. Uma Weigh Bridge, Bakrol Bujrang",
        City: "Ahmedabad",
        State: "Gujarat",
        Pincode: "382430",
        ReturnContact: "+91 8502010701",
        SupportEmail: "care@lorithfrance.com",
        GSTNo: "24EGYPP9923H1ZI"
      },
      Courier: {
        Name: "Xpressbees",
        Weight: "1kg"
      },
      Products: [{
        ProductName: "Lorith France For Him Giftset, Giftset For Her, classicor & More",
        ProductSKU: "35878346746774",
        HSN: "",
        QTY: 1,
        UnitPrice: 1016.10,
        TaxableValue: 1016.10,
        CGST: 162.80,
        SGST: 162.80,
        Total: 1199.00
      }]
    };

    // Use API data if available, otherwise use default data
    const shippingDetails = data.resultDetails[waybill] || defaultShippingDetails;

    // Generate PDF for shipping label
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const filePath = `./shipping_label_${waybill}.pdf`;
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    // Add Header
    doc.fontSize(16).text("SECURED SHIPEMENT - " + shippingDetails.AWBNumber, 40, 20, { align: "right" });

    // Ship To Section
    doc.fontSize(24).font('Helvetica-Bold').text("SHIP TO", 40, 40);
    doc.fontSize(18).text(shippingDetails.ConsigneeDetails.CustomerName, 40, 80);
    doc.fontSize(12).font('Helvetica').text(shippingDetails.ConsigneeDetails.CustomerAddress1, 40, 110);
    doc.text(shippingDetails.ConsigneeDetails.CustomerAddress2);
    doc.text(`${shippingDetails.ConsigneeDetails.City}, ${shippingDetails.ConsigneeDetails.State}, India`);
    doc.text(`Mo:- ${shippingDetails.ConsigneeDetails.CustomerContact}`);
    doc.text(`Phone no: ${shippingDetails.ConsigneeDetails.PhoneNo}`);

    // Add Logo Text
    doc.fontSize(24).text("LŌRITH", 450, 160, { align: "right" });
    doc.fontSize(24).text("FRĀNCE", 450, 190, { align: "right" });

    // Draw lines to separate sections
    doc.moveTo(40, 300).lineTo(570, 300).stroke();

    // Dimensions and Payment Section
    doc.fontSize(12).text(`Dimensions: ${shippingDetails.ShipmentWt}*12.70*7.60(cm)`, 40, 320);
    doc.text(`Weight: ${shippingDetails.ShipmentWt} kg`);
    doc.text(`Payment: ${shippingDetails.PaymentMode}`);
    doc.fontSize(24).font('Helvetica-Bold').text(shippingDetails.PaymentMode, 40, 380);

    // Courier and AWB Section
    doc.fontSize(12).font('Helvetica').text(`Courier: ${shippingDetails.Courier.Name} ${shippingDetails.Courier.Weight}`, 300, 320);
    doc.text(`Awb: ${shippingDetails.AWBNumber}`, 300, 340);
    doc.text(`Routing Code: ${shippingDetails.RoutingCode}`, 300, 360);
    doc.text("Routing Code: N/A", 300, 380);

    // Draw another line
    doc.moveTo(40, 420).lineTo(570, 420).stroke();

    // Shipped By Section
    doc.fontSize(16).font('Helvetica-Bold').text("SHIPPED BY (If undelivered, return to)", 40, 440);
    doc.fontSize(14).text(shippingDetails.ReturnTo.CompanyName);
    doc.fontSize(12).font('Helvetica').text(shippingDetails.ReturnTo.ReturnAddress);
    doc.text(`Support No: ${shippingDetails.ReturnTo.ReturnContact}`);
    doc.text(`Support Email: ${shippingDetails.ReturnTo.SupportEmail}`);
    doc.text(`GST NO: ${shippingDetails.ReturnTo.GSTNo}`);

    // Order Details Section
    doc.fontSize(14).text(`ORDER ID: #${shippingDetails.OrderId}`, 300, 440);
    doc.text(`INVOICE DATE: ${shippingDetails.OrderDate}`, 300, 460);

    // Product Table
    const tableTop = 580;
    doc.fontSize(10);
    
    // Table Headers
    const headers = ['Product Description & SKU', 'HSN', 'QTY', 'UNIT PRICE', 'TAXABLE VALUE', 'CGST', 'SGST', 'TOTAL'];
    const columnWidths = [200, 40, 40, 70, 70, 50, 50, 50];
    let xPosition = 40;
    
    headers.forEach((header, i) => {
      doc.font('Helvetica-Bold').text(header, xPosition, tableTop);
      xPosition += columnWidths[i];
    });

    // Product Details
    const product = shippingDetails.Products[0];
    doc.font('Helvetica').text(product.ProductName, 40, tableTop + 20, { width: 190 });
    doc.text(`SKU: ${product.ProductSKU}`, 40, tableTop + 45);
    doc.text(product.HSN, 240, tableTop + 20);
    doc.text(product.QTY.toString(), 280, tableTop + 20);
    doc.text(product.UnitPrice.toFixed(2), 320, tableTop + 20);
    doc.text(product.TaxableValue.toFixed(2), 390, tableTop + 20);
    doc.text(product.CGST.toFixed(2), 460, tableTop + 20);
    doc.text(product.SGST.toFixed(2), 510, tableTop + 20);
    doc.text(product.Total.toFixed(2), 560, tableTop + 20);

    // Disclaimer
    doc.fontSize(10).text("All the disputes are subject to Gujarat jurisdiction only. Goods once sold will only be taken back or exchanged as per the brand's exchange/return policy.", 40, 680);

    // Footer
    doc.fontSize(8).text("THIS IS AN AUTO-GENERATED LABEL AND DOES NOT NEED SIGNATURE", 40, 720);
    doc.text("LABEL GENERATED BY GROWNIX VENTURES", 400, 720);

    // Add "SECURED SHIPMENT BY LORITH FRANCE" at the bottom
    doc.fontSize(16).font('Helvetica-Bold').fillColor('white').text("SECURED SHIPMENT BY LORITH FRANCE", 40, 750, {
      background: '#000000',
      width: 530,
      align: 'center',
      padding: 10
    });

    // Finalize the PDF
    doc.end();

    writeStream.on("finish", () => {
      res.download(filePath, (err) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Failed to download file." });
        } else {
          // Cleanup the file after download
          fs.unlinkSync(filePath);
        }
      });
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "An error occurred while processing the request." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // console.log(baseURL)
});