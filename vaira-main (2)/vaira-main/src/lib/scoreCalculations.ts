import { DynamicDimension, DynamicAnswers } from "@/hooks/useDynamicAssessment";

export interface DimensionScore {
  dimensionKey: string;
  dimensionTitle: string;
  score: number; // 1-4 scale
  scorePercent: number; // 0-100 scale
  questionCount: number;
}

export interface TagScore {
  tag: string;
  score: number; // 1-4 scale
  scorePercent: number; // 0-100 scale
  questionCount: number;
}

export interface CalculatedScores {
  dimensionScores: DimensionScore[];
  tagScores: TagScore[];
  overallScore: number; // 1-4 scale
  overallScorePercent: number; // 0-100 scale
  levelNumber: number;
  levelLabel: string;
}

// Map score (1-4) to maturity level
function getMaturityLevel(score: number): { number: number; label: string } {
  if (score >= 3.5) return { number: 4, label: "Leader" };
  if (score >= 2.5) return { number: 3, label: "Practitioner" };
  if (score >= 1.5) return { number: 2, label: "Explorer" };
  return { number: 1, label: "Beginner" };
}

// Convert 1-4 score to percentage (0-100)
function scoreToPercent(score: number): number {
  return ((score - 1) / 3) * 100;
}

export function calculateScores(
  dimensions: DynamicDimension[],
  answers: DynamicAnswers
): CalculatedScores {
  const dimensionScores: DimensionScore[] = [];
  const tagScoreMap: Map<string, { total: number; count: number }> = new Map();

  // Calculate dimension scores
  for (const dimension of dimensions) {
    const dimensionAnswers = answers[dimension.dimension_key] || [];
    let totalScore = 0;
    let questionCount = 0;

    dimension.questions.forEach((question, qIndex) => {
      const answerValue = dimensionAnswers[qIndex];
      if (answerValue === undefined || answerValue === 0) return;

      let grade: number;

      if (question.question_type === "selection") {
        // For selection type, the answer is the option index (1-based)
        const sortedOptions = [...question.options].sort((a, b) => a.display_order - b.display_order);
        const selectedOption = sortedOptions[answerValue - 1];
        grade = selectedOption?.grade || 0;
      } else {
        // For rating type, the answer value IS the grade (1-5)
        grade = answerValue;
      }

      if (grade > 0) {
        totalScore += grade;
        questionCount++;

        // Track tag scores
        if (question.tags && question.tags.length > 0) {
          for (const tag of question.tags) {
            const existing = tagScoreMap.get(tag) || { total: 0, count: 0 };
            existing.total += grade;
            existing.count += 1;
            tagScoreMap.set(tag, existing);
          }
        }
      }
    });

    const avgScore = questionCount > 0 ? totalScore / questionCount : 0;
    
    dimensionScores.push({
      dimensionKey: dimension.dimension_key,
      dimensionTitle: dimension.title,
      score: Math.round(avgScore * 100) / 100,
      scorePercent: Math.round(scoreToPercent(avgScore) * 100) / 100,
      questionCount,
    });
  }

  // Calculate tag scores
  const tagScores: TagScore[] = [];
  for (const [tag, data] of tagScoreMap) {
    const avgScore = data.count > 0 ? data.total / data.count : 0;
    tagScores.push({
      tag,
      score: Math.round(avgScore * 100) / 100,
      scorePercent: Math.round(scoreToPercent(avgScore) * 100) / 100,
      questionCount: data.count,
    });
  }

  // Calculate overall score (average of dimension scores)
  const validDimensionScores = dimensionScores.filter(d => d.questionCount > 0);
  const overallScore = validDimensionScores.length > 0
    ? validDimensionScores.reduce((sum, d) => sum + d.score, 0) / validDimensionScores.length
    : 0;

  const overallScoreRounded = Math.round(overallScore * 100) / 100;
  const overallScorePercent = Math.round(scoreToPercent(overallScore) * 100) / 100;
  const maturityLevel = getMaturityLevel(overallScore);

  return {
    dimensionScores,
    tagScores,
    overallScore: overallScoreRounded,
    overallScorePercent,
    levelNumber: maturityLevel.number,
    levelLabel: maturityLevel.label,
  };
}

// Build the questions payload for the webhook
export function buildQuestionsPayload(
  dimensions: DynamicDimension[],
  answers: DynamicAnswers
) {
  const questions: Array<{
    questionKey: string;
    questionText: string;
    dimensionKey: string;
    dimensionTitle: string;
    tags: string[];
    answerValue: number;
    answerGrade: number;
    answerLabel?: string;
  }> = [];

  for (const dimension of dimensions) {
    const dimensionAnswers = answers[dimension.dimension_key] || [];
    
    dimension.questions.forEach((question, qIndex) => {
      const answerValue = dimensionAnswers[qIndex];
      if (answerValue === undefined || answerValue === 0) return;

      let grade: number;
      let answerLabel: string | undefined;

      if (question.question_type === "selection") {
        // Get option by 1-based index after sorting by display_order
        const sortedOptions = [...question.options].sort((a, b) => a.display_order - b.display_order);
        const selectedOption = sortedOptions[answerValue - 1];
        grade = selectedOption?.grade || 0;
        answerLabel = selectedOption?.label;
      } else {
        // For rating type, answer value IS the grade (1-5)
        grade = answerValue;
      }

      questions.push({
        questionKey: question.question_key,
        questionText: question.text,
        dimensionKey: dimension.dimension_key,
        dimensionTitle: dimension.title,
        tags: question.tags || [],
        answerValue,
        answerGrade: grade,
        answerLabel,
      });
    });
  }

  return questions;
}
