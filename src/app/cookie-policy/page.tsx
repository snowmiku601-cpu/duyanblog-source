import { PolicyPage, policyMetadata } from "@/components/editorial/policy-page";

export const metadata = policyMetadata("cookie-policy");

export default function Page() {
  return <PolicyPage slug="cookie-policy" />;
}
