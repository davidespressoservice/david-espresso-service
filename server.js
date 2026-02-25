// server.js
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// Node 22 + node-fetch 3.x usa ESM, import corretto:
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
app.use(cors());
app.use(express.json());

// --- Calcolo spedizione Postage API
app.get('/calculate-shipping', async (req, res) => {
  const { to_postcode, length, width, height, weight } = req.query;
  const from_postcode = '3049'; // Magazzino

  const queryParams = new URLSearchParams({
    from_postcode,
    to_postcode,
    length,
    width,
    height,
    weight,
    service_code: 'AUS_PARCEL_REGULAR'
  });

  try {
    // Template literal con backtick corretto
    const url = https://digitalapi.auspost.com.au/postage/parcel/domestic/calculate.json?${queryParams.toString()};
    const response = await fetch(url, {
      headers: { 'AUTH-KEY': process.env.POSTAGE_API_KEY }
    });
    const data = await response.json();
    res.json({ cost: parseFloat(data.postage_result.total_cost) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Shipping calculation failed' });
  }
});

// --- Checkout Stripe
app.post('/create-checkout-session', async (req, res) => {
  const { amount } = req.body;
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: { name: '1kg Coffee' },
            unit_amount: Math.round(amount * 100) // Converti in centesimi
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: ${req.headers.origin}/success.html,
      cancel_url: ${req.headers.origin}/shop.html
    });
    res.json({ id: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Stripe session creation failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(Server running on port ${PORT}));
