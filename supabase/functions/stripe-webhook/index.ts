// Deno Edge Function: Stripe Webhook handler
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "https://esm.sh/worktop/cors@^0.8.0?target=deno";
import Stripe from "npm:stripe@12.18.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response(JSON.stringify({ error: "Missing Stripe signature" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string | null;

        // Mark order completed
        await supabase
          .from("stripe_orders")
          .update({ status: "completed", payment_status: session.payment_status })
          .eq("checkout_session_id", session.id);

        // Upsert subscription record
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          await supabase
            .from("stripe_subscriptions")
            .upsert({
              customer_id: customerId,
              subscription_id: subscriptionId,
              status: sub.status as any,
              price_id: sub.items.data[0]?.price.id || null,
              current_period_start: sub.current_period_start,
              current_period_end: sub.current_period_end,
              cancel_at_period_end: sub.cancel_at_period_end,
            }, { onConflict: "subscription_id" });
        }

        // Find user by customer mapping
        const { data: customerMap } = await supabase
          .from("stripe_customers")
          .select("user_id")
          .eq("customer_id", customerId)
          .maybeSingle();

        if (customerMap?.user_id) {
          // Update user plan to pro and store subscription id
          await supabase
            .from("users")
            .update({ planType: "pro", stripeSubscriptionId: subscriptionId, stripeCustomerId: customerId })
            .eq("id", customerMap.user_id);

          // Update usage limits
          await supabase.rpc("update_subscription_limits", { p_user_id: customerMap.user_id });
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await supabase
          .from("stripe_subscriptions")
          .update({
            status: sub.status as any,
            price_id: sub.items.data[0]?.price.id || null,
            current_period_start: sub.current_period_start,
            current_period_end: sub.current_period_end,
            cancel_at_period_end: sub.cancel_at_period_end,
          })
          .eq("subscription_id", sub.id);
        break;
      }
      default:
        // Ignore other events for now
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("stripe-webhook error", err);
    return new Response(JSON.stringify({ error: "Webhook handling failed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});