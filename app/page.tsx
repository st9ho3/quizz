
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { quizData } from "@/lib/questionData";
import type { Question, UserAttempt } from "@/lib/interfaces";
import { QuestionDisplay } from "@/components/quiz/QuestionDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const INITIAL_QUIZ_DURATION_SECONDS = 2 * 60 * 60; // 2 hours in seconds

const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const paddedHours = String(hours).padStart(2, '0');
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');
  return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
};

export default function QuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [incorrectAnswersCount, setIncorrectAnswersCount] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [userAttempts, setUserAttempts] = useState<UserAttempt[]>([]);
  const [selectedQuizKey, setSelectedQuizKey] = useState<string | null>(null);
  const availableQuizKeys = Object.keys(quizData);
  
  const [isClient, setIsClient] = useState(false);
  const [timeLeft, setTimeLeft] = useState(INITIAL_QUIZ_DURATION_SECONDS);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [quizTimedOut, setQuizTimedOut] = useState<boolean>(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedQuizState = localStorage.getItem('quizState');
    if (savedQuizState) {
      try {
        const parsedState = JSON.parse(savedQuizState);
        if (parsedState.quizStarted && !parsedState.quizFinished && !parsedState.quizTimedOut && parsedState.timeLeft > 0) {
          setQuestions(parsedState.questions || []);
          setCurrentQuestionIndex(parsedState.currentQuestionIndex || 0);
          setCorrectAnswersCount(parsedState.correctAnswersCount || 0);
          setIncorrectAnswersCount(parsedState.incorrectAnswersCount || 0);
          setUserAttempts(parsedState.userAttempts || []);
          setSelectedQuizKey(parsedState.selectedQuizKey || null);
          setTimeLeft(parsedState.timeLeft);
          setQuizStarted(true);
          setQuizFinished(false);
          setQuizTimedOut(false);
          setTimerActive(true); 
        } else {
          localStorage.removeItem('quizState');
        }
      } catch (error) {
        console.error("Failed to parse saved quiz state:", error);
        localStorage.removeItem('quizState');
      }
    }
  }, []);


  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined;
    if (quizStarted && !quizFinished && !quizTimedOut && timerActive && timeLeft > 0) {
      timerId = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) { 
            clearInterval(timerId!); 
            setTimerActive(false);   
            setQuizTimedOut(true);   
            return 0;                
          }
          return prevTime - 1;       
        });
      }, 1000);
    } else if (timeLeft === 0 && quizStarted && !quizFinished && !quizTimedOut) {
      if(timerActive){ 
        setTimerActive(false);
      }
      setQuizTimedOut(true);
    } else if ((!quizStarted || quizFinished || quizTimedOut) && timerActive) {
      setTimerActive(false);
    }
    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [timerActive, timeLeft, quizStarted, quizFinished, quizTimedOut, setTimeLeft, setTimerActive, setQuizTimedOut]);


  useEffect(() => {
    if (quizFinished || quizTimedOut) {
      setTimerActive(false); 

      if (isClient) {
        localStorage.setItem('quizUserAttempts', JSON.stringify(userAttempts));
        localStorage.setItem('quizTotalQuestions', questions.length.toString());
        localStorage.setItem('quizCorrectAnswers', correctAnswersCount.toString());
        localStorage.setItem('quizIncorrectAnswers', incorrectAnswersCount.toString());
        localStorage.removeItem('quizState'); 
      }
      
      router.push(`/results?correct=${correctAnswersCount}&incorrect=${incorrectAnswersCount}&total=${questions.length}${quizTimedOut ? '&timedOut=true' : ''}`);
    }
  }, [quizFinished, quizTimedOut, userAttempts, questions.length, correctAnswersCount, incorrectAnswersCount, router, isClient]);

  useEffect(() => {
    if (isClient && quizStarted && !quizFinished && !quizTimedOut) {
      const quizStateToSave = {
        questions,
        currentQuestionIndex,
        correctAnswersCount,
        incorrectAnswersCount,
        userAttempts,
        selectedQuizKey,
        timeLeft,
        quizStarted,
        quizFinished,
        quizTimedOut,
      };
      localStorage.setItem('quizState', JSON.stringify(quizStateToSave));
    } else if (isClient && (quizFinished || quizTimedOut)) {
      localStorage.removeItem('quizState');
    }
  }, [
    questions, currentQuestionIndex, correctAnswersCount, incorrectAnswersCount, userAttempts, 
    selectedQuizKey, timeLeft, quizStarted, quizFinished, quizTimedOut, isClient
  ]);
  
  const handleSelectQuiz = (value: string) => {
    setSelectedQuizKey(value);
  };

  const handleStartQuiz = useCallback(() => {
    if (!selectedQuizKey) return;
    const quiz = quizData[selectedQuizKey];
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
        console.error("Selected quiz is invalid or has no questions:", selectedQuizKey);
        return;
    }

    setQuestions(quiz.questions);
    setCurrentQuestionIndex(0);
    setCorrectAnswersCount(0);
    setIncorrectAnswersCount(0);
    setUserAttempts([]);
    setTimeLeft(INITIAL_QUIZ_DURATION_SECONDS); 
    setQuizStarted(true);
    setQuizFinished(false);
    setQuizTimedOut(false); 
    setTimerActive(true); 
  }, [selectedQuizKey]);

  const handleSubmitAnswer = useCallback(
    (isCorrect: boolean, selectedAnswerText: string | null) => {
      const currentQ = questions[currentQuestionIndex];
      if (!currentQ) return;

      const attempt: UserAttempt = {
        questionId: currentQ.id,
        questionText: currentQ.question,
        table: currentQ.table,
        options: currentQ.answers,
        selectedAnswerId: selectedAnswerText,
        correctAnswerId: currentQ.correct_answer.id,
        isCorrect: isCorrect,
        explanation: currentQ.correct_answer.explanation,
      };
      setUserAttempts((prev) => [...prev, attempt]);

      if (isCorrect) {
        setCorrectAnswersCount((prev) => prev + 1);
      } else {
        setIncorrectAnswersCount((prev) => prev + 1);
      }

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        setQuizFinished(true);
        setTimerActive(false); 
      }
    },
    [currentQuestionIndex, questions]
  );

  const handleOpenCancelDialog = () => {
    if (timerActive) {
      setTimerActive(false); // Pause timer
    }
    setShowCancelDialog(true);
  };

  const handleCloseCancelDialogAndResume = () => {
    setShowCancelDialog(false);
    // Resume timer only if quiz is in a resumable state
    if (quizStarted && !quizFinished && !quizTimedOut && timeLeft > 0) {
      setTimerActive(true);
    }
  };

  const confirmCancelAndExit = () => {
    setQuizStarted(false);
    setQuizFinished(false);
    setQuizTimedOut(false);
    setTimerActive(false);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setCorrectAnswersCount(0);
    setIncorrectAnswersCount(0);
    setUserAttempts([]);
    setSelectedQuizKey(null);
    setTimeLeft(INITIAL_QUIZ_DURATION_SECONDS); // Reset timer for potential new game

    if (isClient) {
      localStorage.removeItem('quizState');
      localStorage.removeItem('quizUserAttempts');
      localStorage.removeItem('quizTotalQuestions');
      localStorage.removeItem('quizCorrectAnswers');
      localStorage.removeItem('quizIncorrectAnswers');
    }
    
    setShowCancelDialog(false);
    router.push("/"); 
  };


  if (!isClient) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-secondary p-6">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-xl font-semibold text-foreground">Loading Quiz...</p>
        </div>
      </main>
    );
  }

  if (!quizStarted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-background to-secondary dark:from-slate-900 dark:to-slate-800">
        <Card className="w-full max-w-md shadow-2xl rounded-xl">
          <CardHeader className="text-center p-8">
            <div className="mx-auto mb-6">
              <svg data-ai-hint="quiz brain" xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg>
            </div>
            <CardTitle className="text-4xl font-extrabold tracking-tight text-primary">
              ΔΕΟ34
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground mt-2">
              Select a quiz and test your knowledge. Ready to start?
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="quiz-select" className="text-md font-medium text-foreground">
                Choose a Quiz:
              </Label>
              <Select onValueChange={handleSelectQuiz} value={selectedQuizKey || undefined}>
                <SelectTrigger id="quiz-select" className="w-full text-lg py-6 rounded-lg shadow-sm focus:ring-primary focus:border-primary">
                  <SelectValue placeholder="Select a quiz topic" />
                </SelectTrigger>
                <SelectContent className="rounded-lg shadow-lg">
                  {availableQuizKeys.map(key => (
                    <SelectItem key={key} value={key} className="text-lg py-3 hover:bg-accent/10 cursor-pointer">
                      {quizData[key]?.name || key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleStartQuiz} 
              disabled={!selectedQuizKey} 
              size="lg" 
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-xl py-7 rounded-lg shadow-md transition-transform hover:scale-105"
            >
              Ξεκινηστε
            </Button>
          </CardContent>
        </Card>
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} ΔΕΟ34. Designed by an expert designer.
        </footer>
      </main>
    );
  }
  
  if (questions.length === 0 && quizStarted && !quizFinished && !quizTimedOut) { 
     return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-secondary">
        <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-xl font-semibold text-foreground">Loading Questions...</p>
        </div>
      </main>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  const isValidQuestionObject = currentQuestion &&
                                typeof currentQuestion.id === 'number' &&
                                typeof currentQuestion.question === 'string' &&
                                Array.isArray(currentQuestion.answers) &&
                                currentQuestion.answers.length > 0 &&
                                currentQuestion.correct_answer && typeof currentQuestion.correct_answer.id === 'string';

  const showQuizContent = quizStarted && !quizFinished && !quizTimedOut && isValidQuestionObject;

  return (
    <main className="flex flex-col min-h-screen items-center justify-between p-6 md:p-12 lg:p-24 bg-secondary">
      <header className="w-full max-w-3xl mb-8 p-4 bg-card rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">ΔΕΟ34</h1>
          <p className="text-muted-foreground">
            {selectedQuizKey && quizData[selectedQuizKey] ? quizData[selectedQuizKey].name : "Challenge your mind!"}
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            {quizStarted && !quizFinished && !quizTimedOut && (
            <div className="px-4 py-2 bg-primary/10 text-primary rounded-md font-semibold text-lg shadow">
                Time Remaining: {formatTime(timeLeft)}
            </div>
            )}
            {quizTimedOut && (
            <div className="px-4 py-2 bg-destructive/10 text-destructive rounded-md font-semibold text-lg shadow flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" />
                Time's up! Calculating results...
            </div>
            )}

            {quizStarted && !quizFinished && !quizTimedOut && (
            <Button variant="outline" onClick={handleOpenCancelDialog} className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive">
                Cancel Quiz
            </Button>
            )}
        </div>
      </header>
      
      <section className="flex-grow w-full flex items-center justify-center">
        {showQuizContent ? (
          <QuestionDisplay
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            onQuestionSubmit={handleSubmitAnswer}
          />
        ) : (
          <Card className="w-full max-w-2xl shadow-xl p-8 text-center">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">
                { (quizFinished || quizTimedOut) ? 
                    <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" /> : 
                    <Loader2 className="mx-auto h-16 w-16 animate-spin text-primary mb-4" /> 
                }
                { quizFinished && !quizTimedOut ? "Quiz completed!" : "" }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground">
                { !(quizFinished || quizTimedOut) ? "Loading question or quiz setup..." : "Calculating results..."}
              </p>
            </CardContent>
          </Card>
        )}
      </section>
  
      <footer className="w-full text-center mt-12 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} ΔΕΟ34. Good luck!
      </footer>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will cancel your current quiz and all progress will be lost. You will be returned to the main menu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseCancelDialogAndResume}>Resume Quiz</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelAndExit}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Yes, Cancel Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

