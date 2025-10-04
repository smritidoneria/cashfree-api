import { connectDB } from "../../lib/mongodb";
import Payment from "../../models/payments";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  // ✅ Always set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // ✅ Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).json({ message: "CORS preflight OK" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, phone, amount, collegeYear, date,orderId } = req.body;
  console.log("Received payment data:", req.body);
  const timeMap = {
    "2nd Year": "4:00 PM - 5:00 PM",
    "3rd Year": "5:30 PM - 6:30 PM",
    "4th Year": "9:00 PM - 10:00 PM",
  };
  const time = timeMap[collegeYear] || "6:00 PM - 7:00 PM"; // fallback


  try {
       await connectDB();
    let payment = await Payment.findOne({ orderId });
    console.log("Existing payment record:", payment);

    if (payment) {
      // Update existing payment status and details
      payment.name = name;
      payment.email = email;
      payment.phone = phone;
      payment.amount = amount;
      payment.collegeYear = collegeYear;
      payment.date = date;
      payment.time = time;
      payment.status = "SUCCESS";

      await payment.save();
    } else {
      // Create new payment
      payment = await Payment.create({
        orderId,  // store orderId
        name,
        email,
        phone,
        amount,
        collegeYear,
        date,
        time,
        status: "SUCCESS",
      });
    }
    // const savedPayment = await Payment.findOne({ phone: phone });
    // if (!savedPayment) {
    //   console.error("❌ Payment was not saved in MongoDB");
    //   return res.status(500).json({ error: "Payment not saved in database" });
    // }

    // console.log("✅ Payment stored successfully:", savedPayment);

    // Send confirmation email
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true, // 465 if using SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Career10X Workshop" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Registration & Payment Confirmation - Career10X Workshop",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e2e2; border-radius: 10px;">
          <h2 style="color: #F59E0B;">Hello ${name},</h2>
          <p>We are excited to confirm your registration for the <strong>Career10X Workshop</strong>!</p>
    
          <p>✅ <strong>Payment Received:</strong> ₹${amount}</p>
    
          <h3 style="color: #2563EB; margin-top: 20px;">Workshop Details</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Date:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${date}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Time:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${time}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>College Year:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${collegeYear}</td>
            </tr>
          </table>
    
          <p style="margin-top: 20px;">We recommend joining the session a few minutes early to ensure a smooth experience.</p>
    
          <p>📌 <strong>Important:</strong> Keep this email for reference. You will also receive reminders via WhatsApp.</p>
    
          <p style="margin-top: 30px;">Looking forward to seeing you at the workshop! 🚀</p>
    
          <p style="margin-top: 20px; font-weight: bold; color: #111;">Best Regards,<br/>Career10X Workshop Team</p>
        </div>
      `,
    });
    

    return res
      .status(200)
      .json({ message: "Payment saved & email sent", payment });
  } catch (err) {
    console.error("❌ Error saving payment:", err);
    return res
      .status(500)
      .json({ error: "Failed to process payment", details: err.message });
  }
}
