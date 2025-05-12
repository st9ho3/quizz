
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserAttempt } from "@/lib/interfaces";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { QuizTable } from "@/components/quiz/QuizTable";
import { CheckCircle2, XCircle, Info, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function DetailedResultsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [attempts, setAttempts] = useState<UserAttempt[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [navParams, setNavParams] = useState<{ correct: string | null, incorrect: string | null, total: string | null }>({
    correct: null,
    incorrect: null,
    total: null,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAttempts = localStorage.getItem('quizUserAttempts');
      if (storedAttempts) {
        try {
          setAttempts(JSON.parse(storedAttempts));
        } catch (error) {
          console.error("Error parsing stored attempts:", error);
          setAttempts(null);
          toast({
            title: "Error",
            description: "Could not load detailed results.",
            variant: "destructive",
          });
        }
      }

      const correct = localStorage.getItem('quizCorrectAnswers');
      const incorrect = localStorage.getItem('quizIncorrectAnswers');
      const total = localStorage.getItem('quizTotalQuestions');
      setNavParams({ correct, incorrect, total });
    }
    setIsLoading(false);
  }, [toast]);

  const handleBackToScore = () => {
    if (navParams.correct !== null && navParams.incorrect !== null && navParams.total !== null) {
      router.push(`/results?correct=${navParams.correct}&incorrect=${navParams.incorrect}&total=${navParams.total}`);
    } else {
      toast({
        title: "Navigation Error",
        description: "Could not retrieve score summary data. Please start a new quiz.",
        variant: "destructive",
      });
      router.push('/'); 
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-secondary p-6">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-xl font-semibold text-foreground">Loading Detailed Results...</p>
        </div>
      </main>
    );
  }

  if (!attempts || attempts.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-secondary p-6">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <Info className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-2xl font-semibold">
              No Results Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center">
              It seems you haven't completed a quiz yet, or the results could not be loaded.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button onClick={() => router.push("/")} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Play Quiz
            </Button>
            {navParams.correct !== null && navParams.incorrect !== null && navParams.total !== null && (
              <Button onClick={handleBackToScore} variant="outline" className="w-full">
                Back to Score
              </Button>
            )}
          </CardFooter>
        </Card>
      </main>
    );
  }

  const canNavigateBackToScore = navParams.correct !== null && navParams.incorrect !== null && navParams.total !== null;

  return (
    <div className="min-h-screen bg-secondary py-8 px-4 md:px-8">
      <header className="max-w-4xl mx-auto mb-8 text-center">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-primary">
              Detailed Quiz Results
            </CardTitle>
            <CardDescription className="text-md text-muted-foreground mt-1">
              Review your answers and learn from the explanations.
            </CardDescription>
          </CardHeader>
        </Card>
      </header>

      <main className="max-w-4xl mx-auto space-y-6">
        {attempts.map((attempt, index) => (
          <Card key={attempt.questionId + '-' + index} className="shadow-lg overflow-hidden">
            <CardHeader className="bg-card-foreground/5 dark:bg-card-foreground/10">
              <CardTitle className="text-xl font-semibold text-primary">
                Question {index + 1}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground pt-1 markdown-content">
                 <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {attempt.questionText}
                </ReactMarkdown>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {attempt.table && <QuizTable tableData={attempt.table} />}
              <div className="space-y-3 mt-4">
                {attempt.options.map((optionText, optionIndex) => {
                  const isSelected = attempt.selectedAnswerId === optionText;
                  const isCorrectOption = attempt.correctAnswerId === optionText;
                  
                  let itemStyle = "border-border hover:bg-accent/10"; // Default style
                  let icon = null;

                  if (isSelected) {
                    // User selected this option
                    if (attempt.isCorrect) {
                      // And it was the correct one
                      itemStyle = "border-primary bg-primary/10 text-primary ring-2 ring-primary"; // Green
                      icon = <CheckCircle2 className="h-5 w-5 text-primary" />;
                    } else {
                      // User selected this option, but it was incorrect
                      itemStyle = "border-destructive bg-destructive/10 text-destructive ring-2 ring-destructive"; // Red
                      icon = <XCircle className="h-5 w-5 text-destructive" />;
                    }
                  } else {
                    // User did NOT select this option
                    if (isCorrectOption) {
                      // But this option IS the correct one
                      // This implies the user's attempt for the question was incorrect.
                      itemStyle = "border-primary bg-primary/10 text-primary ring-2 ring-primary"; // Green for the actual correct answer
                      icon = <CheckCircle2 className="h-5 w-5 text-primary" />;
                    }
                    // If !isSelected && !isCorrectOption, it remains default style with no icon.
                  }

                  return (
                    <div
                      key={`${attempt.questionId}-option-${optionIndex}`}
                      className={`flex items-center space-x-3 rounded-md border p-3 transition-all ${itemStyle}`}
                    >
                      {icon && <div className="flex-shrink-0">{icon}</div>}
                      <div className="flex-grow markdown-content">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {optionText}
                          </ReactMarkdown>
                      </div>
                      {isCorrectOption && !isSelected && (
                         <span className="text-xs font-medium text-primary ml-auto">(Correct Answer)</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 dark:bg-muted/20 p-4">
              <Alert 
                variant={attempt.isCorrect ? "default" : "destructive"} 
                className={attempt.isCorrect ? 'border-primary bg-primary/10' : 'bg-destructive/10'}
              >
                <div className="flex items-center">
                    {attempt.isCorrect ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Info className="h-5 w-5" /> }
                    <AlertTitle className={`ml-2 font-semibold ${attempt.isCorrect ? 'text-primary' : ''}`}>
                    {attempt.isCorrect ? "Your answer was correct!" : "Explanation"}
                    </AlertTitle>
                </div>
                <AlertDescription className="mt-2 text-sm text-muted-foreground markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {attempt.explanation}
                  </ReactMarkdown>
                </AlertDescription>
              </Alert>
            </CardFooter>
          </Card>
        ))}
      </main>

      <footer className="max-w-4xl mx-auto mt-12 text-center">
        <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button onClick={() => router.push("/")} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Play Again
            </Button>
            {canNavigateBackToScore && (
                <Button onClick={handleBackToScore} variant="outline" size="lg">
                Back to Score Summary
                </Button>
            )}
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} ΔΕΟ34. Keep learning!
        </p>
      </footer>
    </div>
  );
}

