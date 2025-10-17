package com.tuatua.service;

import com.tuatua.entity.Student;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String SECRET_KEY;

    // Tạo JWT từ thông tin người dùng (Student)
    public String generateToken(Student student) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", student.getEmail());
        claims.put("name", student.getName());

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(student.getEmail()) // Chủ thể của token
                .setIssuedAt(new Date(System.currentTimeMillis())) // Thời gian phát hành
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24)) // Thời gian hết hạn (ví dụ: 24 giờ)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // Lấy signing key từ secret key
    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(SECRET_KEY);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // Trích xuất một claim cụ thể từ token
    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // Trích xuất toàn bộ thông tin (payload) từ token
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // Các phương thức khác để xác thực token (sẽ cần khi bạn làm filter cho các request sau này)
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        // So sánh username từ token với username từ UserDetails
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }
}
