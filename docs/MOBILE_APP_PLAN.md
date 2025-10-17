# Kế hoạch triển khai Mobile App — AI-Powered Adaptive Learning System

Tài liệu này tổng hợp công việc cần làm để xây dựng ứng dụng di động cho hệ thống “AI-Powered Adaptive Learning System” (Cố vấn học tập ảo), bám sát các nhóm yêu cầu chức năng đã nêu (FR1–FR3) và ba trụ cột: Lập kế hoạch & Cá nhân hoá, Hỗ trợ & Tương tác, Theo dõi & Can thiệp.

Mục tiêu v1: ra mắt ứng dụng mobile có Chatbot AI (FR3.1), kênh nhắn cố vấn con người (FR3.2), khuyến nghị chuyên ngành cơ bản (FR1.1), lộ trình học tự động ở mức MVP (FR1.3), công cụ lập kế hoạch học kỳ (FR2.1). Các tính năng còn lại (FR1.2, FR2.2, FR2.3, theo dõi rủi ro) triển khai theo các mốc tiếp theo.

--------------------------------
1) Lựa chọn công nghệ & nguyên tắc
--------------------------------
- Nền tảng mobile: React Native + TypeScript (Expo SDK 54, ưu tiên EAS để tăng tốc build/distribution). Lý do:
  - Tận dụng kiến thức JS/TS sẵn có (repo hiện có webapp JS + Node server).
  - Hệ sinh thái phong phú: navigation, state management, UI kit, MMKV/AsyncStorage, SQLite/WatermelonDB/Realm.
  - CI/CD dễ với EAS, TestFlight/Play Console.
- Backend/API:
  - Backend chính thức: Java Spring Boot 3 (REST API) cho tất cả dịch vụ: Auth, Student/Profile, Curriculum (khóa học/tiên quyết), Recommendation/Planning, Quiz, Messaging, Notification.
  - Giai đoạn đầu vẫn có thể tái sử dụng proxy n8n hiện có (/api/chat) hoặc bọc n8n qua endpoint Spring Boot `/api/chat`.
  - CSDL: Postgres (có thể dùng Supabase để tăng tốc), tận dụng pgvector nếu cần RAG nội bộ.
- AI & RAG:
  - Duy trì n8n workflow RAG hiện có (rag-ai-agent-nttu254.json) để trả lời kiến thức chương trình/khoa.
  - Bổ sung công cụ/“tool” cho agent: tra cứu đồ thị tiên quyết, tối ưu thời khóa biểu, khuyến nghị chuyên ngành.
  - Endpoint (ví dụ — Spring Boot):
- POST /api/auth/login (trả JWT)
- GET /api/students/me (Bearer JWT)
- GET /api/curriculum/courses
- POST /api/recommendations/specialization
- POST /api/learning-path
- POST /api/plans
- POST /api/quizzes/start
- POST /api/quizzes/answer
- POST /api/messages/send
- GET /api/alerts
- POST /api/chat (proxy tới n8n)

---------------------------------------
7) AI: phương pháp & triển khai từng bước
---------------------------------------
- RAG chatbot (đang có): n8n + Supabase pgvector + Gemini. Nâng cấp:
  - Bổ sung “tools” domain: tra cứu đồ thị tiên quyết (Postgres), tối ưu lịch (service riêng), tham chiếu học phần.
  - Chuẩn hóa prompt: phong cách cố vấn học tập, trích dẫn nguồn.
- Khuyến nghị chuyên ngành:
  - MVP: heuristic + LLM justify; đầu vào hồ sơ → ranking chuyên ngành.
  - Về sau: train mô hình xếp hạng dựa trên dữ liệu lịch sử.
- Lộ trình học:
  - Dùng thuật toán topo sort + heuristic phân phối tín chỉ; thêm ràng buộc môn song hành/không song hành.
- Quiz thích ứng:
  - MVP: difficulty ladder (±1 mức) theo đúng/sai; v2 dùng IRT 1PL/2PL.

