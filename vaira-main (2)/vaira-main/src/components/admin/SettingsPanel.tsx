import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/hooks/useSettings";
import { toast } from "sonner";
import { Loader2, Save, Webhook, Play, CheckCircle, XCircle, FileText, Info, Eye, EyeOff, Bot, Mail, Send } from "lucide-react";
import { LogoUpload } from "./LogoUpload";
import { LANDING_CONTENT, LIKERT_SCALE, VCL_CONTACT, BLOCKED_EMAIL_DOMAINS } from "@/config/assessment";

// All hardcoded narratives/prompts in the system
const SYSTEM_NARRATIVES = [
  {
    category: "Landing Page",
    source: "src/config/assessment.ts → LANDING_CONTENT",
    items: [
      { label: "Title", value: LANDING_CONTENT.title },
      { label: "Subtitle", value: LANDING_CONTENT.subtitle },
      { label: "Description", value: LANDING_CONTENT.description.join("\n\n") },
      { label: "Features", value: LANDING_CONTENT.features.join("\n") },
      { label: "CTA Button Text", value: LANDING_CONTENT.cta },
    ],
  },
  {
    category: "Assessment Questions Page",
    source: "src/components/assessment/DynamicQuestionsStep.tsx",
    items: [
      { label: "Page Heading", value: "AI-Readiness Assessment" },
      { label: "Page Subheading", value: "Rate how strongly you agree or disagree with each statement about your organisation." },
      { label: "Incomplete Error", value: "Please answer all questions before continuing." },
      { label: "All Dimensions Error", value: "Please complete all questions across all dimensions." },
      { label: "Next Button (last)", value: "Continue to results" },
      { label: "Next Button (default)", value: "Next dimension" },
    ],
  },
  {
    category: "Likert Scale Labels",
    source: "src/config/assessment.ts → LIKERT_SCALE",
    items: LIKERT_SCALE.map(s => ({ label: `Value ${s.value}`, value: s.label })),
  },
  {
    category: "Maturity Levels",
    source: "src/lib/scoreCalculations.ts → getMaturityLevel",
    items: [
      { label: "Level 4 (score ≥ 3.5)", value: "Leader" },
      { label: "Level 3 (score ≥ 2.5)", value: "Practitioner" },
      { label: "Level 2 (score ≥ 1.5)", value: "Explorer" },
      { label: "Level 1 (score < 1.5)", value: "Beginner" },
    ],
  },
  {
    category: "Loading State",
    source: "src/components/assessment/LoadingState.tsx",
    items: [
      { label: "Heading", value: "Analysing your answers" },
      { label: "Body", value: "Our system is reviewing your responses to generate personalised insights and recommendations for your organisation." },
      { label: "Timer Note", value: "This usually takes 10-15 seconds" },
    ],
  },
  {
    category: "Results Page – Unlock Overlay",
    source: "src/components/assessment/ResultsDisplay.tsx",
    items: [
      { label: "Heading", value: "Unlock the full AI readiness report" },
      { label: "Body", value: "Receive a detailed PDF with full insights, recommendations, and next steps tailored to your organisation." },
      { label: "Email CTA", value: "Request by Email" },
      { label: "WhatsApp CTA", value: "Request by WhatsApp" },
    ],
  },
  {
    category: "Results Page – Section Headings",
    source: "src/components/assessment/ResultsDisplay.tsx",
    items: [
      { label: "Hero Badge", value: "Assessment Complete" },
      { label: "Hero Title", value: "Your AI Readiness Result" },
      { label: "Dimensions Section", value: "Strengths and gaps across key dimensions" },
      { label: "90 Days Section", value: "Next 90 days" },
      { label: "12 Months Section", value: "Next 12 Months" },
      { label: "VCL Section", value: "How VCL can support your AI journey" },
      { label: "CTA Heading", value: "Ready to accelerate your AI journey?" },
      { label: "CTA Body", value: "Book a discovery session with our team to discuss your results and next steps." },
      { label: "CTA Button", value: "Book a Discovery Session" },
    ],
  },
  {
    category: "Email Template Narrative",
    source: "src/hooks/useReportDelivery.ts & src/components/admin/SendReportDialog.tsx",
    items: [
      { label: "Email Subject (implied)", value: "Your AI Readiness Assessment Results" },
      { label: "Header Title", value: "AI Readiness Assessment" },
      { label: "Header Subtitle", value: "Your personalized results from VCL" },
      { label: "Greeting", value: "Dear {fullName}," },
      { label: "Intro", value: "Thank you for completing the AI Readiness Assessment. Here are your results for {domain}:" },
      { label: "Summary Section", value: "Summary" },
      { label: "Dimensions Section", value: "Strengths and gaps across key dimensions" },
      { label: "Readiness Section", value: "Readiness vs Willingness Analysis" },
      { label: "Recommendations Section", value: "Recommendations" },
      { label: "VCL Section", value: "How VCL can support your AI journey" },
      { label: "CTA Heading", value: "Ready to accelerate your AI journey?" },
      { label: "CTA Body", value: "Book a discovery session with our team to discuss your results and next steps." },
      { label: "CTA Button", value: "Book a Discovery Session" },
      { label: "Footer", value: "© {year} VCL Solutions. All rights reserved." },
    ],
  },
  {
    category: "PDF Report Narrative",
    source: "src/lib/pdfReportGenerator.ts",
    items: [
      { label: "Hero Badge", value: "ASSESSMENT COMPLETE" },
      { label: "Hero Title", value: "Your AI Readiness Result" },
      { label: "Summary Section", value: "Summary" },
      { label: "Level Section", value: "What This Level Means" },
      { label: "Analysis Section", value: "Readiness vs Willingness Analysis" },
      { label: "Readiness Label", value: "READINESS" },
      { label: "Willingness Label", value: "WILLINGNESS" },
      { label: "Dimensions Section", value: "Strengths and Gaps Across Key Dimensions" },
      { label: "Recommendations Section", value: "Recommendations" },
      { label: "90 Days Card", value: "Next 90 Days" },
      { label: "12 Months Card", value: "Next 12 Months" },
      { label: "VCL Section", value: "How VCL Can Help" },
      { label: "CTA Heading", value: "Ready to take the next step?" },
      { label: "CTA Body", value: "Book a discovery session with our team to discuss your results and next steps." },
      { label: "CTA Button", value: "Book a Discovery Call" },
    ],
  },
  {
    category: "Contact & Links",
    source: "src/config/assessment.ts → VCL_CONTACT",
    items: [
      { label: "Booking URL", value: VCL_CONTACT.bookingUrl },
      { label: "Contact Email", value: VCL_CONTACT.email },
      { label: "Logo URL (Email)", value: "/uploads/email-logo.png (relative to site root)" },
    ],
  },
  {
    category: "Blocked Email Domains",
    source: "src/config/assessment.ts → BLOCKED_EMAIL_DOMAINS",
    items: [
      { label: "Blocked Domains", value: BLOCKED_EMAIL_DOMAINS.join(", ") },
    ],
  },
  {
    category: "Landing Page Footer",
    source: "src/components/assessment/LandingSection.tsx",
    items: [
      { label: "Copyright", value: "Copyright 2025 © VCL LTD | All rights Reserved" },
    ],
  },
  {
    category: "Trust Badges",
    source: "src/components/assessment/LandingSection.tsx",
    items: [
      { label: "Badge 1", value: "Verified Questionnaire" },
      { label: "Badge 2", value: "Best Practice" },
      { label: "Badge 3", value: "Data-Driven" },
    ],
  },
];

