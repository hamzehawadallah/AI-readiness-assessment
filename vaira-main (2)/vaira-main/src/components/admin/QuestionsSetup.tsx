import { useState } from "react";
import { useAdminAssessment, DynamicDimension, DynamicQuestion, QuestionOption } from "@/hooks/useDynamicAssessment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, GripVertical, Loader2, RefreshCw, ArrowLeft, Star, ListChecks, Tag, X, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionsSetupProps {
  onBack: () => void;
}

interface OptionFormData {
  id?: string;
  label: string;
  grade: number;
  display_order: number;
}

export function QuestionsSetup({ onBack }: QuestionsSetupProps) {
  const {
    dimensions,
    isLoading,
    refetch,
    createDimension,
    updateDimension,
    deleteDimension,
    deleteQuestion,
    saveQuestionWithOptions,
  } = useAdminAssessment();

  // Dimension modal state
  const [dimModalOpen, setDimModalOpen] = useState(false);
  const [editingDimension, setEditingDimension] = useState<DynamicDimension | null>(null);
  const [dimForm, setDimForm] = useState({
    dimension_key: "",
    title: "",
    short_title: "",
    description: "",
    display_order: 0,
  });
  const [dimLoading, setDimLoading] = useState(false);

  // Question modal state
  const [qModalOpen, setQModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<DynamicQuestion | null>(null);
  const [selectedDimensionId, setSelectedDimensionId] = useState<string | null>(null);
  const [qForm, setQForm] = useState({
    question_key: "",
    text: "",
    display_order: 0,
    is_active: true,
    question_type: "rating" as "rating" | "selection",
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");
  const [qLoading, setQLoading] = useState(false);
  
  // Options state for selection type
  const [tempOptions, setTempOptions] = useState<OptionFormData[]>([]);

  // Delete confirmation state
  const [deleteDialog, setDeleteDialog] = useState<{
    type: "dimension" | "question";
    id: string;
    name: string;
  } | null>(null);

  // Dimension handlers
  const openAddDimension = () => {
    setEditingDimension(null);
    setDimForm({
      dimension_key: "",
      title: "",
      short_title: "",
      description: "",
      display_order: dimensions.length + 1,
    });
    setDimModalOpen(true);
  };

  const openEditDimension = (dim: DynamicDimension) => {
    setEditingDimension(dim);
    setDimForm({
      dimension_key: dim.dimension_key,
      title: dim.title,
      short_title: dim.short_title,
      description: dim.description,
      display_order: dim.display_order,
    });
    setDimModalOpen(true);
  };

  const handleDimSubmit = async () => {
    if (!dimForm.dimension_key || !dimForm.title || !dimForm.short_title) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setDimLoading(true);
    try {
      if (editingDimension) {
        await updateDimension(editingDimension.id, dimForm);
        toast({ title: "Dimension updated successfully" });
      } else {
        await createDimension(dimForm);
        toast({ title: "Dimension created successfully" });
      }
      setDimModalOpen(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save dimension",
        variant: "destructive",
      });
    } finally {
      setDimLoading(false);
    }
  };

  // Question handlers
  const openAddQuestion = (dimensionId: string) => {
    const dim = dimensions.find(d => d.id === dimensionId);
    setSelectedDimensionId(dimensionId);
    setEditingQuestion(null);
    setQForm({
      question_key: "",
      text: "",
      display_order: (dim?.questions.length || 0) + 1,
      is_active: true,
      question_type: "rating",
      tags: [],
    });
    setTempOptions([]);
    setTagInput("");
    setQModalOpen(true);
  };

  const openEditQuestion = (question: DynamicQuestion) => {
    setSelectedDimensionId(question.dimension_id);
    setEditingQuestion(question);
    setQForm({
      question_key: question.question_key,
      text: question.text,
      display_order: question.display_order,
      is_active: question.is_active,
      question_type: question.question_type,
      tags: question.tags || [],
    });
    setTempOptions(question.options.map(o => ({
      id: o.id,
      label: o.label,
      grade: o.grade,
      display_order: o.display_order,
    })));
    setTagInput("");
    setQModalOpen(true);
  };

  const handleQSubmit = async () => {
    if (!qForm.question_key || !qForm.text || !selectedDimensionId) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    if (qForm.question_type === "selection" && tempOptions.length < 2) {
      toast({ title: "Selection questions need at least 2 options", variant: "destructive" });
      return;
    }

    setQLoading(true);
    try {
      await saveQuestionWithOptions(
        editingQuestion?.id || null,
        {
          dimension_id: selectedDimensionId,
          question_key: qForm.question_key,
          text: qForm.text,
          display_order: qForm.display_order,
          is_active: qForm.is_active,
          question_type: qForm.question_type,
          tags: qForm.tags,
        },
        tempOptions,
        editingQuestion?.options || []
      );
      
      toast({ title: editingQuestion ? "Question updated successfully" : "Question created successfully" });
      setQModalOpen(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save question",
        variant: "destructive",
      });
    } finally {
      setQLoading(false);
    }
  };

  // Options handlers
  const addOption = () => {
    setTempOptions(prev => [...prev, {
      label: "",
      grade: 0,
      display_order: prev.length + 1,
    }]);
  };

  const updateOption = (index: number, field: keyof OptionFormData, value: string | number) => {
    setTempOptions(prev => prev.map((opt, i) => 
      i === index ? { ...opt, [field]: value } : opt
    ));
  };

  const removeOption = (index: number) => {
    setTempOptions(prev => prev.filter((_, i) => i !== index));
  };

  // Tag handlers
  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !qForm.tags.includes(tag)) {
      setQForm({ ...qForm, tags: [...qForm.tags, tag] });
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setQForm({ ...qForm, tags: qForm.tags.filter(t => t !== tag) });
  };

  // Delete handlers
  const confirmDelete = async () => {
    if (!deleteDialog) return;

    try {
      if (deleteDialog.type === "dimension") {
        await deleteDimension(deleteDialog.id);
        toast({ title: "Dimension deleted successfully" });
      } else {
        await deleteQuestion(deleteDialog.id);
        toast({ title: "Question deleted successfully" });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete",
        variant: "destructive",
      });
    } finally {
      setDeleteDialog(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            const exportData = dimensions.map(dim => ({
              dimension_key: dim.dimension_key,
              title: dim.title,
              short_title: dim.short_title,
              description: dim.description,
              display_order: dim.display_order,
              questions: dim.questions.map(q => ({
                question_key: q.question_key,
                text: q.text,
                display_order: q.display_order,
                is_active: q.is_active,
                question_type: q.question_type,
                tags: q.tags,
                ...(q.question_type === "selection" ? {
                  options: q.options.map(o => ({
                    label: o.label,
                    grade: o.grade,
                    display_order: o.display_order,
                  }))
                } : {}),
              })),
            }));
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `vcl-assessment-export-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast({ title: "Export downloaded successfully" });
          }}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={openAddDimension}>
            <Plus className="h-4 w-4 mr-2" />
            Add Dimension
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessment Questions Setup</CardTitle>
          <CardDescription>
            Manage dimensions and questions for the AI readiness assessment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dimensions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No dimensions configured yet. Add your first dimension to get started.
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-4">
              {dimensions.map((dim) => (
                <AccordionItem
                  key={dim.id}
                  value={dim.id}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-4 flex-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <div className="text-left">
                        <div className="font-medium">{dim.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {dim.short_title} • {dim.questions.length} question(s)
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="space-y-4">
                      {/* Dimension info */}
                      <div className="flex items-start justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Key: {dim.dimension_key}</div>
                          <div className="text-sm">{dim.description}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDimension(dim)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteDialog({
                              type: "dimension",
                              id: dim.id,
                              name: dim.title,
                            })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Questions */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Questions</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAddQuestion(dim.id)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Question
                          </Button>
                        </div>

                        {dim.questions.length === 0 ? (
                          <div className="text-sm text-muted-foreground py-4 text-center">
                            No questions yet
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {dim.questions.map((q, idx) => (
                              <div
                                key={q.id}
                                className={cn(
                                  "flex items-start gap-3 p-3 rounded-lg border",
                                  !q.is_active && "opacity-50"
                                )}
                              >
                                <span className="text-sm text-muted-foreground font-mono">
                                  {idx + 1}.
                                </span>
                                <div className="flex-1">
                                  <div className="text-sm">{q.text}</div>
                                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                    <span>Key: {q.question_key}</span>
                                    <span className="flex items-center gap-1">
                                      {q.question_type === "rating" ? (
                                        <><Star className="h-3 w-3" /> Rating (1-5)</>
                                      ) : (
                                        <><ListChecks className="h-3 w-3" /> Selection ({q.options.length} options)</>
                                      )}
                                    </span>
                                    {!q.is_active && <span>• Inactive</span>}
                                  </div>
                                    {q.question_type === "selection" && q.options.length > 0 && (
                                      <div className="mt-2 text-xs text-muted-foreground">
                                        Options: {q.options.map(o => `${o.label} (${o.grade})`).join(", ")}
                                      </div>
                                    )}
                                    {q.tags && q.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {q.tags.map(tag => (
                                          <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs"
                                          >
                                            <Tag className="h-2.5 w-2.5" />
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openEditQuestion(q)}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => setDeleteDialog({
                                        type: "question",
                                        id: q.id,
                                        name: q.text.substring(0, 50) + "...",
                                      })}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Dimension Modal */}
      <Dialog open={dimModalOpen} onOpenChange={setDimModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDimension ? "Edit Dimension" : "Add Dimension"}
            </DialogTitle>
            <DialogDescription>
              Dimensions group related assessment questions together.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dim-key">Dimension Key *</Label>
                <Input
                  id="dim-key"
                  value={dimForm.dimension_key}
                  onChange={(e) => setDimForm({ ...dimForm, dimension_key: e.target.value })}
                  placeholder="strategyGovernance"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dim-order">Display Order</Label>
                <Input
                  id="dim-order"
                  type="number"
                  value={dimForm.display_order}
                  onChange={(e) => setDimForm({ ...dimForm, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dim-title">Title *</Label>
              <Input
                id="dim-title"
                value={dimForm.title}
                onChange={(e) => setDimForm({ ...dimForm, title: e.target.value })}
                placeholder="Strategy and Governance"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dim-short">Short Title *</Label>
              <Input
                id="dim-short"
                value={dimForm.short_title}
                onChange={(e) => setDimForm({ ...dimForm, short_title: e.target.value })}
                placeholder="Strategy"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dim-desc">Description</Label>
              <Textarea
                id="dim-desc"
                value={dimForm.description}
                onChange={(e) => setDimForm({ ...dimForm, description: e.target.value })}
                placeholder="How well AI is embedded in your organisational vision..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDimModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDimSubmit} disabled={dimLoading}>
              {dimLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingDimension ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Modal */}
      <Dialog open={qModalOpen} onOpenChange={setQModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Edit Question" : "Add Question"}
            </DialogTitle>
            <DialogDescription>
              Configure question type and content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="q-key">Question Key *</Label>
                <Input
                  id="q-key"
                  value={qForm.question_key}
                  onChange={(e) => setQForm({ ...qForm, question_key: e.target.value })}
                  placeholder="sg1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-order">Display Order</Label>
                <Input
                  id="q-order"
                  type="number"
                  value={qForm.display_order}
                  onChange={(e) => setQForm({ ...qForm, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="q-type">Question Type *</Label>
              <Select
                value={qForm.question_type}
                onValueChange={(value: "rating" | "selection") => {
                  setQForm({ ...qForm, question_type: value });
                  if (value === "selection" && tempOptions.length === 0) {
                    setTempOptions([
                      { label: "", grade: 1, display_order: 1 },
                      { label: "", grade: 2, display_order: 2 },
                    ]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select question type" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  <SelectItem value="rating">
                    <span className="flex items-center gap-2">
                      <Star className="h-4 w-4" /> Rating (1-5 scale)
                    </span>
                  </SelectItem>
                  <SelectItem value="selection">
                    <span className="flex items-center gap-2">
                      <ListChecks className="h-4 w-4" /> Selection (custom options)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="q-text">Question Text *</Label>
              <Textarea
                id="q-text"
                value={qForm.text}
                onChange={(e) => setQForm({ ...qForm, text: e.target.value })}
                placeholder="Our organization has a clear AI strategy..."
                rows={3}
              />
            </div>
            
            {/* Tags section */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag (e.g., readiness)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {qForm.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {qForm.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Tags help group questions for custom reporting beyond dimensions.
              </p>
            </div>
            
            {qForm.question_type === "selection" && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <Label>Answer Options</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addOption}>
                    <Plus className="h-3 w-3 mr-1" /> Add Option
                  </Button>
                </div>
                
                {tempOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-6">{idx + 1}.</span>
                    <Input
                      value={opt.label}
                      onChange={(e) => updateOption(idx, 'label', e.target.value)}
                      placeholder="Option label"
                      className="flex-1"
                    />
                    <div className="flex items-center gap-1">
                      <Label className="text-xs text-muted-foreground">Grade:</Label>
                      <Input
                        type="number"
                        value={opt.grade}
                        onChange={(e) => updateOption(idx, 'grade', parseFloat(e.target.value) || 0)}
                        className="w-20"
                        step="0.5"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeOption(idx)}
                      disabled={tempOptions.length <= 2}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                
                <p className="text-xs text-muted-foreground">
                  The grade value will be added to the total score when this option is selected.
                </p>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Switch
                id="q-active"
                checked={qForm.is_active}
                onCheckedChange={(checked) => setQForm({ ...qForm, is_active: checked })}
              />
              <Label htmlFor="q-active">Active (shown in assessment)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleQSubmit} disabled={qLoading}>
              {qLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingQuestion ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteDialog?.type}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog?.name}"?
              {deleteDialog?.type === "dimension" && (
                " This will also delete all questions in this dimension."
              )}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
