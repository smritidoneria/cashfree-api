import { connectDB } from "../../lib/mongodb";
import Payment from "../../models/payments";

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*"); // change to frontend domain in prod
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
    if (req.method === "OPTIONS") {
      return res.status(200).end(); // Preflight OK
    }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, phone, email, collegeYear, amount, date, orderId, time } = req.body;
      console.log("save",req.body);

    if (!orderId) {
      return res.status(400).json({ error: "Order ID required" });
    }

    await connectDB();

    // Check if order already exists
    const existingOrder = await Payment.findOne({ orderId });

    if (existingOrder) {
        console.log("Order already exists:", existingOrder);
      return res.status(200).json({ 
        success: true, 
        message: "Order already exists", 
        order: existingOrder 
      });
    }

    // If not exists, create new order
    
    const  payment = await Payment.create({
              orderId,  // store orderId
              name,
              email,
              phone,
              amount,
              collegeYear,
              date,
              time,
              status: "PENDING"
            });

    res.status(201).json({ 
      success: true, 
      message: "Order saved with status pending", 
      order: payment 
    });

  } catch (err) {
    console.error("Save Order Error:", err);
    res.status(500).json({ error: "Failed to save order" });
  }
}
