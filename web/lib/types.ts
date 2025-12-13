export interface QuizQuestion {
  id: number;
  question: string;
  answers: string[];
  correctAnswer: number;  // 0-indexed
}

export type QuizState = 'IDLE' | 'PLAYING' | 'FINISHED';

export interface QuizData {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  score: number;
  userAnswers: (number | null)[];
}
