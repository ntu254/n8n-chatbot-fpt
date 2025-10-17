package com.tuatua.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Value("${app.n8n.webhookUrl:}")
    private String n8nWebhookUrl;

    @Value("${app.n8n.authHeader:}")
    private String n8nAuthHeader;

    @Value("${app.n8n.authValue:}")
    private String n8nAuthValue;

    private final RestTemplate http = new RestTemplate();

    @PostMapping
    public ResponseEntity<?> chat(@RequestBody(required = false) Map<String, Object> payload) {
        if (!StringUtils.hasText(n8nWebhookUrl)) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "N8N webhook URL is not configured"));
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (StringUtils.hasText(n8nAuthHeader) && StringUtils.hasText(n8nAuthValue)) {
            headers.set(n8nAuthHeader, n8nAuthValue);
        }
        HttpEntity<Map<String, Object>> req = new HttpEntity<>(payload == null ? Map.of() : payload, headers);
        ResponseEntity<String> upstream = http.postForEntity(n8nWebhookUrl, req, String.class);

        MediaType contentType = upstream.getHeaders().getContentType();
        if (contentType != null && contentType.includes(MediaType.APPLICATION_JSON)) {
            return ResponseEntity.status(upstream.getStatusCode()).contentType(MediaType.APPLICATION_JSON).body(upstream.getBody());
        }
        return ResponseEntity.status(upstream.getStatusCode()).contentType(MediaType.TEXT_PLAIN).body(upstream.getBody());
    }
}