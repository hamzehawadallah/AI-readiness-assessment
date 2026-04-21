import { Button } from "@/components/ui/button";
import { LANDING_CONTENT } from "@/config/assessment";
import { ArrowRight, Clock, Target, Users, Lightbulb, Shield, Award, TrendingUp } from "lucide-react";

interface LandingSectionProps {
  onStart: () => void;
}

const featureIcons = [Clock, Users, Target, Lightbulb];

const trustBadges = [
  { icon: Shield, label: "Verified Questionnaire" },
  { icon: Award, label: "Best Practice" },
  { icon: TrendingUp, label: "Data-Driven" },
];

export function LandingSection({ onStart }: LandingSectionProps) {
  return (
    <section className="min-h-screen flex items-center justify-center py-16 md:py-24 relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/30" />
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-vcl-teal/[0.03] to-transparent" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-muted/50 to-transparent" />

      <div className="vcl-container relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          {/* Main Heading */}
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-[1.1] tracking-tight mb-6 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "100ms", animationFillMode: "forwards" }}
          >
            {LANDING_CONTENT.title}
          </h1>

          {/* Subheading */}
          <p
            className="text-xl md:text-2xl lg:text-[1.65rem] text-vcl-teal font-display font-medium mb-10 leading-relaxed opacity-0 animate-fade-in-up"
            style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
          >
            {LANDING_CONTENT.subtitle}
          </p>

          {/* Description */}
          <div
            className="space-y-5 mb-12 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "300ms", animationFillMode: "forwards" }}
          >
            {LANDING_CONTENT.description.map((text, idx) => (
              <p key={idx} className="text-lg md:text-xl text-muted-foreground leading-relaxed font-body">
                {text}
              </p>
            ))}
          </div>

          {/* Features Grid */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-14 max-w-2xl mx-auto opacity-0 animate-fade-in-up"
            style={{ animationDelay: "500ms", animationFillMode: "forwards" }}
          >
            {LANDING_CONTENT.features.map((feature, idx) => {
              const Icon = featureIcons[idx];
              return (
                <div
                  key={idx}
                  className="group flex items-center gap-4 p-5 rounded-xl bg-card border border-border text-left transition-all duration-300 hover:shadow-lg hover:shadow-vcl-teal/5 hover:border-vcl-teal/20 hover:-translate-y-0.5"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-vcl-teal/10 to-vcl-teal/5 flex items-center justify-center transition-colors group-hover:from-vcl-teal/15 group-hover:to-vcl-teal/10">
                    <Icon className="w-5 h-5 text-vcl-teal" />
                  </div>
                  <span className="text-base font-medium text-foreground leading-snug">{feature}</span>
                </div>
              );
            })}
          </div>

          {/* Trust Strip */}
          <div
            className="mb-14 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "400ms", animationFillMode: "forwards" }}
          >
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {trustBadges.map((badge, idx) => {
                const Icon = badge.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/60"
                  >
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground tracking-wide">{badge.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA Button */}
          <div
            className="opacity-0 animate-fade-in-up"
            style={{ animationDelay: "600ms", animationFillMode: "forwards" }}
          >
            <Button
              variant="vcl"
              size="xl"
              onClick={onStart}
              className="group text-lg px-10 py-7 shadow-xl shadow-vcl-teal/20 hover:shadow-2xl hover:shadow-vcl-teal/30 transition-all duration-300 hover:scale-[1.02]"
            >
              Start your AI readiness Assessment
              <ArrowRight className="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Footer reassurance */}
          <p
            className="mt-16 text-sm text-muted-foreground/80 font-medium opacity-0 animate-fade-in"
            style={{ animationDelay: "800ms", animationFillMode: "forwards" }}
          >
            Copyright 2025 © VCL LTD | All rights Reserved
          </p>
        </div>
      </div>
    </section>
  );
}
