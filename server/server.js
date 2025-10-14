import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Config
const PORT = process.env.PORT || 3000;
// The upstream n8n webhook URL, e.g. https://nttu254.app.n8n.cloud/webhook/b1269f08-4273-48f6-bd24-178d1e8b9816
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || '';
const N8N_AUTH_HEADER = process.env.N8N_AUTH_HEADER || ''; // e.g. "Authorization"
const N8N_AUTH_VALUE = process.env.N8N_AUTH_VALUE || '';   // e.g. "Bearer YOUR_TOKEN"

// Middlewares
app.use(express.json());

// CORS configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Static webapp (serve ../webapp)
app.use('/', express.static(path.join(__dirname, '..', 'webapp')));

// ------------------------
// Data loading (demo)
// ------------------------
const curriculumPath = path.join(__dirname, 'data', 'curriculum.json');
let curriculum = { program: 'SE (Demo)', courses: [] };
try {
  curriculum = JSON.parse(fs.readFileSync(curriculumPath, 'utf-8'));
} catch (e) {
  console.warn('curriculum.json not found; using empty dataset');
}

const questionsPath = path.join(__dirname, 'data', 'questions.json');
let questionBank = { questions: [] };
try {
  questionBank = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
} catch (e) {
  console.warn('questions.json not found; quizzes will be disabled');
}

// In-memory stores (demo)
const plans = new Map(); // planId -> plan payload
const quizSessions = new Map(); // quizId -> { skillTags, askedIds, ability, currentDifficulty }
const messages = new Map(); // threadId -> [Message]

// ------------------------
// Helper: learning path (topo + credit cap)
// ------------------------
function generateLearningPath(curr, opts = {}) {
  const maxCreditsPerTerm = opts.maxCreditsPerTerm ?? 18;
  const codeToCourse = new Map(curr.courses.map((c) => [c.code, c]));
  const indegree = new Map();
  const edges = new Map();

  for (const c of curr.courses) {
    indegree.set(c.code, (c.prerequisites?.length) || 0);
    if (c.prerequisites) {
      for (const pre of c.prerequisites) {
        const set = edges.get(pre) || new Set();
        set.add(c.code);
        edges.set(pre, set);
      }
    }
  }

  const planned = new Set();
  const semesters = [];
  let termIndex = 1;

  while (planned.size < curr.courses.length) {
    let credits = 0;
    const thisTerm = [];

    const available = Array.from(indegree.entries())
      .filter(([code, deg]) => deg === 0 && !planned.has(code))
      .map(([code]) => code);

    for (const code of available) {
      const course = codeToCourse.get(code);
      if (!course) continue;
      if (credits + course.credits <= maxCreditsPerTerm) {
        thisTerm.push(course);
        credits += course.credits;
      }
    }

    if (thisTerm.length === 0) {
      const remaining = Array.from(indegree.entries())
        .filter(([code, deg]) => !planned.has(code) && deg === 0)
        .map(([code]) => codeToCourse.get(code))
        .filter(Boolean);

      if (remaining.length === 0) {
        const anyRemaining = curr.courses.find((c) => !planned.has(c.code));
        if (!anyRemaining) break;
        thisTerm.push(anyRemaining);
      } else {
        remaining.sort((a, b) => a.credits - b.credits);
        thisTerm.push(remaining[0]);
      }
    }

    semesters.push({ term: `Semester ${termIndex++}`, courses: thisTerm });

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

// ------------------------
// Proxy endpoint to call n8n webhook with proper headers
// ------------------------
app.post('/api/chat', async (req, res) => {
  try {
    if (!N8N_WEBHOOK_URL) {
      return res.status(500).json({ error: 'N8N_WEBHOOK_URL is not configured' });
    }

    // Forward the request body to n8n
    const headers = { 'Content-Type': 'application/json' };
    if (N8N_AUTH_HEADER && N8N_AUTH_VALUE) {
      headers[N8N_AUTH_HEADER] = N8N_AUTH_VALUE;
    }

    const upstream = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body)
    });

    const contentType = upstream.headers.get('content-type') || '';
    const status = upstream.status;

    if (contentType.includes('application/json')) {
      const data = await upstream.json();
      return res.status(status).json(data);
    } else {
      const text = await upstream.text();
      res.status(status).type('text/plain').send(text);
    }
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Upstream request failed' });
  }
});

