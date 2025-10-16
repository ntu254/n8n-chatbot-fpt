package com.tuatua.web;

import com.tuatua.service.DataService;
import com.tuatua.service.LearningPathService;
import com.tuatua.service.LearningPathService.Semester;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping(&quot;/api&quot;)
public class ApiController {

    private final DataService dataService;
    private final LearningPathService lpService;

    public ApiController(DataService dataService, LearningPathService lpService) {
        this.dataService = dataService;
        this.lpService = lpService;
    }

    // Config
    @Value(&quot;${app.n8n.webhookUrl:}&quot;)
    private String n8nWebhookUrl;
    @Value(&quot;${app.n8n.authHeader:}&quot;)
    private String n8nAuthHeader;
    @Value(&quot;${app.n8n.authValue:}&quot;)
    private String n8nAuthValue;

    // In-memory stores
    private final Map&lt;String, Map&lt;String, Object&gt;&gt; plans = new ConcurrentHashMap&lt;&gt;();
    private final Map&lt;String, QuizSession&gt; quizSessions = new ConcurrentHashMap&lt;&gt;();
    private final Map&lt;String, List&lt;Message&gt;&gt; messages = new ConcurrentHashMap&lt;&gt;();

    // Cached demo data
    private final DataService.Curriculum curriculumCache;
    private final List&lt;DataService.Question&gt; questionBank;

    {
        curriculumCache = null;
        questionBank = null;
    }

    @GetMapping(&quot;/curriculum/courses&quot;)
    public DataService.Curriculum getCurriculum() {
        return getCurriculumCache();
    }

    @PostMapping(&quot;/learning-path&quot;)
    public Map&lt;String, Object&gt; learningPath(@RequestBody Map&lt;String, Object&gt; body) {
        Map&lt;String, Object&gt; constraints = (Map&lt;String, Object&gt;) body.getOrDefault(&quot;constraints&quot;, Collections.emptyMap());
        int maxCreditsPerTerm = toInt(constraints.get(&quot;maxCreditsPerTerm&quot;), 18);
        List&lt;Semester&gt; semesters = lpService.generateLearningPath(getCurriculumCache(), maxCreditsPerTerm);
        Map&lt;String, Object&gt; res = new HashMap&lt;&gt;();
        res.put(&quot;semesters&quot;, semesters);
        res.put(&quot;notes&quot;, &quot;Generated with max &quot; + maxCreditsPerTerm + &quot; credits/term&quot;);
        return res;
    }

    @PostMapping(&quot;/auth/login&quot;)
    public Map&lt;String, Object&gt; login(@RequestBody Map&lt;String, Object&gt; body) {
        String email = String.valueOf(body.getOrDefault(&quot;email&quot;, &quot;&quot;));
        String password = String.valueOf(body.getOrDefault(&quot;password&quot;, &quot;&quot;));
        if (!StringUtils.hasText(email) || !StringUtils.hasText(password)) {
            return Map.of(&quot;error&quot;, &quot;email and password are required&quot;);
        }
        String token = &quot;mock-&quot; + UUID.randomUUID();
        return Map.of(
                &quot;token&quot;, token,
                &quot;user&quot;, Map.of(&quot;id&quot;, &quot;me&quot;, &quot;email&quot;, email)
        );
    }

