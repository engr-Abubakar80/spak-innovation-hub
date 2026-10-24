import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-brand-700">404</p>
        <h1 className="mt-4 text-2xl font-semibold text-ink">Page not found</h1>
        <p className="mt-2 max-w-md text-sm text-ink-muted">
          The page you are looking for does not exist or has been moved. Check the URL or go back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/">
            <Button>Go home</Button>
          </Link>
          <Link href="/services">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" aria-hidden /> Browse services
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
