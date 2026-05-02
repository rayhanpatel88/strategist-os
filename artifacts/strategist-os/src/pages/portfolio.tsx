import { useGetPortfolio } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Portfolio() {
  const portfolio = useGetPortfolio();

  if (portfolio.isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-8">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const data = portfolio.data;
  if (!data) return null;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-background via-card to-background border-b border-border px-8 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">AI Leverage Command Centre</div>
          <h1 className="text-5xl font-bold text-foreground tracking-tight leading-tight mb-6" data-testid="text-portfolio-name">
            {data.name}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed" data-testid="text-portfolio-tagline">
            {data.tagline}
          </p>
          <div className="flex gap-4 mt-8">
            {data.bookingUrl && (
              <a
                href={data.bookingUrl}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-md text-sm font-semibold hover:opacity-90 transition-opacity"
                data-testid="link-book-consultation"
              >
                Book a Consultation
              </a>
            )}
            <a
              href={`mailto:${data.contactEmail}`}
              className="border border-border text-foreground px-6 py-3 rounded-md text-sm font-semibold hover:bg-secondary transition-colors"
              data-testid="link-contact"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </div>

      {/* Positioning Statement */}
      <div className="px-8 py-16 max-w-4xl mx-auto">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Strategic Positioning</div>
        <p className="text-xl text-foreground leading-relaxed max-w-3xl font-medium" data-testid="text-positioning-statement">
          {data.positioningStatement}
        </p>
      </div>

      {/* Featured Systems */}
      {data.systems.length > 0 && (
        <div className="px-8 py-16 bg-card border-t border-border">
          <div className="max-w-5xl mx-auto">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-8">Featured Systems</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.systems.map((system, i) => (
                <div key={i} className="bg-background border border-border rounded-lg p-6" data-testid={`card-system-${i}`}>
                  <div className="text-sm font-bold text-foreground mb-2">{system.title}</div>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{system.description}</p>
                  <div className="text-xs text-primary font-medium">{system.outcome}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Optimisation Philosophy */}
      <div className="px-8 py-16 max-w-4xl mx-auto">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">AI Optimisation Philosophy</div>
        <div className="bg-card border border-card-border rounded-xl p-8">
          <p className="text-base text-foreground leading-relaxed" data-testid="text-philosophy">
            {data.philosophy}
          </p>
        </div>
      </div>

      {/* Case Studies */}
      {data.caseStudies.length > 0 && (
        <div className="px-8 py-16 bg-card border-t border-border">
          <div className="max-w-5xl mx-auto">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-8">Case Studies</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.caseStudies.map((cs, i) => (
                <div key={i} className="bg-background border border-border rounded-lg p-6" data-testid={`card-case-study-${i}`}>
                  <div className="text-xs text-primary font-medium uppercase tracking-wide mb-3">{cs.industry}</div>
                  <div className="text-base font-bold text-foreground mb-4">{cs.title}</div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-1">Challenge</div>
                      <p className="text-sm text-foreground">{cs.challenge}</p>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-1">Approach</div>
                      <p className="text-sm text-foreground">{cs.approach}</p>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="text-xs font-semibold text-muted-foreground mb-1">Result</div>
                      <p className="text-sm text-primary font-medium">{cs.result}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="px-8 py-20 max-w-4xl mx-auto text-center">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Ready to work together?</div>
        <h2 className="text-3xl font-bold text-foreground mb-4">Let's build something that compounds.</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Strategic intelligence, AI automation, and elite execution systems — purpose-built for ambitious operators.
        </p>
        <a
          href={`mailto:${data.contactEmail}`}
          className="bg-primary text-primary-foreground px-8 py-4 rounded-md text-sm font-semibold hover:opacity-90 transition-opacity inline-block"
          data-testid="link-cta-contact"
        >
          Start the Conversation
        </a>
      </div>
    </div>
  );
}
