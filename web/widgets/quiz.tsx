import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { QuizState, QuizData } from '../lib/types';
import { QUIZ_QUESTIONS } from '../lib/quizData';
import '../styles/globals.css';

function QuizWidget() {
  const [state, setState] = useState<QuizState>('IDLE');
  const [quizData, setQuizData] = useState<QuizData>({
    questions: QUIZ_QUESTIONS,
    currentQuestionIndex: 0,
    score: 0,
    userAnswers: Array(QUIZ_QUESTIONS.length).fill(null)
  });
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const { app } = useApp({
    appInfo: {
      name: "quiz-mcp",
      version: "1.0.0",
    },
    capabilities: {},
    onAppCreated: (appInstance) => {
      // Handle tool result (widget loads - show welcome screen first)
      appInstance.ontoolresult = () => {
        console.log('[Quiz] Tool result received - showing welcome screen');
        // Stay in IDLE state to show welcome screen
      };

      // Handle theme changes
      appInstance.onhostcontextchanged = (context) => {
        if (context.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      };

      // Handle teardown
      appInstance.onteardown = async (params) => {
        console.log('[Quiz] Teardown:', params.reason);
      };
    },
  });

  const currentQuestion = quizData.questions[quizData.currentQuestionIndex];
  const isLastQuestion = quizData.currentQuestionIndex === quizData.questions.length - 1;

  const handleAnswerClick = (answerIndex: number) => {
    if (showFeedback) return;

    setSelectedAnswer(answerIndex);
    setShowFeedback(true);

    const isCorrect = answerIndex === currentQuestion.correctAnswer;

    const newAnswers = [...quizData.userAnswers];
    newAnswers[quizData.currentQuestionIndex] = answerIndex;
    setQuizData(prev => ({
      ...prev,
      score: isCorrect ? prev.score + 1 : prev.score,
      userAnswers: newAnswers
    }));

    setTimeout(() => {
      setShowFeedback(false);
      setSelectedAnswer(null);

      if (isLastQuestion) {
        setState('FINISHED');
        const finalScore = isCorrect ? quizData.score + 1 : quizData.score;

        app?.sendMessage({
          role: 'user',
          content: [{
            type: 'text',
            text: `Quiz completed! Final score: ${finalScore}/${quizData.questions.length}`
          }]
        });
      } else {
        setQuizData(prev => ({
          ...prev,
          currentQuestionIndex: prev.currentQuestionIndex + 1
        }));
      }
    }, 800);
  };

  const handleRestart = () => {
    setState('IDLE');
    setQuizData({
      questions: QUIZ_QUESTIONS,
      currentQuestionIndex: 0,
      score: 0,
      userAnswers: Array(QUIZ_QUESTIONS.length).fill(null)
    });
  };

  // TODO: Background image disabled temporarily due to MCPJam CSP restrictions
  // data: URIs may not be supported in resourceDomains array
  // const backgroundImageSrc = 'data:image/webp;base64,...';

  if (state === 'IDLE') {
    return (
      <div className="h-[600px] flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 overflow-hidden relative">
        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 opacity-10 dark:opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, currentColor 2%, transparent 0%),
                             radial-gradient(circle at 75px 75px, currentColor 2%, transparent 0%)`,
            backgroundSize: '100px 100px'
          }}
        />

        {/* Content (z-index to appear above background) */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-6 text-6xl">📝</div>
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            General Knowledge Quiz
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            8 questions to test your knowledge
          </p>
          <button
            onClick={() => setState('PLAYING')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  if (state === 'FINISHED') {
    return (
      <div className="h-[600px] flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-slate-900 dark:to-slate-800 overflow-hidden relative">
        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 opacity-10 dark:opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, currentColor 2%, transparent 0%),
                             radial-gradient(circle at 75px 75px, currentColor 2%, transparent 0%)`,
            backgroundSize: '100px 100px'
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            Quiz Complete!
          </h1>
          <div className="text-6xl font-bold mb-8 text-blue-600 dark:text-blue-400">
            {quizData.score}/{quizData.questions.length}
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            {quizData.score === quizData.questions.length
              ? "Perfect score! 🎉"
              : quizData.score >= 6
              ? "Great job! 👏"
              : quizData.score >= 4
              ? "Good effort! 👍"
              : "Keep practicing! 💪"}
          </p>
          <button
            onClick={handleRestart}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[600px] flex flex-col bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 overflow-hidden relative">
      {/* Decorative pattern overlay */}
      <div className="absolute inset-0 opacity-5 dark:opacity-3"
        style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, currentColor 2%, transparent 0%),
                           radial-gradient(circle at 75px 75px, currentColor 2%, transparent 0%)`,
          backgroundSize: '100px 100px'
        }}
      />

      <div className="relative z-10 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Question {quizData.currentQuestionIndex + 1} of {quizData.questions.length}
        </div>
        <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Score: {quizData.score}
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-semibold mb-8 text-center text-gray-900 dark:text-white">
          {currentQuestion.question}
        </h2>

        <div className="w-full max-w-md space-y-3">
          {currentQuestion.answers.map((answer, index) => {
            const isCorrect = index === currentQuestion.correctAnswer;
            const isSelected = index === selectedAnswer;

            let buttonClass = "w-full p-4 text-left rounded-lg border-2 transition-colors ";

            if (showFeedback) {
              if (isSelected && isCorrect) {
                buttonClass += "bg-green-100 dark:bg-green-900 border-green-500 text-green-900 dark:text-green-100";
              } else if (isSelected && !isCorrect) {
                buttonClass += "bg-red-100 dark:bg-red-900 border-red-500 text-red-900 dark:text-red-100";
              } else if (isCorrect) {
                buttonClass += "bg-green-100 dark:bg-green-900 border-green-500 text-green-900 dark:text-green-100";
              } else {
                buttonClass += "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white opacity-50";
              }
            } else {
              buttonClass += "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 text-gray-900 dark:text-white";
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerClick(index)}
                disabled={showFeedback}
                className={buttonClass}
              >
                {answer}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 h-2 bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{
            width: `${((quizData.currentQuestionIndex + 1) / quizData.questions.length) * 100}%`
          }}
        />
      </div>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <QuizWidget />
    </StrictMode>
  );
}
