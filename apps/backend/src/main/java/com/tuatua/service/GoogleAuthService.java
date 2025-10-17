package com.tuatua.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.tuatua.entity.Student;
import com.tuatua.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;

@Service
public class GoogleAuthService {

    @Autowired
    private Environment env; // Để đọc cấu hình từ application.properties

    @Autowired
    private StudentRepository studentRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    private Student processUserInfo(JsonNode userInfo) {
        String email = userInfo.get("email").asText();

        // Tìm kiếm người dùng trong DB bằng email
        Optional<Student> existingStudentOpt = studentRepository.findByEmail(email);

        Student student;
        if (existingStudentOpt.isPresent()) {
            // Nếu người dùng đã tồn tại -> Cập nhật thông tin và trả về
            student = existingStudentOpt.get();
            student.setName(userInfo.get("name").asText());
        } else {
            // Nếu người dùng chưa tồn tại -> Tạo mới
            student = new Student();
            student.setEmail(email);
            student.setGoogleId(userInfo.get("sub").asText()); // 'sub' là ID duy nhất của người dùng Google
            student.setName(userInfo.get("name").asText());
        }

        // Lưu người dùng (dù là cập nhật hay tạo mới) vào DB và trả về
        return studentRepository.save(student);
    }


    public Student processUserLogin(String code) {
        // 1. Dùng code để đổi lấy access token
        String accessToken = getAccessToken(code);

        // 2. Dùng access token để lấy thông tin người dùng từ Google
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<String> entity = new HttpEntity<>("", headers);

        ResponseEntity<JsonNode> response = restTemplate.exchange(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                HttpMethod.GET,
                entity,
                JsonNode.class
        );

        JsonNode userInfo = response.getBody();

        if (userInfo == null) {
            throw new RuntimeException("Could not get user info from Google");
        }

        // 3. Xử lý thông tin người dùng: Tìm hoặc Tạo mới (Find or Create)
        return processUserInfo(userInfo);
    }

    private String getAccessToken(String code) {
        String clientId = env.getProperty("spring.security.oauth2.client.registration.google.client-id");
        String clientSecret = env.getProperty("spring.security.oauth2.client.registration.google.client-secret");
        String redirectUri = "http://localhost:8080/login/oauth2/code/google"; // Phải khớp với URI đã đăng ký

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("code", code);
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("redirect_uri", redirectUri);
        params.add("grant_type", "authorization_code");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(params, headers);

        ResponseEntity<JsonNode> response = restTemplate.postForEntity(
                "https://oauth2.googleapis.com/token",
                requestEntity,
                JsonNode.class
        );

        JsonNode responseBody = response.getBody();
        if (responseBody != null && responseBody.has("access_token")) {
            return responseBody.get("access_token").asText();
        }

        throw new RuntimeException("Could not get access token from Google");
    }
}