import { TypeIndex, typeIndexMetadata } from "@/components/editorial/type-index";

export const revalidate = 300;
export const metadata = typeIndexMetadata("roundup");

export default function BestIndex() {
  return <TypeIndex type="roundup" />;
}
