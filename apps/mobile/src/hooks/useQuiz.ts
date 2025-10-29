import { useState } from 'react';
import { QuizService, QuizResult } from '../services/quizService';
import { QUIZ_CONFIG } from '../constants/quiz';

export const useQuiz = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lấy dữ liệu từ service
  const questions = QuizService.getQuestions();
  const totalQuestions = QuizService.getTotalQuestions();
  const currentQuestion = quizStarted && !quizCompleted ? questions[currentQuestionIndex] : null;

  const startQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setQuizCompleted(false);
    setResults([]);
    setError(null);
  };

  const selectAnswer = (choiceIndex: number) => {
    // Validation sử dụng service
    if (!quizStarted || quizCompleted || currentQuestionIndex >= totalQuestions) {
      return;
    }

    // Validation câu trả lời
    if (!QuizService.validateAnswer(currentQuestionIndex, choiceIndex)) {
      setError('Câu trả lời không hợp lệ');
      return;
    }

    const newAnswers = [...answers, choiceIndex];
    setAnswers(newAnswers);

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Set loading ngay lập tức khi chọn câu cuối
      setLoading(true);
      // Tính toán kết quả sử dụng service
      calculateResults(newAnswers);
    }
  };

  const calculateResults = (userAnswers: number[]) => {
    // Loading đã được set trong selectAnswer
    setError(null);
    
    try {
      const sortedResults = QuizService.calculateResults(userAnswers);
      
      // Hiển thị kết quả ngay lập tức
      setResults(sortedResults);
      setQuizCompleted(true);
      setLoading(false);
    } catch (error) {
      console.error('Error calculating results:', error);
      setError('Không thể tính toán kết quả');
      setLoading(false);
    }
  };

  const restartQuiz = () => {
    setQuizStarted(false);
    setQuizCompleted(false);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setResults([]);
    setError(null);
  };

  const stopQuiz = () => {
    setQuizStarted(false);
    setQuizCompleted(false);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setResults([]);
    setError(null);
    setLoading(false);
  };

  return {
    // State
    currentQuestionIndex,
    answers,
    quizStarted,
    quizCompleted,
    results,
    loading,
    error,
    
    // Computed values
    questions,
    totalQuestions,
    currentQuestion,
    
    // Actions
    startQuiz,
    selectAnswer,
    restartQuiz,
    stopQuiz
  };
};