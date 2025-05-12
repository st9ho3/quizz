
export interface CorrectAnswer {
  id: string; // The text of the correct answer
  explanation: string;
}

export interface Table {
  headers: string[];
  rows: string[][];
}

export interface Question {
  id: number; // Unique ID within its question array
  question: string; // The question text
  table?: Table; // Optional table associated with the question
  answers: string[]; // Array of answer strings, e.g., ["Answer A", "Answer B", ...]
  correct_answer: CorrectAnswer;
}

export interface Quiz {
  name: string; // Display name for the quiz
  questions: Question[]; // An array of Question objects for a specific quiz/game
}

// This interface will be for the structure of questionData.ts
export interface AllQuizzes {
  [quizKey: string]: Quiz; // A dictionary where each key is a quiz game name (e.g., "techTrivia")
}

export interface UserAttempt {
  questionId: number;
  questionText: string;
  table?: Table; // Include table data if present for the question
  options: string[]; // All answer choice texts
  selectedAnswerId: string | null; // User's selected answer TEXT
  correctAnswerId: string; // The TEXT of the correct answer
  isCorrect: boolean;
  explanation: string;
}