    @PostMapping(&quot;/recommendations/specialization&quot;)
    public Map&lt;String, Object&gt; recommendations(@RequestBody Map&lt;String, Object&gt; body) {
        Map&lt;String, Object&gt; profile = (Map&lt;String, Object&gt;) body.getOrDefault(&quot;profile&quot;, Collections.emptyMap());
        double gpa = toDouble(profile.get(&quot;gpa&quot;), 0.0);
        List&lt;String&gt; interests = ((List&lt;?&gt;) profile.getOrDefault(&quot;interests&quot;, Collections.emptyList()))
                .stream().map(String::valueOf).map(String::toLowerCase).toList();

        List&lt;Map&lt;String, Object&gt;&gt; specs = List.of(
                Map.of(&quot;code&quot;, &quot;AI&quot;, &quot;name&quot;, &quot;Artificial Intelligence&quot;, &quot;tags&quot;, List.of(&quot;ai&quot;, &quot;ml&quot;, &quot;data&quot;, &quot;math&quot;)),
                Map.of(&quot;code&quot;, &quot;IoT&quot;, &quot;name&quot;, &quot;Internet of Things&quot;, &quot;tags&quot;, List.of(&quot;iot&quot;, &quot;hardware&quot;, &quot;embedded&quot;, &quot;network&quot;)),
                Map.of(&quot;code&quot;, &quot;SE&quot;, &quot;name&quot;, &quot;Software Engineering&quot;, &quot;tags&quot;, List.of(&quot;software&quot;, &quot;design&quot;, &quot;architecture&quot;, &quot;dev&quot;)),
                Map.of(&quot;code&quot;, &quot;BizIT&quot;, &quot;name&quot;, &quot;Business IT&quot;, &quot;tags&quot;, List.of(&quot;business&quot;, &quot;systems&quot;, &quot;analysis&quot;, &quot;erp&quot;))
        );

        List&lt;Map&lt;String, Object&gt;&gt; ranked = new ArrayList&lt;&gt;();
        for (Map&lt;String, Object&gt; sp : specs) {
            List&lt;String&gt; tags = (List&lt;String&gt;) sp.get(&quot;tags&quot;);
            int interestScore = 0;
            for (String t : tags) {
                if (interests.contains(t)) interestScore++;
            }
            double gpaScore = Math.max(0, Math.min(1, gpa / 4.0));
            double score = gpaScore * 0.6 + (interestScore / (double) tags.size()) * 0.4;
            String rationale = &quot;GPA factor &quot; + Math.round(gpaScore * 100) + &quot;%, interests match &quot; + interestScore + &quot;/&quot; + tags.size() + &quot;.&quot;;
            ranked.add(Map.of(&quot;code&quot;, sp.get(&quot;code&quot;), &quot;score&quot;, round3(score), &quot;rationale&quot;, rationale));
        }
        ranked.sort((a, b) -&gt; Double.compare((double) b.get(&quot;score&quot;), (double) a.get(&quot;score&quot;)));

        return Map.of(&quot;ranked_specializations&quot;, ranked);
    }

    @GetMapping(&quot;/recommendations/minors&quot;)
    public Map&lt;String, Object&gt; minors(@RequestParam(name = &quot;specialization&quot;, defaultValue = &quot;SE&quot;) String specialization,
                                      @RequestParam(name = &quot;goal&quot;, defaultValue = &quot;&quot;) String goal) {
        List&lt;Map&lt;String, String&gt;&gt; suggestions = List.of(
                Map.of(&quot;code&quot;, &quot;DS&quot;, &quot;name&quot;, &quot;Data Science&quot;, &quot;reason&quot;, &quot;Good for AI &amp; analytics&quot;),
                Map.of(&quot;code&quot;, &quot;UX&quot;, &quot;name&quot;, &quot;User Experience&quot;, &quot;reason&quot;, &quot;Complements Software Engineering&quot;),
                Map.of(&quot;code&quot;, &quot;Cloud&quot;, &quot;name&quot;, &quot;Cloud Computing&quot;, &quot;reason&quot;, &quot;Infrastructure &amp; DevOps skills&quot;)
        );
        return Map.of(&quot;specialization&quot;, specialization, &quot;goal&quot;, goal, &quot;minors&quot;, suggestions);
    }

    @PostMapping(&quot;/plans&quot;)
    public Map&lt;String, String&gt; createPlan(@RequestBody Map&lt;String, Object&gt; payload) {
        String planId = UUID.randomUUID().toString();
        Map&lt;String, Object&gt; plan = new HashMap&lt;&gt;(payload);
        plan.put(&quot;id&quot;, planId);
        plan.put(&quot;created_at&quot;, Instant.now().toString());
        plans.put(planId, plan);
        return Map.of(&quot;planId&quot;, planId);
    }

    @GetMapping(&quot;/plans/{id}&quot;)
    public ResponseEntity&lt;Object&gt; getPlan(@PathVariable String id) {
        Map&lt;String, Object&gt; plan = plans.get(id);
        if (plan == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(&quot;error&quot;, &quot;plan not found&quot;));
        return ResponseEntity.ok(plan);
    }