// ------------------------
// Auth (demo)
// ------------------------
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  // Demo only: accept any credentials
  const token = `mock-${randomUUID()}`;
  res.json({ token, user: { id: 'me', email } });
});

// ------------------------
// Curriculum & Learning Path
// ------------------------
app.get('/api/curriculum/courses', (req, res) => {
  res.json(curriculum);
});

app.post('/api/learning-path', (req, res) => {
  const { constraints } = req.body || {};
  const maxCreditsPerTerm = constraints?.maxCreditsPerTerm ?? 18;
  const semesters = generateLearningPath(curriculum, { maxCreditsPerTerm });
  res.json({ semesters, notes: `Generated with max ${maxCreditsPerTerm} credits/term` });
});

// ------------------------
// Recommendations (specialization/minors) — MVP heuristic
// ------------------------
app.post('/api/recommendations/specialization', (req, res) => {
  const { profile } = req.body || {};
  const gpa = Number(profile?.gpa ?? 0);
  const interests = (profile?.interests || []).map((s) => String(s).toLowerCase());

  const specs = [
    { code: 'AI', name: 'Artificial Intelligence', tags: ['ai', 'ml', 'data', 'math'] },
    { code: 'IoT', name: 'Internet of Things', tags: ['iot', 'hardware', 'embedded', 'network'] },
    { code: 'SE', name: 'Software Engineering', tags: ['software', 'design', 'architecture', 'dev'] },
    { code: 'BizIT', name: 'Business IT', tags: ['business', 'systems', 'analysis', 'erp'] }
  ];

  const ranked = specs.map((sp) => {
    const interestScore = sp.tags.reduce((sum, t) => sum + (interests.includes(t) ? 1 : 0), 0);
    const gpaScore = Math.max(0, Math.min(1, gpa / 4)); // normalize 0..1
    const score = gpaScore * 0.6 + (interestScore / sp.tags.length) * 0.4;
    const rationale =
      `GPA factor ${(gpaScore * 100).toFixed(0)}%, interests match ${interestScore}/${sp.tags.length}.`;
    return { code: sp.code, score: Number(score.toFixed(3)), rationale };
  }).sort((a, b) => b.score - a.score);

  res.json({ ranked_specializations: ranked });
});

// Example minors endpoint (stub)
app.get('/api/recommendations/minors', (req, res) => {
  const specialization = String(req.query.specialization || 'SE');
  const goal = String(req.query.goal || '');
  const suggestions = [
    { code: 'DS', name: 'Data Science', reason: 'Good for AI & analytics' },
    { code: 'UX', name: 'User Experience', reason: 'Complements Software Engineering' },
    { code: 'Cloud', name: 'Cloud Computing', reason: 'Infrastructure & DevOps skills' }
  ];
  res.json({ specialization, goal, minors: suggestions });
});

// ------------------------
// Plans (create/get) — demo in-memory
// ------------------------
app.post('/api/plans', (req, res) => {
  const payload = req.body || {};
  const planId = randomUUID();
  plans.set(planId, { id: planId, ...payload, created_at: new Date().toISOString() });
  res.json({ planId });
});

app.get('/api/plans/:id', (req, res) => {
  const plan = plans.get(req.params.id);
  if (!plan) return res.status(404).json({ error: 'plan not found' });
  res.json(plan);
});

// ------------------------
// Per-course recommendations (stub)
// ------------------------
app.get('/api/courses/:code/recommendations', (req, res) => {
  const code = String(req.params.code);
  // Simple stub recommendations
  const recs = [
    { type: 'method', text: 'Practice problem sets 3x/week; use spaced repetition.' },
    { type: 'resource', text: 'University lecture notes; recommended textbook (latest edition).' },
    { type: 'resource', text: 'Top-rated online course relevant to syllabus.' }
  ];
  res.json({ course_code: code, recommendations: recs });
});

