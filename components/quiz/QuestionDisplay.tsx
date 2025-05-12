
"use client";

import type { Question } from "@/lib/interfaces";
import { useState, type FC } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizTable } from "./QuizTable";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css'; 

interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onQuestionSubmit: (isCorrect: boolean, selectedAnswerId: string | null) => void;
}

// Helper function to normalize strings for comparison
const normalizeAnswerText = (text: string | null): string | null => {
  if (text === null) return null;
  // Trim whitespace from both ends, then replace any sequence of internal whitespace characters 
  // (including non-breaking spaces, tabs, etc.) with a single standard space.
  return text.trim().replace(/\s+/g, ' ');
};


export const QuestionDisplay: FC<QuestionDisplayProps> = ({
  question,
  questionNumber,
  totalQuestions,
  onQuestionSubmit,
}) => {
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null); 

  const handleNextOrSubmit = () => {
    if (!selectedAnswerId) return;

    if (!question || !question.correct_answer || typeof question.correct_answer.id !== 'string') {
      console.error("Cannot determine correctness: question or correct_answer is invalid.", question);
      onQuestionSubmit(false, selectedAnswerId); 
      setSelectedAnswerId(null);
      return;
    }
    
    const normalizedCorrectAnswer = normalizeAnswerText(question.correct_answer.id);
    const normalizedSelectedAnswer = normalizeAnswerText(selectedAnswerId);
    
    const isCorrect = normalizedCorrectAnswer === normalizedSelectedAnswer;
    
    onQuestionSubmit(isCorrect, selectedAnswerId); // Pass the original selectedAnswerId (unnormalized) for storage
    setSelectedAnswerId(null); 
  };

  if (
    !question || 
    !question.question || 
    !Array.isArray(question.answers) || 
    question.answers.length === 0 || 
    !question.correct_answer || typeof question.correct_answer.id !== 'string'
  ) {
    console.error("Invalid question data in QuestionDisplay:", question);
    return (
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Question</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">There was an issue with loading this question's data. The data might be incomplete or malformed.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl shadow-xl rounded-lg">
      <CardHeader className="bg-card-foreground/5 dark:bg-card-foreground/10 p-6 rounded-t-lg">
        <CardTitle className="text-2xl font-semibold text-primary">
          Question {questionNumber} of {totalQuestions}
        </CardTitle>
        <CardDescription className="text-lg pt-2 markdown-content text-foreground/90">
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {question.question}
          </ReactMarkdown>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {question.table && <QuizTable tableData={question.table} />}
        <RadioGroup
          value={selectedAnswerId ?? undefined} 
          onValueChange={setSelectedAnswerId} 
          className="space-y-4 mt-4"
        >
          {question.answers.map((answerText, index) => {
            const uniqueKey = `${question.id}-option-${index}`; 
            
            return (
              <Label
                key={uniqueKey} 
                htmlFor={uniqueKey}
                className={`flex items-start space-x-3 rounded-md border p-4 cursor-pointer transition-all 
                            hover:bg-accent/20 hover:border-primary
                            focus-within:ring-2 focus-within:ring-primary focus-within:border-primary
                            ${selectedAnswerId === answerText ? 'bg-primary/10 border-primary ring-2 ring-primary' : 'border-border'}`}
              >
                <RadioGroupItem 
                  value={answerText} 
                  id={uniqueKey} 
                  className="mt-1 flex-shrink-0"
                />
                <span className="markdown-content flex-grow text-foreground/90">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {answerText}
                  </ReactMarkdown>
                </span>
              </Label>
            );
          })}
        </RadioGroup>
      </CardContent>
      <CardFooter className="flex justify-end p-6 bg-muted/30 dark:bg-muted/20 rounded-b-lg">
        <Button 
          onClick={handleNextOrSubmit} 
          disabled={!selectedAnswerId} 
          size="lg"
          className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-md transition-transform hover:scale-105"
        >
          {questionNumber === totalQuestions ? "Show Results" : "Next Question"}
        </Button>
      </CardFooter>
    </Card>
  );
};

