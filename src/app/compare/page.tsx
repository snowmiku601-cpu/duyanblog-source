import { TypeIndex, typeIndexMetadata } from "@/components/editorial/type-index";

export const revalidate = 300;
export const metadata = typeIndexMetadata("versus");

export default function CompareIndex() {
  return <TypeIndex type="versus" />;
}
