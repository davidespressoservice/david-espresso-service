// server.js
const express = require('express');
// Node 22 + node-fetch 3.x usa ESM, quindi dobbiamo importarlo così:
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(express.json());

// --- Calcolo spedizione Postage
app.get('/calculate-shipping', async (req, res) => {
  const { to_postcode, length, width, height, weight } = req.query;

  // Il tuo magazzino a Campbellfield VIC 3049
  const from_postcode = '3049';

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
    const response = await fetch(
      https://digitalapi.auspost.com.au/postage/parcel/domestic/calculate.json?${queryParams.toString()},
      {
        headers: { 'AUTH-KEY': process.env.POSTAGE_API_KEY }
      }
    );

    const data = await response.json();

    // Invia al client il costo totale della spedizione
    res.json({ cost: parseFloat(data.postage_result.total_cost) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ cost: 0 });
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
            product_data: { name: 'Coffee + Shipping' },
            unit_amount: Math.round(amount * 100) // Stripe usa centesimi
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: 'https://davidespressoservice.github.io/success.html',
      cancel_url: 'https://davidespressoservice.github.io/cancel.html'
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Stripe error' });
  }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(Server running on port ${PORT}));
