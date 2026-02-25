// server.js
const express = require('express');
const fetch = require('node-fetch'); // versione 2.6.7
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // permette chiamate da dominio differente


// ===============================
// CALCOLO SPEDIZIONE AUSPOST
// ===============================
app.get('/calculate-shipping', async (req, res) => {
  const { to_postcode, length, width, height, weight } = req.query;
  const from_postcode = '3049'; // magazzino

  const queryParams = new URLSearchParams({
    from_postcode: from_postcode,
    to_postcode: to_postcode,
    length: length,
    width: width,
    height: height,
    weight: weight,
    service_code: 'AUS_PARCEL_REGULAR'
  });

  try {
    const url = 'https://digitalapi.auspost.com.au/postage/parcel/domestic/calculate.json?' + queryParams.toString();

    const response = await fetch(url, {
      headers: { 'AUTH-KEY': process.env.POSTAGE_API_KEY }
    });

    const data = await response.json();
    if (data && data.postage_result && data.postage_result.total_cost) {
      res.json({ cost: parseFloat(data.postage_result.total_cost) });
    } else {
      res.status(400).json({ cost: 0 });
    }

  } catch (error) {
    console.error('Shipping Error:', error);
    res.status(500).json({ cost: 0 });
  }
});


// ===============================
// STRIPE CHECKOUT
// ===============================
app.post('/create-checkout-session', async (req, res) => {
  const { amount } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: { name: 'Coffee + Shipping' },
            unit_amount: Math.round(amount * 100)
          },
          quantity: 1
        }
      ],
      success_url: 'https://davidespressoservice.github.io/success.html',
      cancel_url: 'https://davidespressoservice.github.io/cancel.html'
    });

    res.json({ id: session.id });

  } catch (error) {
    console.error('Stripe Error:', error);
    res.status(500).json({ error: 'Stripe error' });
  }
});


// ===============================
// SERVER START
// ===============================
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
