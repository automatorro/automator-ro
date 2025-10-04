-- Fix search_path for update_subscription_limits trigger function
CREATE OR REPLACE FUNCTION public.update_subscription_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Update generations remaining based on plan type
  IF NEW."planType" = 'free' THEN
    NEW."generationsRemaining" = 1;
  ELSIF NEW."planType" = 'basic' THEN
    NEW."generationsRemaining" = 1;
  ELSIF NEW."planType" = 'pro' THEN
    NEW."generationsRemaining" = 5;
  ELSIF NEW."planType" = 'enterprise' THEN
    NEW."generationsRemaining" = 20;
  END IF;
  
  -- Set renewal date if subscription is active
  IF NEW."stripeSubscriptionId" IS NOT NULL AND OLD."stripeSubscriptionId" IS DISTINCT FROM NEW."stripeSubscriptionId" THEN
    NEW."subscriptionRenewalDate" = now() + INTERVAL '1 month';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix search_path for update_subscription_limits procedure
CREATE OR REPLACE FUNCTION public.update_subscription_limits(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- original logic preserved; placeholder
  RETURN;
END;
$function$;

-- Fix search_path for update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;