export function SettingsPanel() {
  const { settings, loading, updateSetting, refetch } = useSettings();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [deliveryWebhookUrl, setDeliveryWebhookUrl] = useState("");
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [geminiModel, setGeminiModel] = useState("gemini-2.0-flash");
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [graphTenantId, setGraphTenantId] = useState("");
  const [graphClientId, setGraphClientId] = useState("");
  const [graphClientSecret, setGraphClientSecret] = useState("");
  const [showGraphSecret, setShowGraphSecret] = useState(false);
  const [graphFromEmail, setGraphFromEmail] = useState("");
  const [graphFromName, setGraphFromName] = useState("VCL AI Assessment");
  const [testEmailTo, setTestEmailTo] = useState("");
  const [testingEmail, setTestingEmail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [testingResults, setTestingResults] = useState(false);
  const [testingDelivery, setTestingDelivery] = useState(false);

  useEffect(() => {
    if (settings.length > 0) {
      const webhook = settings.find(s => s.key === "webhook_url");
      const delivery = settings.find(s => s.key === "delivery_webhook_url");
      const whatsapp = settings.find(s => s.key === "whatsapp_enabled");
      const geminiKey = settings.find(s => s.key === "gemini_api_key");
      const geminiMod = settings.find(s => s.key === "gemini_model");
      const tenantId  = settings.find(s => s.key === "graph_tenant_id");
      const clientId  = settings.find(s => s.key === "graph_client_id");
      const secret    = settings.find(s => s.key === "graph_client_secret");
      const fromEmail = settings.find(s => s.key === "graph_from_email");
      const fromName  = settings.find(s => s.key === "graph_from_name");
      if (webhook) setWebhookUrl(webhook.value);
      if (delivery) setDeliveryWebhookUrl(delivery.value);
      if (whatsapp) setWhatsappEnabled(whatsapp.value === "true");
      if (geminiKey) setGeminiApiKey(geminiKey.value);
      if (geminiMod) setGeminiModel(geminiMod.value);
      if (tenantId)  setGraphTenantId(tenantId.value);
      if (clientId)  setGraphClientId(clientId.value);
      if (secret)    setGraphClientSecret(secret.value);
      if (fromEmail) setGraphFromEmail(fromEmail.value);
      if (fromName)  setGraphFromName(fromName.value);
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSetting("webhook_url", webhookUrl);
      await updateSetting("delivery_webhook_url", deliveryWebhookUrl);
      await updateSetting("whatsapp_enabled", whatsappEnabled ? "true" : "false");
      if (geminiApiKey && !geminiApiKey.startsWith("****")) {
        await updateSetting("gemini_api_key", geminiApiKey);
      }
      await updateSetting("gemini_model", geminiModel);
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    setSavingEmail(true);
    try {
      await updateSetting("graph_tenant_id", graphTenantId);
      await updateSetting("graph_client_id", graphClientId);
      if (graphClientSecret && graphClientSecret !== "••••••••") {
        await updateSetting("graph_client_secret", graphClientSecret);
      }
      await updateSetting("graph_from_email", graphFromEmail);
      await updateSetting("graph_from_name", graphFromName);
      toast.success("Email settings saved successfully");
    } catch {
      toast.error("Failed to save email settings");
    } finally {
      setSavingEmail(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailTo) { toast.error("Enter a test email address"); return; }
    setTestingEmail(true);
    try {
      const res = await fetch("/api/send-email.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmailTo,
          fullName: "Admin Test",
          emailhtml: "<html><body style='font-family:sans-serif;padding:32px'><h2 style='color:#CE2823'>✅ Graph API Test</h2><p>Your Microsoft Graph API email configuration is working correctly.</p></body></html>",
          participant: { domain: "vcl.solutions" },
        }),
      });
      const data = await res.json();
      if (data.success) toast.success("Test email sent successfully");
      else toast.error("Failed: " + (data.error || "Unknown error"));
    } catch {
      toast.error("Could not reach email endpoint");
    } finally {
      setTestingEmail(false);
    }
  };

  const testWebhook = async (url: string, type: "results" | "delivery") => {
    if (!url) {
      toast.error("Please enter a webhook URL first");
      return;
    }

    const setTesting = type === "results" ? setTestingResults : setTestingDelivery;
    setTesting(true);

    try {
      const testPayload = {
        test: true,
        timestamp: new Date().toISOString(),
        source: "VCL Admin Panel",
        type: type === "results" ? "results_calculation_test" : "delivery_test",
      };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testPayload),
      });

      if (response.ok) {
        toast.success(`${type === "results" ? "Results" : "Delivery"} webhook responded successfully`, {
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        });
      } else {
        toast.error(`Webhook returned status ${response.status}`, {
          icon: <XCircle className="w-4 h-4 text-red-500" />,
        });
      }
    } catch (error) {
      toast.error(`Failed to reach webhook: ${error instanceof Error ? error.message : "Unknown error"}`, {
        icon: <XCircle className="w-4 h-4 text-red-500" />,
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="email">Email</TabsTrigger>
        <TabsTrigger value="narratives">Narratives & Prompts</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-6">
        <LogoUpload />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AI Configuration
            </CardTitle>
            <CardDescription>
              Gemini API key used to generate personalised assessment insights.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gemini-key">Gemini API Key</Label>
              <div className="relative">
                <Input
                  id="gemini-key"
                  type={showGeminiKey ? "text" : "password"}
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowGeminiKey(v => !v)}
                >
                  {showGeminiKey
                    ? <EyeOff className="h-4 w-4 text-muted-foreground" />
                    : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your key at <strong>aistudio.google.com</strong> → Get API key.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gemini-model">Gemini Model</Label>
              <Input
                id="gemini-model"
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                placeholder="gemini-2.0-flash"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report Delivery Options</CardTitle>
            <CardDescription>
              Control which delivery methods are available to users on the results page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="whatsapp-toggle">Request by WhatsApp</Label>
                <p className="text-xs text-muted-foreground">
                  Show or hide the "Request by WhatsApp" button on the unlock overlay.
                </p>
              </div>
              <Switch
                id="whatsapp-toggle"
                checked={whatsappEnabled}
                onCheckedChange={setWhatsappEnabled}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="w-5 h-5" />
              Webhook Configuration
            </CardTitle>
            <CardDescription>
              Configure the webhook URLs used for assessment processing and report delivery.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Results Calculation Webhook</Label>
              <div className="flex gap-2">
                <Input
                  id="webhook-url"
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://n8n.dopes.me/webhook/..."
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => testWebhook(webhookUrl, "results")}
                  disabled={testingResults}
                  title="Test webhook"
                >
                  {testingResults ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This webhook is called to process assessment results and generate insights.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery-webhook-url">Report Delivery Webhook</Label>
              <div className="flex gap-2">
                <Input
                  id="delivery-webhook-url"
                  type="url"
                  value={deliveryWebhookUrl}
                  onChange={(e) => setDeliveryWebhookUrl(e.target.value)}
                  placeholder="https://n8n.dopes.me/webhook/..."
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => testWebhook(deliveryWebhookUrl, "delivery")}
                  disabled={testingDelivery}
                  title="Test webhook"
                >
                  {testingDelivery ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This webhook is called to send reports via email or WhatsApp.
              </p>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="email" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Microsoft Graph API — Email Configuration
            </CardTitle>
            <CardDescription>
              Configure Office 365 email delivery via Microsoft Graph API. Requires an Azure App Registration with Mail.Send permission.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="graph-tenant">Tenant ID (Directory ID)</Label>
                <Input id="graph-tenant" value={graphTenantId} onChange={e => setGraphTenantId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="graph-client">Client ID (Application ID)</Label>
                <Input id="graph-client" value={graphClientId} onChange={e => setGraphClientId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="graph-secret">Client Secret</Label>
              <div className="relative">
                <Input
                  id="graph-secret"
                  type={showGraphSecret ? "text" : "password"}
                  value={graphClientSecret}
                  onChange={e => setGraphClientSecret(e.target.value)}
                  placeholder="Leave blank to keep existing secret"
                  className="pr-10"
                />
                <Button type="button" variant="ghost" size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowGraphSecret(v => !v)}>
                  {showGraphSecret ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="graph-from-email">From Email</Label>
                <Input id="graph-from-email" type="email" value={graphFromEmail} onChange={e => setGraphFromEmail(e.target.value)} placeholder="info@vcl.solutions" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="graph-from-name">From Name</Label>
                <Input id="graph-from-name" value={graphFromName} onChange={e => setGraphFromName(e.target.value)} placeholder="VCL AI Assessment" />
              </div>
            </div>
            <Button onClick={handleSaveEmail} disabled={savingEmail} className="w-full sm:w-auto">
              {savingEmail ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Email Settings</>}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Test Email
            </CardTitle>
            <CardDescription>Send a test email to verify your Microsoft Graph API configuration.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="email"
                value={testEmailTo}
                onChange={e => setTestEmailTo(e.target.value)}
                placeholder="your@email.com"
                className="flex-1"
              />
              <Button onClick={handleTestEmail} disabled={testingEmail}>
                {testingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Test"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="narratives" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              System Narratives & Prompts
            </CardTitle>
            <CardDescription>
              All hardcoded text, labels, and prompts used across the assessment, results page, email templates, and PDF reports. These are read-only — to change them, update the source code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {SYSTEM_NARRATIVES.map((section) => (
                <div key={section.category}>
                  <div className="mb-3">
                    <h3 className="text-base font-semibold text-foreground">{section.category}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Info className="w-3 h-3" />
                      {section.source}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <tbody>
                        {section.items.map((item, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-muted/30" : "bg-background"}>
                            <td className="px-4 py-2.5 font-medium text-muted-foreground whitespace-nowrap align-top w-[180px] border-r border-border">
                              {item.label}
                            </td>
                            <td className="px-4 py-2.5 text-foreground whitespace-pre-wrap break-words">
                              {item.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}