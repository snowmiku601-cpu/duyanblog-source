import type { OfferView } from "@/components/affiliate/merchant-offer";

type OfferRow = {
  id: string;
  label: string;
  url: string;
  price: string | null;
  currency: string;
  note: string | null;
  badge: string | null;
  isDeal: boolean;
  dealText: string | null;
  merchant: { name: string };
};

/** Map an AffiliateOffer row (with merchant) to the view model. */
export function offerToView(offer: OfferRow): OfferView {
  return {
    id: offer.id,
    label: offer.label,
    url: offer.url,
    price: offer.price,
    currency: offer.currency,
    note: offer.note,
    badge: offer.badge,
    isDeal: offer.isDeal,
    dealText: offer.dealText,
    merchantName: offer.merchant.name,
  };
}
