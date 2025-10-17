package com.tuatua.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Date;

@Configuration
public class SecurityConfig {

    @Value("${app.security.corsOrigin:*}")
    private String corsOrigin;

    @Bean
    SecurityFilterChain web(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(reg -> reg
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/chat").permitAll()
                        .requestMatchers("/actuator/**", "/v3/api-docs/**", "/swagger-ui/**").permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(new JwtPassthroughFilter(corsOrigin), BasicAuthenticationFilter.class);
        return http.build();
    }

    static class JwtPassthroughFilter extends OncePerRequestFilter {
        private final String corsOrigin;

        public JwtPassthroughFilter(String corsOrigin) {
            this.corsOrigin = corsOrigin;
        }

        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
                throws ServletException, IOException {
            String auth = request.getHeader(HttpHeaders.AUTHORIZATION);
            if (auth != null && auth.startsWith("Bearer ")) {
                // Accept any non-empty bearer for MVP; production should verify properly.
                Authentication authentication = new AbstractAuthenticationToken(
                        AuthorityUtils.createAuthorityList("ROLE_USER")) {
                    @Override
                    public Object getCredentials() { return auth.substring(7); }

                    @Override
                    public Object getPrincipal() { return "user"; }

                    @Override
                    public boolean isAuthenticated() { return true; }
                };
                // set details if needed
            }
            // CORS headers for simple demo
            response.setHeader("Access-Control-Allow-Origin", corsOrigin);
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
            response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control");
            response.setHeader("Access-Control-Max-Age", "86400");
            if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
                response.setStatus(200);
                response.setContentType(MediaType.TEXT_PLAIN_VALUE);
                response.getWriter().write("OK");
                return;
            }
            chain.doFilter(request, response);
        }
    }
}