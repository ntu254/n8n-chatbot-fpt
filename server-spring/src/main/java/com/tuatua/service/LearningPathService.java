package com.tuatua.service;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class LearningPathService {

    public List&lt;Semester&gt; generateLearningPath(DataService.Curriculum curr, int maxCreditsPerTerm) {
        Map&lt;String, DataService.Course&gt; codeToCourse = new HashMap&lt;&gt;();
        Map&lt;String, Integer&gt; indegree = new HashMap&lt;&gt;();
        Map&lt;String, Set&lt;String&gt;&gt; edges = new HashMap&lt;&gt;();

        for (DataService.Course c : curr.courses()) {
            codeToCourse.put(c.code(), c);
            int deg = c.prerequisites() != null ? c.prerequisites().size() : 0;
            indegree.put(c.code(), deg);
            if (c.prerequisites() != null) {
                for (String pre : c.prerequisites()) {
                    edges.computeIfAbsent(pre, k -&gt; new HashSet&lt;&gt;()).add(c.code());
                }
            }
        }

        Set&lt;String&gt; planned = new HashSet&lt;&gt;();
        List&lt;Semester&gt; semesters = new ArrayList&lt;&gt;();
        int termIndex = 1;

        while (planned.size() &lt; curr.courses().size()) {
            int credits = 0;
            List&lt;DataService.Course&gt; thisTerm = new ArrayList&lt;&gt;();

            List&lt;String&gt; available = indegree.entrySet().stream()
                    .filter(e -&gt; e.getValue() == 0 &amp;&amp; !planned.contains(e.getKey()))
                    .map(Map.Entry::getKey)
                    .toList();

            for (String code : available) {
                DataService.Course course = codeToCourse.get(code);
                if (course == null) continue;
                if (credits + course.credits() &lt;= maxCreditsPerTerm) {
                    thisTerm.add(course);
                    credits += course.credits();
                }
            }

            if (thisTerm.isEmpty()) {
                List&lt;DataService.Course&gt; remaining = indegree.entrySet().stream()
                        .filter(e -&gt; !planned.contains(e.getKey()) &amp;&amp; e.getValue() == 0)
                        .map(e -&gt; codeToCourse.get(e.getKey()))
                        .filter(Objects::nonNull)
                        .toList();

                if (remaining.isEmpty()) {
                    Optional&lt;DataService.Course&gt; anyRemaining = curr.courses().stream()
                            .filter(c -&gt; !planned.contains(c.code()))
                            .findFirst();
                    if (anyRemaining.isPresent()) {
                        thisTerm.add(anyRemaining.get());
                    }
                } else {
                    remaining = new ArrayList&lt;&gt;(remaining);
                    remaining.sort(Comparator.comparingInt(DataService.Course::credits));
                    thisTerm.add(remaining.get(0));
                }
            }

            semesters.add(new Semester(&quot;Semester &quot; + termIndex++, thisTerm));

            for (DataService.Course c : thisTerm) {
                planned.add(c.code());
                indegree.remove(c.code());
                Set&lt;String&gt; outs = edges.get(c.code());
                if (outs != null) {
                    for (String nxt : outs) {
                        indegree.put(nxt, indegree.getOrDefault(nxt, 0) - 1);
                    }
                }
            }
        }

        return semesters;
    }

    public static record Semester(String term, List&lt;DataService.Course&gt; courses) {}
}