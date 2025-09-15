import { PricingTable as ClerkPricingTable } from '@clerk/nextjs';

export default function PricingTable() {
  return <ClerkPricingTable newSubscriptionRedirectUrl='/app' />;
}