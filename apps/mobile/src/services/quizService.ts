import quizQuestionsData from '../../assets/quizQuestions.json';
import majorsData from '../../assets/majors.json';

// Types
export type CareerQuestion = {
  id: number;
  question: string;
  choices: { text: string; weight: { [key: string]: number } }[];
};

export type Major = {
  name: string;
  description: string;
  detailedInfo?: {
    skills: string[];
    careerPaths: string[];
    averageSalary?: string;
    jobMarket?: string;
  };
};

// Transform JSON data
const transformMajorsData = (): { [key: string]: Major } => {
  const transformed: { [key: string]: Major } = {};
  
  majorsData.majors.forEach((major) => {
    transformed[major.id] = {
      name: major.name,
      description: major.description,
      detailedInfo: {
        skills: major.skills,
        careerPaths: major.careerPaths,
        averageSalary: major.salary,
        jobMarket: major.jobMarket
      }
    };
  });
  
  return transformed;
};

// Data
const CAREER_QUESTIONS: CareerQuestion[] = quizQuestionsData.questions as unknown as CareerQuestion[];
const MAJORS: { [key: string]: Major } = transformMajorsData();

export type QuizResult = {
  major: string;
  score: number;
  description: string;
  percentage: number;
  detailedInfo?: Major['detailedInfo'];
};

export class QuizService {
  static getQuestions(): CareerQuestion[] {
    return CAREER_QUESTIONS;
  }

  static getMajors(): { [key: string]: Major } {
    return MAJORS;
  }

  static calculateResults(userAnswers: number[]): QuizResult[] {
    // Validation đầu vào
    if (userAnswers.length !== CAREER_QUESTIONS.length) {
      throw new Error('Invalid number of answers');
    }

    // Tính điểm cho từng ngành
    const scores: { [key: string]: number } = {};
    Object.keys(MAJORS).forEach(major => scores[major] = 0);

    let maxPossibleScore = 0;

    userAnswers.forEach((answerIndex, questionIndex) => {
      const question = CAREER_QUESTIONS[questionIndex];
      if (question && question.choices[answerIndex]) {
        const choice = question.choices[answerIndex];
        
        // Tìm điểm cao nhất có thể trong câu hỏi này
        const maxQuestionScore = Math.max(...question.choices.flatMap(c => Object.values(c.weight)));
        maxPossibleScore += maxQuestionScore;
        
        Object.entries(choice.weight).forEach(([major, weight]) => {
          if (scores[major] !== undefined) {
            scores[major] += weight;
          }
        });
      }
    });

    // Sắp xếp kết quả theo điểm cao nhất
    const sortedResults = Object.entries(scores)
      .map(([majorKey, score]) => {
        const major = MAJORS[majorKey];
        return {
          major: major?.name || 'Unknown',
          score,
          description: major?.description || 'No description',
          percentage: Math.round((score / maxPossibleScore) * 100),
          detailedInfo: major?.detailedInfo
        };
      })
      .sort((a, b) => b.score - a.score)
      .filter(result => result.score > 0); // Chỉ hiển thị các ngành có điểm > 0

    return sortedResults;
  }

  static getQuestionById(id: number): CareerQuestion | undefined {
    return CAREER_QUESTIONS.find(q => q.id === id);
  }

  static getTotalQuestions(): number {
    return CAREER_QUESTIONS.length;
  }

  static validateAnswer(questionIndex: number, answerIndex: number): boolean {
    const question = CAREER_QUESTIONS[questionIndex];
    return question && answerIndex >= 0 && answerIndex < question.choices.length;
  }
}