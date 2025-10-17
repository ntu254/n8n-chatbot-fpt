package com.tuatua.controller;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {

    @Value("${app.security.jwtSecret:dev-secret-change-me}")
    private String jwtSecret;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestBody LoginRequest request
    ) {
        // MVP: accept any email/password and issue a short-lived JWT. Replace with real auth later.
        String token = Jwts.builder()
                .setSubject(request.email())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 3600_000)) // 1h
                .signWith(SignatureAlgorithm.HS256, jwtSecret.getBytes())
                .compact();

        Map<String, Object> body = new HashMap<>();
        body.put("token", token);
        body.put("email", request.email());
        return ResponseEntity.ok(body);
    }

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password
    ) {}
}