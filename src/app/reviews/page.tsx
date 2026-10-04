import { TypeIndex, typeIndexMetadata } from "@/components/editorial/type-index";

export const revalidate = 300;
export const metadata = typeIndexMetadata("review");

export default function ReviewsIndex() {
  return <TypeIndex type="review" />;
}
