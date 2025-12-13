import type { QuizQuestion } from './types';

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "What is the capital of France?",
    answers: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2
  },
  {
    id: 2,
    question: "What is the largest planet in our solar system?",
    answers: ["Earth", "Jupiter", "Saturn", "Neptune"],
    correctAnswer: 1
  },
  {
    id: 3,
    question: "Who painted the Mona Lisa?",
    answers: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
    correctAnswer: 2
  },
  {
    id: 4,
    question: "What is the chemical symbol for gold?",
    answers: ["Go", "Gd", "Au", "Ag"],
    correctAnswer: 2
  },
  {
    id: 5,
    question: "In what year did World War II end?",
    answers: ["1943", "1944", "1945", "1946"],
    correctAnswer: 2
  },
  {
    id: 6,
    question: "What is the smallest country in the world?",
    answers: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"],
    correctAnswer: 1
  },
  {
    id: 7,
    question: "How many continents are there?",
    answers: ["5", "6", "7", "8"],
    correctAnswer: 2
  },
  {
    id: 8,
    question: "What is the speed of light in vacuum?",
    answers: ["300,000 km/s", "150,000 km/s", "450,000 km/s", "600,000 km/s"],
    correctAnswer: 0
  }
];
