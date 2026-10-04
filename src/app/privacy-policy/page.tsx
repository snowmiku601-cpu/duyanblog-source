import { PolicyPage, policyMetadata } from "@/components/editorial/policy-page";

export const metadata = policyMetadata("privacy-policy");

export default function Page() {
  return <PolicyPage slug="privacy-policy" />;
}
