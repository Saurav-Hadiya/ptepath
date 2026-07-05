import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ROUTES } from "@/config/routes";

export default function CTASection() {
  return (
    <section className="bg-bg-page py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-brand-primary px-6 py-16 text-center sm:px-12 sm:py-20">
          {/* Background decoration */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(37,99,235,0.2),transparent)]" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-brand-accent/5 blur-3xl" />

          <span className="text-label-sm text-primary-foreground/55">
            Join students who improved their score
          </span>

          <div className="relative">
            <h2 className="mb-4 font-display text-display-md font-bold text-primary-foreground">
              Ready to start your PTE preparation?
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-body-lg text-primary-foreground/60">
              Sign in and begin practising today. All four modules, instant
              scoring, mock tests — everything you need in one focused platform.
            </p>
            <Link
              href={ROUTES.public.login}
              className="inline-flex items-center gap-2 rounded-xl bg-action-default px-10 py-3.5 text-label-lg text-primary-foreground shadow-button transition-all hover:bg-action-hover hover:shadow-lg"
            >
              Sign In to Practice
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-5 text-body-sm text-primary-foreground/35">
              No account? Contact your instructor to get enrolled.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
