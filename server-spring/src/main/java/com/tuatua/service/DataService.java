package com.tuatua.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.CollectionType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Service
public class DataService {

    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${app.dataDir:../server/data}")
    private String dataDir;

    public Curriculum loadCurriculum() {
        File f = new File(dataDir, "curriculum.json");
        if (!f.exists()) {
            return new Curriculum("SE (Demo)", Collections.emptyList());
        }
        try {
            return mapper.readValue(f, Curriculum.class);
        } catch (IOException e) {
            return new Curriculum("SE (Demo)", Collections.emptyList());
        }
    }

    public List&lt;Question&gt; loadQuestions() {
        File f = new File(dataDir, "questions.json");
        if (!f.exists()) {
            return Collections.emptyList();
        }
        try {
            CollectionType listType = mapper.getTypeFactory().constructCollectionType(List.class, Question.class);
            return mapper.readValue(f, listType);
        } catch (IOException e) {
            return Collections.emptyList();
        }
    }

    // DTOs / Records (Java 17)
    public static record Curriculum(String program, List&lt;Course&gt; courses) {}
    public static record Course(String code, String name, int credits, List&lt;String&gt; prerequisites) {}
    public static record Question(String id, String skill_tag, int difficulty, int answer, String prompt) {}
}