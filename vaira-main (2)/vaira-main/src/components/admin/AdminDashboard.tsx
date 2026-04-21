import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { resultsApi, uploadApi } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, LogOut, Eye, Download, RefreshCw, Users, FileText, TrendingUp, Settings, Key, ChevronDown, Webhook, Mail, MessageCircle, RotateCcw } from "lucide-react";
import { generateReportBlob, ReportData as PdfReportData } from "@/lib/pdfReportGenerator";
import { toast } from "@/hooks/use-toast";
import { QuestionsSetup } from "./QuestionsSetup";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { SettingsPanel } from "./SettingsPanel";
import { SendReportDialog } from "./SendReportDialog";

type AdminView = "dashboard" | "questions" | "settings";

interface Submission {
  id: string;
  participant_id: string;
  overall_score: number;
  level_number: number;
  level_label: string;
  scores: any;
  agent_result: any;
  answers: any;
  pdf_url: string | null;
  created_at: string;
  participants: {
    id: string;
    domain: string;
    original_website: string | null;
    email: string | null;
    full_name: string | null;
    phone_number: string | null;
    consent_to_contact: boolean;
    created_at: string;
  } | null;
}

export function AdminDashboard() {
  const { signOut, user } = useAuth();
  const [currentView, setCurrentView] = useState<AdminView>("dashboard");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [sendReportSubmission, setSendReportSubmission] = useState<Submission | null>(null);
  const [sendReportMode, setSendReportMode] = useState<"email" | "whatsapp">("email");
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const data = await resultsApi.adminGetAll();
      setSubmissions(data || []);
    } catch (err) {
      console.error("Error fetching submissions:", err);
      toast({
        title: "Error",
        description: "Failed to load submissions.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out successfully" });
  };

  const getLevelBadgeVariant = (level: number): "default" | "secondary" | "destructive" | "outline" => {
    if (level >= 4) return "default";
    if (level >= 3) return "secondary";
    return "destructive";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRegeneratePdf = async (submission: Submission) => {
    setRegeneratingId(submission.id);
    try {
      // Build PDF report data from submission
      const agentResult = submission.agent_result || {};
      const dimensionInsights = (agentResult?.dimensionInsights || []).map((dim: any) => ({
        title: dim.dimensionTitle || "",
        score: dim.scorePercent || 0,
        isStrength: dim.strengthOrGap === "Strength",
        insight: dim.insight || "",
      }));

      const pdfData: PdfReportData = {
        companyDomain: submission.participants?.domain || "Unknown",
        participantName: submission.participants?.full_name || submission.participants?.domain || "Unknown",
        reportDate: new Date(submission.created_at).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        overallScore: submission.overall_score || 0,
        levelNumber: submission.level_number || 1,
        levelLabel: submission.level_label || "Unknown",
        summary: agentResult?.summary || "",
        levelExplanation: agentResult?.level?.explanation || "",
        readinessScore: agentResult?.readinessWillingness?.readinessScorePercent || 0,
        willingnessScore: agentResult?.readinessWillingness?.willingnessScorePercent || 0,
        gapPercentage: agentResult?.readinessWillingness?.gapPercent || 0,
        gapDiagnosis: agentResult?.readinessWillingness?.diagnosis || "",
        dimensionInsights,
        recommendations90Days: agentResult?.recommendations?.next90Days || [],
        recommendations12Months: agentResult?.recommendations?.next12Months || [],
        vclPositioning: agentResult?.vclPositioning?.howVCLCanHelp || "",
      };

      // Generate new PDF blob
      const pdfBlob = await generateReportBlob(pdfData);

      // Upload new PDF to Hostinger /uploads/reports/
      const newFileName = `report-${submission.participant_id}-${Date.now()}.pdf`;
      const { url: newPdfUrl } = await uploadApi.uploadPdf(pdfBlob, newFileName);

      // Update result with new PDF URL
      await resultsApi.updatePdfUrl(submission.id, newPdfUrl);

      // Refresh submissions list
      await fetchSubmissions();

      toast({
        title: "PDF Regenerated",
        description: "The report PDF has been regenerated successfully.",
      });
    } catch (err) {
      console.error("Error regenerating PDF:", err);
      toast({
        title: "Error",
        description: "Failed to regenerate PDF report.",
        variant: "destructive",
      });
    } finally {
      setRegeneratingId(null);
    }
  };

  const totalSubmissions = submissions.length;
  const avgScore = submissions.length > 0
    ? Math.round(submissions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / submissions.length)
    : 0;
  const consentCount = submissions.filter(s => s.participants?.consent_to_contact).length;

  return (
    <div className="min-h-screen bg-gray-50" style={{ colorScheme: 'light' }}>
      <header className="border-b border-gray-200 bg-white sticky top-16 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">
              Logged in as {user?.email}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => setCurrentView("questions")}
              className={currentView === "questions"
                ? "bg-[#ce2823] hover:bg-[#b02020] text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"}
            >
              <Settings className="mr-2 h-4 w-4" />
              Questions Setup
            </Button>
            <Button
              size="sm"
              onClick={() => setCurrentView("settings")}
              className={currentView === "settings"
                ? "bg-[#ce2823] hover:bg-[#b02020] text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"}
            >
              <Webhook className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100">
                  Account
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border border-gray-200">
                <DropdownMenuItem onClick={() => setPasswordDialogOpen(true)} className="text-gray-700 hover:bg-gray-100">
                  <Key className="mr-2 h-4 w-4" />
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-gray-700 hover:bg-gray-100">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {currentView === "questions" ? (
          <QuestionsSetup onBack={() => setCurrentView("dashboard")} />
        ) : currentView === "settings" ? (
          <SettingsPanel />
        ) : (
          <>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total Submissions</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{totalSubmissions}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{avgScore}%</div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Consented to Contact</CardTitle>
              <FileText className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{consentCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Submissions Table */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-gray-900">Assessment Submissions</CardTitle>
              <CardDescription className="text-gray-500">View all completed assessments and their results.</CardDescription>
            </div>
            <Button size="sm" onClick={fetchSubmissions} disabled={isLoading}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100">
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No submissions yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Consent</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(submission.created_at)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {submission.participants?.domain || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {submission.participants?.full_name || '-'}
                        </TableCell>
                        <TableCell>
                          {submission.participants?.email || '-'}
                        </TableCell>
                        <TableCell>
                          {submission.participants?.phone_number || '-'}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            {Math.round(submission.overall_score || 0)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getLevelBadgeVariant(submission.level_number)}>
                            L{submission.level_number}: {submission.level_label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {submission.participants?.consent_to_contact ? (
                            <Badge variant="default">Yes</Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedSubmission(submission)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {submission.pdf_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                title="Download PDF"
                              >
                                <a href={submission.pdf_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRegeneratePdf(submission)}
                              disabled={regeneratingId === submission.id}
                              title="Regenerate PDF"
                            >
                              {regeneratingId === submission.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RotateCcw className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSendReportSubmission(submission);
                                setSendReportMode("email");
                              }}
                              title="Send via Email"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSendReportSubmission(submission);
                                setSendReportMode("whatsapp");
                              }}
                              title="Send via WhatsApp"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
          </>
        )}
      </main>

      {/* Details Modal */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Assessment Details</DialogTitle>
            <DialogDescription>
              {selectedSubmission?.participants?.domain} - {formatDate(selectedSubmission?.created_at || '')}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            {selectedSubmission && (
              <div className="space-y-6">
                {/* Participant Info */}
                <div>
                  <h4 className="font-semibold mb-2">Participant Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Domain:</div>
                    <div>{selectedSubmission.participants?.domain}</div>
                    <div className="text-muted-foreground">Website:</div>
                    <div>{selectedSubmission.participants?.original_website || '-'}</div>
                    <div className="text-muted-foreground">Name:</div>
                    <div>{selectedSubmission.participants?.full_name || '-'}</div>
                    <div className="text-muted-foreground">Email:</div>
                    <div>{selectedSubmission.participants?.email || '-'}</div>
                    <div className="text-muted-foreground">WhatsApp:</div>
                    <div>{selectedSubmission.participants?.phone_number || '-'}</div>
                    <div className="text-muted-foreground">Consent:</div>
                    <div>{selectedSubmission.participants?.consent_to_contact ? 'Yes' : 'No'}</div>
                  </div>
                </div>

                {/* Score */}
                <div>
                  <h4 className="font-semibold mb-2">Results</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Overall Score:</div>
                    <div className="font-bold">{Math.round(selectedSubmission.overall_score)}%</div>
                    <div className="text-muted-foreground">Level:</div>
                    <div>{selectedSubmission.level_number}: {selectedSubmission.level_label}</div>
                  </div>
                </div>

                {/* Dimension Scores */}
                {selectedSubmission.scores?.dimensions && (
                  <div>
                    <h4 className="font-semibold mb-2">Dimension Scores</h4>
                    <div className="space-y-2">
                      {Object.entries(selectedSubmission.scores.dimensions).map(([key, dim]: [string, any]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="font-medium">{Math.round(dim.pct)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Answers */}
                {selectedSubmission.answers && (
                  <div>
                    <h4 className="font-semibold mb-2">Answers</h4>
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                      {JSON.stringify(selectedSubmission.answers, null, 2)}
                    </pre>
                  </div>
                )}

                {/* PDF Link */}
                {selectedSubmission.pdf_url && (
                  <div>
                    <h4 className="font-semibold mb-2">PDF Report</h4>
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedSubmission.pdf_url} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Password Change Dialog */}
      <ChangePasswordDialog 
        open={passwordDialogOpen} 
        onOpenChange={setPasswordDialogOpen} 
      />

      {/* Send Report Dialog */}
      {sendReportSubmission && (
        <SendReportDialog
          open={!!sendReportSubmission}
          onOpenChange={(open) => !open && setSendReportSubmission(null)}
          submission={sendReportSubmission}
          mode={sendReportMode}
          onSuccess={() => {
            toast({ title: "Report sent successfully" });
            fetchSubmissions();
          }}
        />
      )}
    </div>
  );
}
