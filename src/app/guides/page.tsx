import { TypeIndex, typeIndexMetadata } from "@/components/editorial/type-index";

export const revalidate = 300;
export const metadata = typeIndexMetadata("guide");

export default function GuidesIndex() {
  return <TypeIndex type="guide" />;
}
