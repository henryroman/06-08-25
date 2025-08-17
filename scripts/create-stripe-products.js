// create-stripe-products.js - Run once to create all your products
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-03-31.basil' });

const services = [
  { name: "Manicure", duration: 45, price: 4500 }, // $45.00 in cents
  { name: "Pedicure", duration: 60, price: 5500 },
  { name: "Facial Treatment", duration: 90, price: 8500 },
  { name: "Gel Nails", duration: 75, price: 6500 },
  { name: "Acrylic Nails", duration: 90, price: 7500 },
  { name: "Nail Art", duration: 60, price: 4000 }
];

async function createProducts() {
  for (const service of services) {
    // Create product
    const product = await stripe.products.create({
      name: service.name,
      description: `${service.duration} minute ${service.name.toLowerCase()} service`
    });

    // Create price for the product
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: service.price,
      currency: 'usd',
      metadata: {
        duration: service.duration.toString()
      }
    });

    console.log(`Created: ${service.name} - Product ID: ${product.id}, Price ID: ${price.id}`);
  }
}

createProducts().catch(console.error);
