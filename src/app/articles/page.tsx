import { TypeIndex, typeIndexMetadata } from "@/components/editorial/type-index";

export const revalidate = 300;
export const metadata = typeIndexMetadata("editorial");

export default function ArticlesIndex() {
  return <TypeIndex type="editorial" />;
}