    @GetMapping(&quot;/courses/{code}/recommendations&quot;)
    public Map&lt;String, Object&gt; courseRecommendations(@PathVariable String code) {
        List&lt;Map&lt;String, String&gt;&gt; recs = List.of(
                Map.of(&quot;type&quot;, &quot;method&quot;, &quot;text&quot;, &quot;Practice problem sets 3x/week; use spaced repetition.&quot;),
                Map.of(&quot;type&quot;, &quot;resource&quot;, &quot;text&quot;, &quot;University lecture notes; recommended textbook (latest edition).&quot;),
                Map.of(&quot;type&quot;, &quot;resource&quot;, &quot;text&quot;, &quot;Top-rated online course relevant to syllabus.&quot;)
        );
        return Map.of(&quot;course_code&quot;, code, &quot;recommendations&quot;, recs);
    }

    @PostMapping(&quot;/quizzes/start&quot;)
    public Map&lt;String, Object&gt; quizStart(@RequestBody Map&lt;String, Object&gt; body) {
        List&lt;String&gt; skillTags = ((List&lt;?&gt;) body.getOrDefault(&quot;skillTags&quot;, List.of(&quot;algorithms&quot;))))
                .stream().map(String::valueOf).toList();
        String quizId = UUID.randomUUID().toString();
        QuizSession session = new QuizSession(skillTags, new ArrayList&lt;&gt;(), 0, 1);
        quizSessions.put(quizId, session);
        DataService.Question q = nextQuestionForQuiz(quizId);
        if (q == null) {
            return Map.of(&quot;error&quot;, &quot;No questions available&quot;);
        }
        return Map.of(&quot;quizId&quot;, quizId, &quot;question&quot;, q);
    }

    @PostMapping(&quot;/quizzes/answer&quot;)
    public Map&lt;String, Object&gt; quizAnswer(@RequestBody Map&lt;String, Object&gt; body) {
        String quizId = String.valueOf(body.getOrDefault(&quot;quizId&quot;, &quot;&quot;));
        String questionId = String.valueOf(body.getOrDefault(&quot;questionId&quot;, &quot;&quot;));
        int answer = toInt(body.get(&quot;answer&quot;), Integer.MIN_VALUE);
        QuizSession session = quizSessions.get(quizId);
        if (session == null) return Map.of(&quot;error&quot;, &quot;quiz not found&quot;);

        Optional&lt;DataService.Question&gt; qOpt = getQuestionBank().stream().filter(x -&gt; Objects.equals(x.id(), questionId)).findFirst();
        if (qOpt.isEmpty()) return Map.of(&quot;error&quot;, &quot;question not found&quot;);
        DataService.Question q = qOpt.get();

        boolean isCorrect = answer == q.answer();
        session.ability += isCorrect ? 1 : -1;
        session.currentDifficulty = Math.max(1, Math.min(3, session.currentDifficulty + (isCorrect ? 1 : -1)));
        session.askedIds.add(q.id());

        DataService.Question nextQ = nextQuestionForQuiz(quizId);
        Map&lt;String, Object&gt; res = new HashMap&lt;&gt;();
        res.put(&quot;nextQuestion&quot;, nextQ);
        res.put(&quot;updatedAbility&quot;, session.ability);
        res.put(&quot;is_correct&quot;, isCorrect);
        return res;
    }

    @GetMapping(&quot;/alerts&quot;)
    public List&lt;Map&lt;String, Object&gt;&gt; alerts() {
        return List.of(
                Map.of(&quot;student_id&quot;, &quot;me&quot;, &quot;type&quot;, &quot;gpa_drop&quot;, &quot;severity&quot;, &quot;medium&quot;, &quot;created_at&quot;, Instant.now().toString(), &quot;payload&quot;, Map.of(&quot;gpa&quot;, 2.5)),
                Map.of(&quot;student_id&quot;, &quot;me&quot;, &quot;type&quot;, &quot;prereq_miss&quot;, &quot;severity&quot;, &quot;high&quot;, &quot;created_at&quot;, Instant.now().toString(), &quot;payload&quot;, Map.of(&quot;course&quot;, &quot;CS204&quot;, &quot;missing&quot;, List.of(&quot;CS201&quot;)))
        );
    }

    @PostMapping(&quot;/messages/send&quot;)
    public Map&lt;String, Object&gt; sendMessage(@RequestBody Map&lt;String, Object&gt; body) {
        String threadId = String.valueOf(body.getOrDefault(&quot;thread_id&quot;, &quot;default&quot;));
        String sender = String.valueOf(body.getOrDefault(&quot;sender&quot;, &quot;student&quot;));
        String text = String.valueOf(body.getOrDefault(&quot;text&quot;, &quot;&quot;));
        Message msg = new Message(threadId, sender, text, Instant.now().toString());
        messages.computeIfAbsent(threadId, k -&gt; new ArrayList&lt;&gt;()).add(msg);
        return Map.of(&quot;ok&quot;, true);
    }

    @GetMapping(&quot;/messages/thread&quot;)
    public Map&lt;String, Object&gt; getThread(@RequestParam(name = &quot;thread_id&quot;, defaultValue = &quot;default&quot;) String threadId) {
        return Map.of(&quot;thread_id&quot;, threadId, &quot;messages&quot;, messages.getOrDefault(threadId, Collections.emptyList()));
    }

    @PostMapping(&quot;/chat&quot;)
    public ResponseEntity&lt;Object&gt; chatProxy(@RequestBody Map&lt;String, Object&gt; body) {
        if (!StringUtils.hasText(n8nWebhookUrl)) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(&quot;error&quot;, &quot;N8N_WEBHOOK_URL is not configured&quot;));
        }
        RestTemplate rt = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (StringUtils.hasText(n8nAuthHeader) &amp;&amp; StringUtils.hasText(n8nAuthValue)) {
            headers.add(n8nAuthHeader, n8nAuthValue);
        }
        HttpEntity&lt;Map&lt;String, Object&gt;&gt; entity = new HttpEntity&lt;&gt;(body, headers);
        ResponseEntity&lt;String&gt; upstream = rt.exchange(n8nWebhookUrl, HttpMethod.POST, entity, String.class);
        String contentType = Optional.ofNullable(upstream.getHeaders().getContentType()).map(MediaType::toString).orElse(&quot;&quot;);
        if (contentType.contains(&quot;application/json&quot;)) {
            return ResponseEntity.status(upstream.getStatusCode()).body(upstream.getBody());
        } else {
            return ResponseEntity.status(upstream.getStatusCode())
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(upstream.getBody());
        }
    }

    // Helpers and DTOs
    private DataService.Curriculum getCurriculumCache() {
        // Lazy load each request to reflect file changes without restarting
        return dataService.loadCurriculum();
    }
    private List&lt;DataService.Question&gt; getQuestionBank() {
        return dataService.loadQuestions();
    }

    private DataService.Question nextQuestionForQuiz(String quizId) {
        QuizSession session = quizSessions.get(quizId);
        if (session == null) return null;
        int targetDifficulty = session.currentDifficulty;
        List&lt;DataService.Question&gt; candidates = getQuestionBank().stream()
                .filter(q -&gt; session.skillTags.contains(q.skill_tag())
                        &amp;&amp; q.difficulty() == targetDifficulty
                        &amp;&amp; !session.askedIds.contains(q.id()))
                .toList();
        if (!candidates.isEmpty()) {
            return candidates.get(new Random().nextInt(candidates.size()));
        }
        List&lt;DataService.Question&gt; fallback = getQuestionBank().stream()
                .filter(q -&gt; session.skillTags.contains(q.skill_tag())
                        &amp;&amp; !session.askedIds.contains(q.id()))
                .toList();
        if (!fallback.isEmpty()) {
            return fallback.get(new Random().nextInt(fallback.size()));
        }
        return null;
    }

    private static double round3(double v) {
        return Math.round(v * 1000.0) / 1000.0;
    }

    private static int toInt(Object o, int def) {
        try {
            return Integer.parseInt(String.valueOf(o));
        } catch (Exception e) {
            return def;
        }
    }

    private static double toDouble(Object o, double def) {
        try {
            return Double.parseDouble(String.valueOf(o));
        } catch (Exception e) {
            return def;
        }
    }

    private static class QuizSession {
        final List&lt;String&gt; skillTags;
        final List&lt;String&gt; askedIds;
        int ability;
        int currentDifficulty;

        QuizSession(List&lt;String&gt; skillTags, List&lt;String&gt; askedIds, int ability, int currentDifficulty) {
            this.skillTags = skillTags;
            this.askedIds = askedIds;
            this.ability = ability;
            this.currentDifficulty = currentDifficulty;
        }
    }

    public static record Message(String thread_id, String sender, String text, String created_at) {}
}