// ------------------------
// Quizzes (adaptive MVP)
// ------------------------
app.post('/api/quizzes/start', (req, res) => {
  const { course, skillTags = [] } = req.body || {};
  const quizId = randomUUID();
  const tags = Array.isArray(skillTags) && skillTags.length ? skillTags.map(String) : ['algorithms'];
  quizSessions.set(quizId, {
    skillTags: tags,
    askedIds: [],
    ability: 0,
    currentDifficulty: 1
  });

  const q = nextQuestionForQuiz(quizId);
  if (!q) return res.status(400).json({ error: 'No questions available' });
  res.json({ quizId, question: q });
});

app.post('/api/quizzes/answer', (req, res) => {
  const { quizId, questionId, answer } = req.body || {};
  const session = quizSessions.get(quizId);
  if (!session) return res.status(404).json({ error: 'quiz not found' });

  const q = questionBank.questions.find((x) => x.id === questionId);
  if (!q) return res.status(404).json({ error: 'question not found' });

  const is_correct = Number(answer) === Number(q.answer);
  // update ability: +1 for correct, -1 for wrong (simple MVP)
  session.ability += is_correct ? 1 : -1;
  // adjust difficulty
  session.currentDifficulty = Math.max(1, Math.min(3, session.currentDifficulty + (is_correct ? 1 : -1)));

  // add to asked
  session.askedIds.push(q.id);

  const nextQ = nextQuestionForQuiz(quizId);
  res.json({ nextQuestion: nextQ, updatedAbility: session.ability, is_correct });
});

function nextQuestionForQuiz(quizId) {
  const session = quizSessions.get(quizId);
  if (!session) return null;
  const targetDifficulty = session.currentDifficulty;
  // pick question matching any skill tag and target difficulty, not asked yet
  const candidates = questionBank.questions.filter(
    (q) => session.skillTags.includes(q.skill_tag) && q.difficulty === targetDifficulty && !session.askedIds.includes(q.id)
  );
  if (candidates.length) return candidates[Math.floor(Math.random() * candidates.length)];

  // fallback: any difficulty among tags not asked
  const fallback = questionBank.questions.filter(
    (q) => session.skillTags.includes(q.skill_tag) && !session.askedIds.includes(q.id)
  );
  if (fallback.length) return fallback[Math.floor(Math.random() * fallback.length)];

  return null;
}

// ------------------------
// Alerts (early-warning stub)
// ------------------------
app.get('/api/alerts', (req, res) => {
  const alerts = [
    { student_id: 'me', type: 'gpa_drop', severity: 'medium', created_at: new Date().toISOString(), payload: { gpa: 2.5 } },
    { student_id: 'me', type: 'prereq_miss', severity: 'high', created_at: new Date().toISOString(), payload: { course: 'CS204', missing: ['CS201'] } }
  ];
  res.json(alerts);
});

// ------------------------
// Advisor messaging (stub)
// ------------------------
app.post('/api/messages/send', (req, res) => {
  const { thread_id = 'default', sender = 'student', text = '' } = req.body || {};
  const msg = { thread_id, sender, text, created_at: new Date().toISOString() };
  const arr = messages.get(thread_id) || [];
  arr.push(msg);
  messages.set(thread_id, arr);
  res.json({ ok: true });
});

app.get('/api/messages/thread', (req, res) => {
  const thread_id = String(req.query.thread_id || 'default');
  res.json({ thread_id, messages: messages.get(thread_id) || [] });
});

app.listen(PORT, () => {
  console.log(`TuaTua dev server running at http://localhost:${PORT}`);
  console.log(`Serving webapp from ${path.join(__dirname, '..', 'webapp')}`);
  if (N8N_WEBHOOK_URL) {
    console.log(`Proxying /api/chat -> ${N8N_WEBHOOK_URL}`);
  } else {
    console.log('Warning: N8N_WEBHOOK_URL is empty. Set it in .env');
  }
});