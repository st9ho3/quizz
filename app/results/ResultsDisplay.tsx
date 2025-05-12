// app/results/ResultsDisplay.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Award, TrendingUp, HelpCircle, XCircle, Home } from "lucide-react";
import { Progress } from "@/components/ui/progress";
// Removed useState and useEffect for isClient, as Suspense will handle the loading boundary.

export default function ResultsDisplay() { // Renamed component
  const searchParams = useSearchParams();
  const router = useRouter();

  // It's crucial to get params *after* Suspense has ensured client-side rendering
  const correctStr = searchParams.get("correct");
  const incorrectStr = searchParams.get("incorrect");
  const totalStr = searchParams.get("total");

  // Early exit if params are missing - this check is important
  // because useSearchParams can return null initially or if params are truly absent.
  if (correctStr === null || incorrectStr === null || totalStr === null) {
     return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-background to-secondary dark:from-slate-900 dark:to-slate-800">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Could not load quiz results. Parameters are missing. Please try playing again.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/")} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Back to Home
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  const correctNum = parseInt(correctStr || "0");
  const incorrectNum = parseInt(incorrectStr || "0");
  const totalNum = parseInt(totalStr || "0");

  const S_max = 10; // Maximum possible score
  let finalScore = 0;
  let progressValue = 0;

  if (totalNum > 0) {
    const alpha = S_max / totalNum; // Points per correct answer
    const rawScore = alpha * (correctNum - 0.25 * incorrectNum);
    finalScore = Math.max(0, Math.round(rawScore * 10) / 10); // Ensure score is not negative, rounded to one decimal place
    progressValue = Math.max(0, (finalScore / S_max) * 100); // Progress bar value (0-100)
  }

  let feedbackMessage: string;
  let feedbackIcon: JSX.Element;
  let scoreColorClass: string;

  // Logic for feedback based on score
  if (totalNum > 0) {
    if (finalScore < 5) {
      feedbackMessage = "You failed. Better luck next time!";
      feedbackIcon = <XCircle className="h-16 w-16 text-destructive" />;
      scoreColorClass = "text-destructive";
    } else if (finalScore >= 5 && finalScore < 7) {
      feedbackMessage = "You passed! Good effort.";
      feedbackIcon = <TrendingUp className="h-16 w-16 text-yellow-500 dark:text-yellow-400" />;
      scoreColorClass = "text-yellow-500 dark:text-yellow-400";
    } else { // finalScore >= 7
      if (finalScore === S_max) {
        feedbackMessage = "Perfect Score! Absolutely brilliant!";
        feedbackIcon = <Award className="h-16 w-16 text-amber-500" />;
        scoreColorClass = "text-green-500 dark:text-green-400"; // Consistent green for perfect
      } else { // 7 <= finalScore < S_max
        feedbackMessage = "You passed! Excellent work!";
        feedbackIcon = <CheckCircle className="h-16 w-16 text-green-500 dark:text-green-400" />;
        scoreColorClass = "text-green-500 dark:text-green-400";
      }
    }
  } else { // totalNum is 0 or less, but params were present (though parsed to 0 or invalid)
    feedbackMessage = "No questions were attempted, or score could not be calculated.";
    feedbackIcon = <HelpCircle className="h-16 w-16 text-muted-foreground" />;
    scoreColorClass = "text-muted-foreground";
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-background to-secondary dark:from-slate-900 dark:to-slate-800">
      <Card className="w-full max-w-lg shadow-2xl overflow-hidden">
        <CardHeader className="bg-primary/10 dark:bg-primary/20 p-8">
          <div className="mx-auto mb-4">
            {feedbackIcon}
          </div>
          <CardTitle className="text-4xl font-extrabold tracking-tight text-primary">Quiz Results</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">{feedbackMessage}</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="text-5xl font-bold text-foreground">
            Your Score: <span className={scoreColorClass}>{finalScore.toFixed(1)}</span>
          </div>
          {totalNum > 0 && (
            <div className="w-full">
              <Progress value={progressValue} className="h-4 rounded-full [&>div]:bg-accent" />
              <p className="text-right mt-2 text-sm font-medium text-muted-foreground">
                {correctNum} correct, {incorrectNum} incorrect out of {totalNum} questions
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-6 bg-muted/50 dark:bg-muted/20 flex flex-col space-y-3">
          <Button onClick={() => router.push("/")} size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6 rounded-lg shadow-md transition-transform hover:scale-105">
            Play Again
          </Button>
          <Button onClick={() => router.push("/detailed-results")} variant="outline" size="lg" className="w-full text-lg py-6 rounded-lg shadow-md transition-transform hover:scale-105">
            View Detailed Results
          </Button>
          <Button onClick={() => router.push("/")} variant="ghost" size="lg" className="w-full text-lg py-6 rounded-lg shadow-sm transition-transform hover:scale-105 text-primary hover:bg-primary/10">
            <Home className="mr-2 h-5 w-5" />
            Main Menu
          </Button>
        </CardFooter>
      </Card>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} ΔΕΟ34. Hope you had fun!</p>
      </footer>
    </main>
  );
}