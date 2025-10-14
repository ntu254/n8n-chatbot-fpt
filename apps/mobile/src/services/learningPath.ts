import { postJson } from "../lib/api";

export type Course = {
  code: string;
  title: string;
  credits: number;
  prerequisites?: string[];
};

export type Curriculum = {
  program: string;
  courses: Course[];
};

export type SemesterPlan = {
  term: string; // e.g., "Semester 1"
  courses: Course[];
};

export function loadCurriculum(): Curriculum {
  // Import the static JSON included in assets
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const data = require("../../assets/curriculum.json");
  return data as Curriculum;
}

export async function fetchServerPlan(maxCreditsPerTerm: number): Promise<SemesterPlan[] | null> {
  try {
    const res = await postJson("/api/learning-path", { studentId: "me", constraints: { maxCreditsPerTerm } });
    const semesters = (res?.semesters as SemesterPlan[]) || null;
    if (Array.isArray(semesters)) return semesters;
  } catch {
    // ignore
  }
  return null;
}

export function generatePlan(curriculum: Curriculum, opts?: { maxCreditsPerTerm?: number }): SemesterPlan[] {
  const maxCreditsPerTerm = opts?.maxCreditsPerTerm ?? 18;
  const codeToCourse = new Map(curriculum.courses.map(c => [c.code, c]));
  const indegree = new Map<string, number>();
  const edges = new Map<string, Set<string>>();

  for (const c of curriculum.courses) {
    indegree.set(c.code, c.prerequisites?.length || 0);
    if (c.prerequisites) {
      for (const pre of c.prerequisites) {
        const set = edges.get(pre) || new Set<string>();
        set.add(c.code);
        edges.set(pre, set);
      }
    }
  }

  const planned = new Set<string>();
  const semesters: SemesterPlan[] = [];
  let termIndex = 1;

  while (planned.size < curriculum.courses.length) {
    let credits = 0;
    const thisTerm: Course[] = [];

    // pick all available with indegree 0 and not planned yet
    const available = Array.from(indegree.entries())
      .filter(([code, deg]) => deg === 0 && !planned.has(code))
      .map(([code]) => code);

    // Greedy fill until reach credit cap
    for (const code of available) {
      const course = codeToCourse.get(code)!;
      if (credits + course.credits <= maxCreditsPerTerm) {
        thisTerm.push(course);
        credits += course.credits;
      }
    }

    if (thisTerm.length === 0) {
      // deadlock or all remaining courses exceed cap; force add one smallest credit course
      const remaining = Array.from(indegree.entries())
        .filter(([code, _deg]) => !planned.has(code) && (_deg === 0))
        .map(([code]) => codeToCourse.get(code)!);

      if (remaining.length === 0) {
        // Fallback: choose any not planned (cycle?) — in real data graph must be DAG.
        const anyRemaining = curriculum.courses.find(c => !planned.has(c.code));
        if (!anyRemaining) break;
        thisTerm.push(anyRemaining);
      } else {
        remaining.sort((a, b) => a.credits - b.credits);
        thisTerm.push(remaining[0]);
      }
    }

    // commit this term
    semesters.push({ term: `Semester ${termIndex++}`, courses: thisTerm });

    // update structures
    for (const c of thisTerm) {
      planned.add(c.code);
      indegree.delete(c.code);
      const outs = edges.get(c.code);
      if (outs) {
        for (const nxt of outs) {
          indegree.set(nxt, (indegree.get(nxt) || 0) - 1);
        }
      }
    }
  }

  return semesters;
}