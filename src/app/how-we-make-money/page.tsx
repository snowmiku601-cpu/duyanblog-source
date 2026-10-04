import { PolicyPage, policyMetadata } from "@/components/editorial/policy-page";

export const metadata = policyMetadata("how-we-make-money");

export default function Page() {
  return <PolicyPage slug="how-we-make-money" />;
}
