import { PolicyPage, policyMetadata } from "@/components/editorial/policy-page";

export const metadata = policyMetadata("advertising-disclosure");

export default function Page() {
  return <PolicyPage slug="advertising-disclosure" />;
}
