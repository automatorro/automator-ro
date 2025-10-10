// Deno Edge Function: Create Stripe Checkout Session for subscriptions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "https://esm.sh/worktop/cors@^0.8.0?target=deno";
import Stripe from "npm:stripe@12.18.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type CreateSessionRequest = {
  userId: string;
  email?: string;
  priceId?: string; // optional override
};

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_PRICE_ID = Deno.env.get("STRIPE_PRICE_ID")!; // default subscription price
const APP_URL = Deno.env.get("APP_URL") || "http://localhost:8080";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, priceId }: CreateSessionRequest = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Lookup or create Stripe customer for user
    const { data: existingCustomer } = await supabase
      .from("stripe_customers")
      .select("customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    let customerId = existingCustomer?.customer_id || null;

    if (!customerId) {
      const customer = await stripe.customers.create({ email });
      customerId = customer.id;
      await supabase.from("stripe_customers").insert({ user_id: userId, customer_id: customerId });
    }

    // Create checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: priceId || STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/dashboard?checkout=success`,
      cancel_url: `${APP_URL}/dashboard?checkout=cancel`,
      allow_promotion_codes: true,
    });

    // Persist order (optional basic tracking)
    await supabase.from("stripe_orders").insert({
      checkout_session_id: session.id,
      customer_id: customerId!,
      currency: session.currency || "usd",
      amount_subtotal: session.amount_subtotal || 0,
      amount_total: session.amount_total || 0,
      payment_intent_id: session.payment_intent as string | null,
      payment_status: session.payment_status || "unpaid",
      status: "pending",
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("create-checkout-session error", err);
    return new Response(JSON.stringify({ error: "Failed to create checkout session" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});