import { useState, useEffect } from "react";
import { dimensionsApi } from "@/lib/apiClient";

export interface QuestionOption {
  id: string;
  question_id: string;
  label: string;
  grade: number;
  display_order: number;
}

export interface DynamicQuestion {
  id: string;
  dimension_id: string;
  question_key: string;
  text: string;
  display_order: number;
  is_active: boolean;
  question_type: 'rating' | 'selection';
  tags: string[];
  options: QuestionOption[];
}

export interface DynamicDimension {
  id: string;
  dimension_key: string;
  title: string;
  short_title: string;
  description: string;
  display_order: number;
  questions: DynamicQuestion[];
}

export interface DynamicAnswers {
  [dimensionKey: string]: number[];
}

export function useDynamicAssessment() {
  const [dimensions, setDimensions] = useState<DynamicDimension[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDimensionsWithQuestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dimensionsApi.getAll();
      setDimensions(data as DynamicDimension[]);
    } catch (err) {
      console.error('Error fetching assessment data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assessment');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDimensionsWithQuestions(); }, []);

  const createInitialAnswers = (): DynamicAnswers => {
    const answers: DynamicAnswers = {};
    dimensions.forEach(dim => {
      answers[dim.dimension_key] = dim.questions.map(() => 0);
    });
    return answers;
  };

  return { dimensions, isLoading, error, createInitialAnswers, refetch: fetchDimensionsWithQuestions };
}

// Admin hook — full CRUD
export function useAdminAssessment() {
  const [dimensions, setDimensions] = useState<DynamicDimension[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dimensionsApi.adminGetAll();
      setDimensions(data as DynamicDimension[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const createDimension = async (data: {
    dimension_key: string; title: string; short_title: string;
    description: string; display_order: number;
  }) => {
    const result = await dimensionsApi.create('dimension', data);
    await fetchAll();
    return result;
  };

  const updateDimension = async (id: string, data: Partial<{
    dimension_key: string; title: string; short_title: string;
    description: string; display_order: number;
  }>) => {
    await dimensionsApi.update('dimension', id, data);
    await fetchAll();
  };

  const deleteDimension = async (id: string) => {
    await dimensionsApi.delete('dimension', id);
    await fetchAll();
  };

  const createQuestion = async (data: {
    dimension_id: string; question_key: string; text: string;
    display_order: number; is_active?: boolean;
    question_type?: 'rating' | 'selection'; tags?: string[];
  }) => {
    const result = await dimensionsApi.create('question', {
      ...data,
      is_active:     data.is_active     ?? true,
      question_type: data.question_type ?? 'rating',
      tags:          data.tags          ?? [],
    });
    await fetchAll();
    return result;
  };

  const updateQuestion = async (id: string, data: Partial<{
    question_key: string; text: string; display_order: number;
    is_active: boolean; question_type: 'rating' | 'selection'; tags: string[];
  }>) => {
    await dimensionsApi.update('question', id, data);
    await fetchAll();
  };

  const deleteQuestion = async (id: string) => {
    await dimensionsApi.delete('question', id);
    await fetchAll();
  };

  const createQuestionOption = async (data: {
    question_id: string; label: string; grade: number; display_order: number;
  }) => {
    const result = await dimensionsApi.create('option', data);
    await fetchAll();
    return result;
  };

  const updateQuestionOption = async (id: string, data: Partial<{
    label: string; grade: number; display_order: number;
  }>) => {
    await dimensionsApi.update('option', id, data);
    await fetchAll();
  };

  const deleteQuestionOption = async (id: string) => {
    await dimensionsApi.delete('option', id);
    await fetchAll();
  };

  const saveQuestionWithOptions = async (
    questionId: string | null,
    questionData: {
      dimension_id: string; question_key: string; text: string;
      display_order: number; is_active: boolean;
      question_type: 'rating' | 'selection'; tags: string[];
    },
    options: Array<{ id?: string; label: string; grade: number; display_order: number }>,
    existingOptions: QuestionOption[] = [],
  ) => {
    let qId = questionId;

    if (qId) {
      await dimensionsApi.update('question', qId, questionData);
    } else {
      const res = await dimensionsApi.create('question', questionData);
      qId = res.id;
    }

    if (questionData.question_type === 'selection') {
      // Delete removed options
      const newIds = options.filter(o => o.id).map(o => o.id!);
      for (const opt of existingOptions) {
        if (!newIds.includes(opt.id)) {
          await dimensionsApi.delete('option', opt.id);
        }
      }
      // Update/create options
      for (const opt of options) {
        if (opt.id) {
          await dimensionsApi.update('option', opt.id, { label: opt.label, grade: opt.grade, display_order: opt.display_order });
        } else {
          await dimensionsApi.create('option', { question_id: qId!, label: opt.label, grade: opt.grade, display_order: opt.display_order });
        }
      }
    } else if (existingOptions.length > 0) {
      for (const opt of existingOptions) {
        await dimensionsApi.delete('option', opt.id);
      }
    }

    await fetchAll();
    return qId;
  };

  return {
    dimensions, isLoading, error, refetch: fetchAll,
    createDimension, updateDimension, deleteDimension,
    createQuestion, updateQuestion, deleteQuestion,
    createQuestionOption, updateQuestionOption, deleteQuestionOption,
    saveQuestionWithOptions,
  };
}
