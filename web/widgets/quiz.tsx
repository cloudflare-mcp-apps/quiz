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

  // Background image as base64 data URI (photo_background.webp - 7.9KB)
  // Using <img> instead of CSS background for better MCP Apps CSP compatibility
  const backgroundImageSrc = 'data:image/webp;base64,UklGRrgfAABXRUJQVlA4IKwfAACwpAGdASqwBCADPt1usFO3PT4sIhcI28AbiWlu8B6uTU4bvv1nOGpxG9dCvaz+R30svJbqd0NL/sfoMfID0AvwB/v/9k9AD0gvTQ+VvxC+mXwD/r/8P+RfWN/j/WV/rf8H8u7/r9lf+j9gD+V/wD+z/6v1z/4v2APyJ/Mv6X/s/gI+wD0Jf2v/C+u79Wf0L/gv+b9pH8s/vv9C/YA/kH9y///uO/AD+O/2j/uf+J+AD7O/4T/vf/V9ev+qf6vyBfYD/0P9Y/7X3Sf0V3IfYh+LX3i/3j/0/4d+x/8G/RP8B/fP8A/g39A/1H+d/xP96/wvQA/Jf8L/jv+V9//8Y/mn+2/xX+Vf83r4f/t//P1Xv2L/Nf8t+Rf/tP+l/xfYA/LX95/3P/c/sT0A/uh/pv9S/6n/NdcD9B/9h/1//U+6Dlh/TT+b/8J+8n7f/gf+0/n/rA9s7+if7f/2v70/D79E/5r/qf+k9IrtP/Of///9fVV/Tv///r+mr/Yv+S/8D/yfwF/nX+L/8n+X/A/+g/4//1f//9Cj6Af4t/hP/s/zPmyf6r+w/9z/5/pO/x/+gf4f/+f/9//v63/vv+s///kH/sX+9/6v/+88L/Y/87/zP+////0G/Lf6P/2v+t8g/5K/lv+V//////0AvcH/Ov+8///t/////4vUqPY1/mfcr/G/mH7l/2X8d///v/+mj/pf+h///Cf///zD/Vv93/rv87+Gfyf/HP+X/4v/Lf3r/C///1P/B/2r/a/+H///Z5//v/J///kC/OX89/1f9l/lv+s/8f/5//T/Bf3d/hf+r/+vsp/iP8d/7X/m+Cv7J/nv/T/8r/1fh//Tv/l/l/+s+gB+UP5n/ov/E/1X41/3f/s/+Z/Qve7+8H5C/oH/L/+T/T+/L+8f+c/8X/3fXB/CX9w/8n/r/+18BPzV/ff+u/9n+Ael//If/l/8n////Wq+BHzYfo/A4AAAABFNxWS9cH/G8pSdjDGAF8L6O2lNp5YdP/2IQo7//+lChwfNtBd+F//TjdcqQv0Rkv/6cbrlSF+iMl//Tjdcpzw7vbQXfhf/042dz7lv/8J/+nG65Uhfhr/Tvfo5JLgBAYw9NZRF/Y//8Yjm+9Nqhpx/p3v0ckFYgwfM4N/////gocP/42JNlW2vPTaK/+nG65Uhfoi9//0m7lX//+nG65Uhfoir//pxuuVIX6IyPgAnPF7/7/6AhTdeARfojJf/042dz7lv/8J/+nG65Uhfhr/T9ONBWNV//+nG65Uhfoz//pxuuVIX6bUf/6cbrlSF+iMl//Tjdcqbf3n/YQm8J/+hfojJ//042dz7lv/8J/+nG65UhfhvZVtrz02iv/pxuuVIX6Iv//bXl+8/wM/4//pxuuVIX6IyX/9ON1ypC/VWw//6cbrlSF+m1Lv/ojlSF+iMl//Tjdcqbf3nZ/68//Tc/4//pxuuVIX4a/0/TjQVjVf//pxuuVIX6M//6cbrlSF+mz3/9NqsN2v4L6IyX/9ON1ypu/ef9hCbwn/6D+p+nGzuA==';

  if (state === 'IDLE') {
    return (
      <div className="h-[600px] flex flex-col items-center justify-center bg-white dark:bg-slate-900 overflow-hidden relative">
        {/* Background Photo - using <img> for MCP Apps CSP compatibility */}
        <img
          src={backgroundImageSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-30 dark:opacity-20"
          aria-hidden="true"
        />

        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 to-white/50 dark:from-slate-900/70 dark:to-slate-900/50" />

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
      <div className="h-[600px] flex flex-col items-center justify-center bg-white dark:bg-slate-900 overflow-hidden relative">
        {/* Background Photo - using <img> for MCP Apps CSP compatibility */}
        <img
          src={backgroundImageSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-30 dark:opacity-20"
          aria-hidden="true"
        />

        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/70 to-white/50 dark:from-slate-900/70 dark:to-slate-900/50" />

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
    <div className="h-[600px] flex flex-col bg-white dark:bg-slate-900 overflow-hidden relative">
      {/* Background Photo - using <img> for MCP Apps CSP compatibility */}
      <img
        src={backgroundImageSrc}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-20 dark:opacity-15"
        aria-hidden="true"
      />

      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/80 to-white/60 dark:from-slate-900/80 dark:to-slate-900/60" />

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
