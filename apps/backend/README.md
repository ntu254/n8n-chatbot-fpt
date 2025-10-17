# Mobile Backend — Java Spring Boot

Spring Boot 3 backend for the Mobile app (Expo SDK 54). Provides JWT auth and a proxy to n8n chatbot plus placeholders for domain APIs.

## Features (MVP)
- POST /api/auth/login → issues a short-lived JWT for any email/password (replace with real auth)
- POST /api/chat → forwards body to your n8n webhook URL with optional auth header/value
- CORS enabled (configurable), Spring Security baseline

## Getting started

Prerequisites:
- Java 17+
- Maven 3.9+

Setup:
```
cd apps/backend
cp src/main/resources/application.properties src/main/resources/application-local.properties
# Edit application-local.properties:
# - app.n8n.webhookUrl=https://your-n8n/webhook/xxxx
# - app.n8n.authHeader=Authorization (optional)
# - app.n8n.authValue=Bearer YOUR_TOKEN (optional)
```

Run:
```
mvn spring-boot:run
```

API base: http://localhost:8080

Mobile app config (Expo SDK 54):
- In apps/mobile/.env set:
```
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
```

## Next endpoints to implement
- GET /api/students/me
- GET /api/curriculum/courses
- POST /api/recommendations/specialization
- POST /api/learning-path
- POST /api/plans
- POST /api/quizzes/start
- POST /api/quizzes/answer
- POST /api/messages/send
- GET /api/alerts

## Deploy
- Containerize or deploy jar on Fly.io/Render/VPS/Cloud Run.
- Provide env variables via platform secrets.