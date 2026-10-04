import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-6xl flex-1 place-items-center px-4 py-24 lg:px-6">
      <div className="max-w-md text-center">
        <LogoMark className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="eyebrow mt-6 text-vermilion">Error 404</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          This page went to the market<span className="text-vermilion">.</span>
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          The conical hat shields, but even it can&apos;t find what you asked for. The link may
          be old, mistyped, or the story has moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild className="font-medium">
            <Link href="/">Back to the front page</Link>
          </Button>
          <Button asChild variant="outline" className="font-medium">
            <Link href="/search">Search the site</Link>
          </Button>
        </div>
        <div className="mt-10 flex justify-center gap-5 text-xs text-muted-foreground">
          <Link href="/reviews" className="underline underline-offset-2 hover:text-foreground">Reviews</Link>
          <Link href="/best" className="underline underline-offset-2 hover:text-foreground">Best picks</Link>
          <Link href="/compare" className="underline underline-offset-2 hover:text-foreground">Comparisons</Link>
          <Link href="/guides" className="underline underline-offset-2 hover:text-foreground">Guides</Link>
        </div>
      </div>
    </div>
  );
}