--------------------------------
8) Bảo mật, riêng tư, tuân thủ
--------------------------------
- Thiết bị: token trong SecureStore/MMKV; xóa sạch khi logout.
- Backend: RBAC (student/advisor/admin), audit log truy cập.
- PII tối thiểu trong log; che mờ thông tin nhạy cảm.
- Chính sách consent: lý do dùng dữ liệu, opt-out phân tích học tập.
- Lưu trữ/retention: xóa/ẩn danh theo yêu cầu.

-----------------------------
9) DevOps, CI/CD, phát hành
-----------------------------
- CI: lint, typecheck, unit test, E2E Detox (một số dòng chính).
- Mobile: Expo EAS build (staging/prod), TestFlight/Play Console, OTA updates (EAS Update).
- Backend: Spring Boot deploy (Fly.io/Render/VPS/Cloud Run). Có thể giữ /api/chat VVPS.
- Secrets: GitHub Envs, Vercel/Expo Secrets, không hardcode.
- Quan trắc: Sentry/Crashlytics, Logs; dashboard uptime.

------------------------------------
10) Chiến lược kiểm thử & đo lường
------------------------------------
- Test chức năng: luồng FR1–FR3 end-to-end.
- Test tải: /api/learning-path, /api/quizzes.
- Khả dụng: cold start, tốc độ render, Time-to-Interactive.
- Số liệu sản phẩm:
  - Tỉ lệ hoàn tất onboarding, tạo plan kỳ, dùng quiz, nhắn advisor, cảnh báo được xem.
  - CSAT cho câu trả lời Chatbot và chất lượng khuyến nghị.

------------------------------------------
11) Definition of Done (DoD) cho bản v1
------------------------------------------
- Ứng dụng build được trên iOS/Android (staging/prod), crash-free rate ≥ 99.5%.
- FR3.1, FR3.2, FR1.1, FR1.3 (MVP), FR2.1 hoàn thiện theo acceptance criteria.
- Telemetry và dashboard analytics hoạt động; tài liệu hướng dẫn triển khai/ops.
- Chính sách bảo mật/riêng tư hiển thị trong app; consent thu thập dữ liệu.

---------------------------------------------
12) Nhân sự đề xuất & ước lượng thời gian
---------------------------------------------
- 1 Mobile Engineer (RN/Expo), 1 Backend Engineer (Node/Postgres), 1 AI/DS Engineer (RAG/RecSys), 1 QA, 0.5 PM/Designer.
- Thời gian:
  - Nền tảng + Chat: 3–4 tuần
  - FR1: 2–3 tuần
  - FR2: 2–3 tuần
  - Theo dõi & can thiệp: 2 tuần
  - Tổng: 9–12 tuần (tuỳ mức độ tinh chỉnh, phê duyệt store).

-------------------------
13) Checklist triển khai nhanh
-------------------------
- [ ] Chọn RN + Expo, khởi tạo repo apps/mobile, cấu hình EAS.
- [ ] Thiết lập SSO/đăng nhập cơ bản; lưu token an toàn.
- [ ] Tích hợp /api/chat → Chatbot AI (sessionId).
- [ ] Tích hợp chat advisor (Firebase/Stream) + push.
- [ ] Nhập dữ liệu chương trình/tiên quyết (CSV → Postgres), build graph.
- [ ] API /api/learning-path (topo + ràng buộc), UI lộ trình.
- [ ] Màn lập kế hoạch học kỳ (thêm/xoá môn, cảnh báo).
- [ ] Gợi ý chuyên ngành MVP, wizard chọn chuyên ngành.
- [ ] Quiz thích ứng (MVP) + lưu Attempt.
- [ ] Dashboard tiến độ + cảnh báo sớm.
- [ ] Monitoring (Sentry/Crashlytics) + analytics.
- [ ] Chuẩn bị tài liệu phát hành, chính sách riêng tư, store listing.

Phụ lục: Tận dụng repo hiện có
- Webapp/Server hiện có đã có:
  - Serverless /api/chat (Vercel) và server proxy Express (server/server.js).
  - Webapp mẫu gọi /api/chat, lưu sessionId.
  - n8n workflow rag-ai-agent-nttu254.json (RAG + Gemini + Supabase).
- Mobile v1 có thể tái dùng /api/chat cho FR3.1; mở rộng backend dần cho các FR khác.