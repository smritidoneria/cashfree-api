// Next.js API route: Create Cashfree Order
// Uses environment variables: CASHFREE_APP_ID, CASHFREE_SECRET_KEY, CASHFREE_ENV (TEST|PROD)

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*"); // or your frontend domain instead of *
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
        return res.status(200).end();
      }
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST'])
      return res.status(405).json({ error: 'Method Not Allowed' })
    }
  
    const appId = process.env.CASHFREE_APP_ID
    const secretKey = process.env.CASHFREE_SECRET_KEY
    const env = (process.env.CASHFREE_ENV || 'TEST').toUpperCase()
  
    if (!appId || !secretKey) {
      return res.status(500).json({ error: 'Cashfree credentials are not configured' })
    }
  
    try {
      const origin = req.headers.origin || `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`
      const baseUrl = env === 'PROD' ? 'https://api.cashfree.com' : 'https://sandbox.cashfree.com'
  
      const { name, email, phone, amount } = (req.body || {})
  
      // Basic sanitation and fallbacks
      const orderAmount = Number(amount) > 0 ? Number(amount) : 299
      const customerName = (name || 'Student').toString().slice(0, 128)
      const customerEmail = (email || 'student@example.com').toString().slice(0, 128)
      const customerPhone = (phone || '9999999999').toString().slice(0, 15)
  
      // Generate a unique order_id securely (Node 18+)
      const orderId = global.crypto?.randomUUID ? global.crypto.randomUUID() : `order_${Date.now()}`
  
      const payload = {
        order_id: orderId,
        order_amount: orderAmount,
        order_currency: 'INR',
        customer_details: {
          customer_id: `${customerPhone}_${Date.now()}`,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
        },
        order_note: 'ClearPath to SDE - Workshop Enrollment',
        order_meta: {
          // Cashfree supports placeholders like {order_id}
          return_url: `https://smritidoneria.com/success?order_id={order_id}`,
        },
      }
      const cfRes = await fetch(`${baseUrl}/pg/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': appId,
          'x-client-secret': secretKey,
          'x-api-version': '2022-09-01'
        },
        body: JSON.stringify(payload),
      })
      const text = await cfRes.text()
  
      let data
      try { data = JSON.parse(text) } catch (_) { data = { raw: text } }
  
  
      if (!cfRes.ok) {
        return res.status(cfRes.status).json({ error: 'Cashfree order creation failed', details: data })
      }
  
      // Hosted checkout: prefer payment_link; fallback to payment_session_id URL
      const { payment_link, order_id, payment_session_id } = data
      let redirectLink = payment_link
      if (!redirectLink && payment_session_id) {
        const hostedBase = env === 'PROD' ? 'https://payments.cashfree.com/pg/view/pay' : 'https://payments-test.cashfree.com/pg/view/pay'
        redirectLink = `${hostedBase}/${payment_session_id}`
      }
      if (!redirectLink) {
        
        return res.status(500).json({ error: 'Payment link not returned by Cashfree', details: data })
      }
  
      return res.status(200).json({ payment_link: redirectLink, order_id, payment_session_id, env })
    } catch (err) {
      return res.status(500).json({ error: 'Unexpected error creating order', details: err?.message || String(err) })
    }
  }
  
  
  
