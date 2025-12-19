import { useCallback, useReducer, useState, useId, useRef } from "react";
import { QuizQuestion } from "@/types/quiz.types";
import { QuestionType } from "@shared/enums/question-type";

type Action =
  | { type: "SET_QUESTIONS"; payload: QuizQuestion[] }
  | { type: "ADD_QUESTION"; payload: QuizQuestion }
  | { type: "EDIT_QUESTION_SETTINGS"; index: number; payload: Partial<QuizQuestion> }
  | { type: "UPDATE_QUESTION"; index: number; payload: QuizQuestion }
  | { type: "DELETE_QUESTION"; index: number }
  | { type: "REORDER_QUESTIONS"; from: number; to: number };

function reducer(state: QuizQuestion[], action: Action): QuizQuestion[] {
  switch (action.type) {
    case "SET_QUESTIONS":
      return action.payload;
    case "ADD_QUESTION":
      return [...state, action.payload];
    case "EDIT_QUESTION_SETTINGS": {
      const next = [...state];
      const q = next[action.index];
      next[action.index] = { ...q, ...action.payload };
      return next;
    }
    case "UPDATE_QUESTION": {
      const next = [...state];
      next[action.index] = action.payload;
      return next;
    }
    case "DELETE_QUESTION": {
      return state.filter((_, i) => i !== action.index);
    }
    case "REORDER_QUESTIONS": {
      const next = [...state];
      const [moved] = next.splice(action.from, 1);
      next.splice(action.to, 0, moved);
      return next;
    }
    default:
      return state;
  }
}

export function useQuizEditor(initial?: QuizQuestion[]) {
  const reactId = useId();
  const idCounter = useRef(0);

  // create a question for initial render without mutating refs (stable)
  const createInitialQuestion = useCallback((): QuizQuestion => {
    const idBase = `${reactId}-0`.replace(/[:]/g, "");
    return {
      id: idBase,
      question: "",
      type: QuestionType.SINGLE_CHOICE,
      timeLimit: 30,
      answers: [
        { id: idBase + "-1", text: "", isCorrect: false, color: "red" },
        { id: idBase + "-2", text: "", isCorrect: false, color: "blue" },
        { id: idBase + "-3", text: "", isCorrect: false, color: "yellow" },
        { id: idBase + "-4", text: "", isCorrect: false, color: "green" },
      ],
    } as QuizQuestion;
  }, [reactId]);

  // create a question at runtime; this may mutate the ref (allowed outside render)
  const createRuntimeQuestion = useCallback((): QuizQuestion => {
    const idBase = `${reactId}-${idCounter.current++}`.replace(/[:]/g, "");
    return {
      id: idBase,
      question: "",
      type: QuestionType.SINGLE_CHOICE,
      timeLimit: 30,
      answers: [
        { id: idBase + "-1", text: "", isCorrect: false, color: "red" },
        { id: idBase + "-2", text: "", isCorrect: false, color: "blue" },
        { id: idBase + "-3", text: "", isCorrect: false, color: "yellow" },
        { id: idBase + "-4", text: "", isCorrect: false, color: "green" },
      ],
    } as QuizQuestion;
  }, [reactId]);

  const initializer = (init?: QuizQuestion[]) => init ?? [createInitialQuestion()];
  const [questions, dispatch] = useReducer(reducer, initial, initializer);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  const setQuestions = useCallback((q: QuizQuestion[]) => dispatch({ type: "SET_QUESTIONS", payload: q }), []);

  const handleAddQuestion = useCallback(() => {
    setEditingQuestionIndex(null);
    setIsModalOpen(true);
  }, []);

  const handleEditQuestionSettings = useCallback((index: number) => {
    setEditingQuestionIndex(index);
    setIsModalOpen(true);
  }, []);

  const handleConfirmQuestionSettings = useCallback((type: QuestionType, timeLimit: number) => {
    if (editingQuestionIndex !== null) {
      dispatch({ type: "EDIT_QUESTION_SETTINGS", index: editingQuestionIndex, payload: { type, timeLimit } });
    } else {
      const newQuestion = createRuntimeQuestion();
      newQuestion.type = type;
      newQuestion.timeLimit = timeLimit;
      dispatch({ type: "ADD_QUESTION", payload: newQuestion });
      setCurrentQuestionIndex((prev) => Math.max(prev, questions.length));
      setShouldScrollToBottom(true);
    }
    setIsModalOpen(false);
    setEditingQuestionIndex(null);
  }, [editingQuestionIndex, questions.length, createRuntimeQuestion]);

  const handleDeleteQuestion = useCallback((index: number) => {
    if (questions.length === 1) return;
    setQuestionToDelete(index);
    setIsDeleteModalOpen(true);
  }, [questions.length]);

  const confirmDeleteQuestion = useCallback(() => {
    if (questionToDelete === null) return;
    dispatch({ type: "DELETE_QUESTION", index: questionToDelete });
    setIsDeleteModalOpen(false);
    setQuestionToDelete(null);
    setCurrentQuestionIndex((prev) => Math.max(0, Math.min(prev, questions.length - 2)));
  }, [questionToDelete, questions.length]);

  const handleExit = useCallback(() => setIsExitModalOpen(true), []);
  const confirmExit = useCallback(() => setIsExitModalOpen(false), []);

  const handleUpdateQuestion = useCallback((index: number, updatedQuestion: QuizQuestion) => {
    dispatch({ type: "UPDATE_QUESTION", index, payload: updatedQuestion });
  }, []);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    dispatch({ type: "REORDER_QUESTIONS", from: draggedIndex, to: index });

    if (currentQuestionIndex === draggedIndex) {
      setCurrentQuestionIndex(index);
    } else if (draggedIndex < currentQuestionIndex && index >= currentQuestionIndex) {
      setCurrentQuestionIndex((prev) => prev - 1);
    } else if (draggedIndex > currentQuestionIndex && index <= currentQuestionIndex) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }

    setDraggedIndex(index);
  }, [draggedIndex, currentQuestionIndex]);

  const handleDragEnd = useCallback(() => setDraggedIndex(null), []);

  return {
    questions,
    setQuestions,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    isModalOpen,
    setIsModalOpen,
    editingQuestionIndex,
    setEditingQuestionIndex,
    draggedIndex,
    shouldScrollToBottom,
    setShouldScrollToBottom,
    isDeleteModalOpen,
    isExitModalOpen,
    setIsDeleteModalOpen,
    setIsExitModalOpen,
    questionToDelete,
    handleAddQuestion,
    handleEditQuestionSettings,
    handleConfirmQuestionSettings,
    handleDeleteQuestion,
    confirmDeleteQuestion,
    handleExit,
    confirmExit,
    handleUpdateQuestion,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } as const;
}
