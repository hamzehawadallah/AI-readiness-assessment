import { Button } from "@/components/ui/button";
import { WebhookResponse, CompanyWebsite, DimensionInsight } from "@/types/assessment";
import { VCL_CONTACT } from "@/config/assessment";
import {
  Award,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Lock,
  Mail,
  MessageCircle } from
"lucide-react";
import { cn } from "@/lib/utils";
import { useMemo, useState, useEffect } from "react";
import { settingsApi } from "@/lib/apiClient";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { ReportDeliveryModals } from "./ReportDeliveryModals";
import { useReportDelivery } from "@/hooks/useReportDelivery";

interface ResultsDisplayProps {
  results: WebhookResponse;
  participant: CompanyWebsite;
  savedResultInfo?: {
    participantId: string;
    resultId: string;
    pdfUrl: string;
  } | null;
}

export function ResultsDisplay({ results, participant, savedResultInfo }: ResultsDisplayProps) {
  const { overallScore, overallScorePercent, levelNumber, levelLabel, agentInsights, dimensionScores, tagScores } = results;

  // Locked state - starts locked, unlocks after successful report delivery
  const [isLocked, setIsLocked] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    settingsApi.getPublic()
      .then(data => setWhatsappEnabled(data.whatsapp_enabled !== "false"))
      .catch(() => setWhatsappEnabled(true));
  }, []);

  // Use agent insights directly (no longer need to parse from output string)
  const level = agentInsights?.level || { number: levelNumber, label: levelLabel || "Unknown", explanation: "" };
  const summary = agentInsights?.summary || "";
  const readinessWillingness = agentInsights?.readinessWillingness;

  // Use dimension insights from agent, fallback to calculated dimension scores
  const dimensionInsights = useMemo(() => {
    if (agentInsights?.dimensionInsights && agentInsights.dimensionInsights.length > 0) {
      return agentInsights.dimensionInsights;
    }
    // Build insights from calculated dimension scores as fallback
    return dimensionScores.map((dim) => ({
      dimensionKey: dim.dimensionKey,
      dimensionTitle: dim.dimensionTitle,
      scorePercent: dim.scorePercent,
      strengthOrGap: dim.scorePercent >= 50 ? "Strength" as const : "Gap" as const,
      insight: ""
    }));
  }, [agentInsights?.dimensionInsights, dimensionScores]);

  const tagInsights = agentInsights?.tagInsights || [];
  const recommendations = agentInsights?.recommendations || { next90Days: [], next12Months: [] };
  const vclPositioning = agentInsights?.vclPositioning || {
    howVCLCanHelp: "",
    suggestedCallToAction: "Book a consultation"
  };

  // Separate first insight (visible) from rest (locked)
  const firstInsight = dimensionInsights[0];
  const lockedInsights = dimensionInsights.slice(1);

  // Report data for delivery
  const reportData = {
    participant: {
      originalWebsite: participant.originalWebsite,
      domain: participant.domain
    },
    scores: {
      overall: overallScore,
      overallPercent: overallScorePercent,
      levelNumber,
      levelLabel,
      dimensions: dimensionScores,
      tags: tagScores
    },
    agentInsights: agentInsights,
    overallScore: overallScorePercent,
    levelNumber: levelNumber,
    levelLabel: levelLabel
  };

  // Callback for successful delivery
  const handleUnlock = () => {
    setIsLocked(false);
  };

  // Report delivery hook - pass savedResultInfo for PDF URL
  const delivery = useReportDelivery(reportData, handleUnlock, savedResultInfo);

  // Get color based on score - gradient from red (low) to green (high)
  const getScoreHexColor = (score: number) => {
    if (score >= 80) return "#22c55e"; // green-500
    if (score >= 60) return "#84cc16"; // lime-500
    if (score >= 40) return "#eab308"; // yellow-500
    if (score >= 20) return "#f97316"; // orange-500
    return "#ef4444"; // red-500
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-lime-500";
    if (score >= 40) return "bg-yellow-500";
    if (score >= 20) return "bg-orange-500";
    return "bg-red-500";
  };

  // Pie chart data - use percentage score
  const pieData = [
  { name: "Score", value: overallScorePercent },
  { name: "Remaining", value: 100 - overallScorePercent }];


  const scoreColor = getScoreHexColor(overallScorePercent);


  return (
    <div className="animate-fade-in space-y-8">
      {/* Hero Result Card */}
      <div className="vcl-card-elevated text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-vcl-teal/10 text-vcl-teal text-sm font-medium mb-6">
          <Award className="w-4 h-4" />
          Assessment Complete
        </div>

        <h1 className="vcl-heading-1 mb-8">Your AI Readiness Result</h1>

        {/* Score Display with Pie Chart */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 my-8">
          {/* Pie Chart */}
          <div className="relative w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  strokeWidth={0}>

                  <Cell fill={scoreColor} />
                  <Cell fill="hsl(var(--muted))" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold font-display" style={{ color: scoreColor }}>
                {Math.round(overallScorePercent)}%
              </span>
            </div>
          </div>

          {/* Maturity Level */}
          <div className="text-center md:text-left">
            <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Maturity Level</div>
            <div className="text-2xl md:text-3xl font-display font-semibold text-foreground">{levelLabel}</div>
          </div>
        </div>
      </div>

      {/* Summary */}
      {summary &&
      <div className="vcl-card">
          <p className="vcl-body text-lg leading-relaxed">{summary}</p>
        </div>
      }
      {/* Level Explanation */}
      {level.explanation &&
      <div className="vcl-card">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-vcl-teal/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-vcl-teal" />
            </div>
            <div>
              <h3 className="vcl-heading-3 mb-2">
                Level {level.number}: {level.label}
              </h3>
              <p className="vcl-body">{level.explanation}</p>
            </div>
          </div>
        </div>
      }

      {/* Readiness vs Willingness */}
      {readinessWillingness &&
      <div className="vcl-card">
          <h3 className="vcl-heading-3 mb-6">Readiness vs Willingness Analysis</h3>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Readiness Score */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Readiness</span>
                <span className="text-lg font-semibold text-foreground">
                  {Math.round(readinessWillingness.readinessScorePercent)}%
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                className={cn("h-full rounded-full transition-all", getScoreBarColor(readinessWillingness.readinessScorePercent))}
                style={{ width: `${Math.round(readinessWillingness.readinessScorePercent)}%` }} />

              </div>
            </div>

            {/* Willingness Score */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Willingness</span>
                <span className="text-lg font-semibold text-foreground">
                  {Math.round(readinessWillingness.willingnessScorePercent)}%
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                className={cn("h-full rounded-full transition-all", getScoreBarColor(readinessWillingness.willingnessScorePercent))}
                style={{ width: `${Math.round(readinessWillingness.willingnessScorePercent)}%` }} />

              </div>
            </div>
          </div>

          {/* Gap Indicator */}
          <div className="p-4 rounded-lg bg-vcl-navy/5 border border-vcl-navy/20">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              readinessWillingness.gapPercent >= 0 ? "bg-vcl-teal/10" : "bg-vcl-amber/10"
            )}>
                {readinessWillingness.gapPercent >= 0 ?
              <TrendingUp className="w-5 h-5 text-vcl-teal" /> :

              <TrendingDown className="w-5 h-5 text-vcl-amber" />
              }
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Gap</span>
                <div className={cn(
                "text-lg font-semibold",
                readinessWillingness.gapPercent >= 0 ? "text-vcl-teal" : "text-vcl-amber"
              )}>
                  {readinessWillingness.gapPercent >= 0 ? "+" : ""}{readinessWillingness.gapPercent.toFixed(1)}%
                </div>
              </div>
            </div>
            {readinessWillingness.diagnosis &&
          <p className="text-sm text-muted-foreground leading-relaxed">{readinessWillingness.diagnosis}</p>
          }
          </div>
        </div>
      }

      {/* Dimension Insights - First One (Always Visible) */}
      {firstInsight &&
      <div className="vcl-card">
          <h3 className="vcl-heading-3 mb-6">Strengths and gaps across key dimensions</h3>
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {firstInsight.strengthOrGap === "Strength" ?
                <TrendingUp className="w-5 h-5 text-vcl-teal" /> :

                <TrendingDown className="w-5 h-5 text-vcl-amber" />
                }
                  <span className="font-medium text-foreground">{firstInsight.dimensionTitle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                  className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full",
                    firstInsight.strengthOrGap === "Strength" ?
                    "bg-vcl-teal/10 text-vcl-teal" :
                    "bg-vcl-amber/10 text-vcl-amber"
                  )}>

                    {firstInsight.strengthOrGap}
                  </span>
                  <span className="font-semibold text-foreground">{Math.round(firstInsight.scorePercent)}%</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                <div
                className={cn("h-full rounded-full transition-all", getScoreBarColor(firstInsight.scorePercent))}
                style={{ width: `${Math.round(firstInsight.scorePercent)}%` }} />

              </div>

              <p className="text-sm text-muted-foreground">{firstInsight.insight}</p>
            </div>
          </div>
        </div>
      }

      {/* Locked Content Container */}
      <div className="relative">
        {/* Blur Overlay */}
        {isLocked &&
        <div className="absolute inset-0 z-10 flex items-center justify-center">
            {/* Frosted glass background */}
            <div className="absolute inset-0 bg-background/60 backdrop-blur-md rounded-2xl" />

            {/* Overlay Content */}
            <div className="relative z-20 text-center p-8 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-vcl-teal/10 flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-vcl-teal" />
              </div>
              <h3 className="text-2xl font-display font-semibold text-foreground mb-3">
                Unlock the full AI readiness report
              </h3>
              <p className="text-muted-foreground mb-8">Receive a detailed report with full insights, recommendations, and next steps tailored to your answers.


            </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="vcl" size="lg" className="gap-2" onClick={delivery.openEmailModal}>
                  <Mail className="w-4 h-4" />
                  Request by Email
                </Button>
                {whatsappEnabled === true &&
              <Button
                variant="outline"
                size="lg"
                className="gap-2 border-green-600 text-green-600 hover:bg-green-50"
                onClick={delivery.openWhatsappModal}>

                    <MessageCircle className="w-4 h-4" />
                    Request by WhatsApp
                  </Button>
              }
              </div>
            </div>
          </div>
        }

        {/* Locked Content (visible but blurred when locked) */}
        <div className={cn("space-y-8 transition-all duration-500", isLocked && "pointer-events-none select-none")}>
          {/* Remaining Dimension Insights */}
          {lockedInsights.length > 0 &&
          <div className="vcl-card">
              <div className="space-y-6">
                {lockedInsights.map((insight, idx) =>
              <div key={idx} className="p-4 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {insight.strengthOrGap === "Strength" ?
                    <TrendingUp className="w-5 h-5 text-vcl-teal" /> :

                    <TrendingDown className="w-5 h-5 text-vcl-amber" />
                    }
                        <span className="font-medium text-foreground">{insight.dimensionTitle}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                      className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full",
                        insight.strengthOrGap === "Strength" ?
                        "bg-vcl-teal/10 text-vcl-teal" :
                        "bg-vcl-amber/10 text-vcl-amber"
                      )}>

                          {insight.strengthOrGap}
                        </span>
                        <span className="font-semibold text-foreground">{Math.round(insight.scorePercent)}%</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                      <div
                    className={cn("h-full rounded-full transition-all", getScoreBarColor(insight.scorePercent))}
                    style={{ width: `${Math.round(insight.scorePercent)}%` }} />

                    </div>

                    <p className="text-sm text-muted-foreground">{insight.insight}</p>
                  </div>
              )}
              </div>
            </div>
          }

          {/* Recommendations */}
          {(recommendations.next90Days.length > 0 || recommendations.next12Months.length > 0) &&
          <div className="grid md:grid-cols-2 gap-6">
              {/* Next 90 Days */}
              {recommendations.next90Days.length > 0 &&
            <div className="vcl-card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-vcl-teal/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-vcl-teal" />
                    </div>
                    <h3 className="vcl-heading-3">Next 90 days</h3>
                  </div>
                  <ul className="space-y-3">
                    {recommendations.next90Days.map((rec, idx) =>
                <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-vcl-teal flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{rec}</span>
                      </li>
                )}
                  </ul>
                </div>
            }

              {/* Next 12 Months */}
              {recommendations.next12Months.length > 0 &&
            <div className="vcl-card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-vcl-navy/10 flex items-center justify-center">
                      <Target className="w-5 h-5 text-vcl-navy" />
                    </div>
                    <h3 className="vcl-heading-3">Next 12 months</h3>
                  </div>
                  <ul className="space-y-3">
                    {recommendations.next12Months.map((rec, idx) =>
                <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-vcl-navy flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{rec}</span>
                      </li>
                )}
                  </ul>
                </div>
            }
            </div>
          }
        </div>
      </div>

      {/* VCL Positioning - Always Visible */}
      {vclPositioning.howVCLCanHelp &&
      <div className="vcl-card-elevated bg-gradient-to-br from-vcl-navy via-vcl-navy to-vcl-navy-light text-white overflow-hidden relative">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-vcl-teal" />
              </div>
              <h3 className="text-2xl font-display font-semibold">How VCL can support your AI journey</h3>
            </div>

            <p className="text-white/85 mb-8 leading-relaxed max-w-3xl">{vclPositioning.howVCLCanHelp}</p>
            <Button
            size="lg"
            asChild
            className="group bg-vcl-teal hover:bg-vcl-teal/90 text-white font-medium px-6 shadow-lg shadow-vcl-teal/25">
          </Button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button
              size="lg"
              asChild
              className="group bg-vcl-teal hover:bg-vcl-teal/90 text-white font-medium px-6 shadow-lg shadow-vcl-teal/25">

                <a
                target="_blank"
                rel="nofollow noopener noreferrer"
                href="https://outlook.office.com/book/VCLDigitalIntroMeeting@ttmassociates.com/?ismsaljsauthenabled">

                  Book a Discovery Session
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
              <span className="text-white/60 text-sm">{vclPositioning.suggestedCallToAction}</span>
            </div>
          </div>
        </div>
      }

      {/* Report Delivery Modals */}
      <ReportDeliveryModals
        emailModalOpen={delivery.emailModalOpen}
        setEmailModalOpen={delivery.setEmailModalOpen}
        emailName={delivery.emailName}
        setEmailName={delivery.setEmailName}
        emailNameError={delivery.emailNameError}
        setEmailNameError={delivery.setEmailNameError}
        email={delivery.email}
        setEmail={delivery.setEmail}
        emailConsent={delivery.emailConsent}
        setEmailConsent={delivery.setEmailConsent}
        emailError={delivery.emailError}
        setEmailError={delivery.setEmailError}
        emailLoading={delivery.deliveryState.email.status === "loading"}
        whatsappModalOpen={delivery.whatsappModalOpen}
        setWhatsappModalOpen={delivery.setWhatsappModalOpen}
        whatsappName={delivery.whatsappName}
        setWhatsappName={delivery.setWhatsappName}
        whatsappNameError={delivery.whatsappNameError}
        setWhatsappNameError={delivery.setWhatsappNameError}
        whatsappNumber={delivery.whatsappNumber}
        setWhatsappNumber={delivery.setWhatsappNumber}
        whatsappConsent={delivery.whatsappConsent}
        setWhatsappConsent={delivery.setWhatsappConsent}
        whatsappError={delivery.whatsappError}
        setWhatsappError={delivery.setWhatsappError}
        whatsappLoading={delivery.deliveryState.whatsapp.status === "loading"}
        onSendEmail={() => delivery.sendReport("email")}
        onSendWhatsApp={() => delivery.sendReport("whatsapp")} />


      {/* Footer */}
      <div className="text-center py-8 text-sm text-muted-foreground">
        <p>Thank you for completing the VCL AI Readiness Check.</p>
        <p className="mt-2">
          Questions? Contact us at{" "}
          <a href={`mailto:${VCL_CONTACT.email}`} className="text-vcl-teal hover:underline">
            {VCL_CONTACT.email}
          </a>
        </p>
      </div>
    </div>);

}