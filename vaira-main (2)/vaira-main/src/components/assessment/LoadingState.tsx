import { Loader2, Brain, BarChart3, Lightbulb } from "lucide-react";

export function LoadingState() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center animate-fade-in">
      <div className="text-center max-w-md">
        <div className="relative mb-8">
          {/* Animated loader */}
          <div className="w-24 h-24 rounded-full bg-vcl-teal/10 flex items-center justify-center mx-auto">
            <Loader2 className="w-12 h-12 text-vcl-teal animate-spin" />
          </div>

          {/* Orbiting icons */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: "8s" }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
              <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shadow-sm">
                <Brain className="w-4 h-4 text-vcl-teal" />
              </div>
            </div>
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: "8s", animationDelay: "-2.7s" }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
              <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shadow-sm">
                <BarChart3 className="w-4 h-4 text-vcl-amber" />
              </div>
            </div>
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: "8s", animationDelay: "-5.3s" }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
              <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shadow-sm">
                <Lightbulb className="w-4 h-4 text-vcl-teal" />
              </div>
            </div>
          </div>
        </div>

        <h2 className="vcl-heading-2 mb-3">Analysing your answers</h2>
        <p className="vcl-body">
          Our system is reviewing your responses to generate personalised insights and recommendations for your
          organisation.
        </p>

        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-vcl-teal animate-pulse" />
          This usually takes 10-15 seconds
        </div>
      </div>
    </div>
  );
}
