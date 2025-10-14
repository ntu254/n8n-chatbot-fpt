# Kế hoạch triển khai Mobile App — AI-Powered Adaptive Learning System

Tài liệu này tổng hợp công việc cần làm để xây dựng ứng dụng di động cho hệ thống “AI-Powered Adaptive Learning System” (Cố vấn học tập ảo), bám sát các nhóm yêu cầu chức năng đã nêu (FR1–FR3) và ba trụ cột: Lập kế hoạch & Cá nhân hoá, Hỗ trợ & Tương tác, Theo dõi & Can thiệp.

Mục tiêu v1: ra mắt ứng dụng mobile có Chatbot AI (FR3.1), kênh nhắn cố vấn con người (FR3.2), khuyến nghị chuyên ngành cơ bản (FR1.1), lộ trình học tự động ở mức MVP (FR1.3), công cụ lập kế hoạch học kỳ (FR2.1). Các tính năng còn lại (FR1.2, FR2.2, FR2.3, theo dõi rủi ro) triển khai theo các mốc tiếp theo.

--------------------------------
1) Lựa chọn công nghệ & nguyên tắc
--------------------------------
- Nền tảng mobile: React Native + TypeScript (ưu tiên Expo EAS để tăng tốc build/distribution). Lý do:
  - Tận dụng kiến thức JS/TS sẵn có (repo hiện có webapp JS + Node server).
  - Hệ sinh thái phong phú: navigation, state management, UI kit, MMKV/AsyncStorage, SQLite/WatermelonDB/Realm.
  - CI/CD dễ với EAS, TestFlight/Play Console.
- Backend/API:
  - Giai đoạn đầu: tái sử dụng proxy n8n hiện có (/api/chat) để chatbot hoạt động nhanh.
  - Bổ sung dần các dịch vụ riêng: User/Profile, Curriculum (khóa học/tiên quyết), Recommendation/Planning, Quiz, Messaging, Notification.
  - CSDL: Postgres (có thể dùng Supabase để tăng tốc), tận dụng pgvector nếu cần RAG nội bộ.
- AI & RAG:
  - Duy trì n8n workflow RAG hiện có (rag-ai-agent-nttu254.json) để trả lời kiến thức chương trình/khoa.
  - Bổ sung công cụ/“tool” cho agent: tra cứu đồ thị tiên quyết, tối ưu thời khóa biểu, khuyến nghị chuyên ngành.
  - Embedding/LLM: Gemini/OpenAI; vector store: Supabase pgvector (đang dùng).
- Bảo mật & tuân thủ:
  - Lưu trữ tối thiểu PII trên thiết bị, mã hoá secret (SecureStore/MMKV).
  - TLS bắt buộc; không ghi log thông tin nhạy cảm; RBAC cho cố vấn/giảng viên.
  - Chính sách consent, data retention.

-------------------------
2) Kiến trúc tổng thể (draft)
-------------------------
- Mobile App (RN/Expo):
  - Tầng UI: màn hình Onboarding, Hồ sơ/Sở thích/Mục tiêu, Khuyến nghị chuyên ngành, Lộ trình học, Lập kế hoạch học kỳ, Môn học chi tiết, Quiz thích ứng, Chat (AI + người), Dashboard tiến độ.
  - State: Zustand/Redux Toolkit; React Query cho data fetching/cache.
  - Storage: SecureStore (token), MMKV/AsyncStorage, SQLite cho offline plan/quiz.
  - Notifications: FCM/APNs (Expo Notifications).
- Backend Services:
  - Gateway/Proxy: hiện có /api/chat (Vercel/Express). Mở rộng: /api/auth, /api/students, /api/curriculum, /api/recommendations, /api/learning-path, /api/plans, /api/courses, /api/quizzes, /api/messages, /api/alerts.
  - Core data: Postgres + Prisma (hoặc Supabase).
  - Messaging: dùng dịch vụ có sẵn (Firebase/Stream) hoặc build chat đơn giản (REST + polling/Socket).
  - Scheduler/Workers: đồng bộ SIS, tính toán lộ trình, cảnh báo sớm.
- AI Layer:
  - N8N orchestrator + vector DB Supabase (đang có).
  - Các “tool” domain: course_catalog_search, prerequisite_graph_query, schedule_optimizer, specialization_ranker.
  - Sau v1: cân nhắc LangGraph/LangChain Server cho logic phức tạp hơn.
- Quan trắc:
  - Crashlytics/Sentry, Logtail/ELK, Prometheus/Grafana (backend), PostHog/Amplitude (hành vi người dùng).

-----------------------------------------
3) Lộ trình triển khai theo giai đoạn (8–12 tuần)
-----------------------------------------
Giai đoạn 0 — Nền tảng (1–2 tuần)
- Mobile:
  - Khởi tạo dự án RN + TS (Expo), thiết lập EAS, gói UI (React Native Paper/Tamagui/NativeWind).
  - Navigation (React Navigation), theme light/dark, i18n (vi/en).
  - Thiết lập React Query, Zustand/Redux, cấu trúc thư mục, lint/format, module alias.
  - Tích hợp Sentry/Crashlytics, PostHog/Amplitude.
- Backend:
  - Chuẩn hoá proxy /api/chat hiện có cho mobile (CORS, rate limit).
  - Xây base repo cho API riêng (Node/Express/NestJS) hoặc mở rộng server/ hiện tại; thêm OpenAPI.
- DevOps/QA:
  - CI (GitHub Actions) cho lint, build, tests; EAS build preview; TestFlight/Closed testing.

Giai đoạn 1 — FR3: Chat & tương tác (2–3 tuần)
- FR3.1 Chatbot AI:
  - Mobile: UI chat (bubbles, streaming/SSE fallback, xử lý JSON/text), sessionId ổn định.
  - Gọi /api/chat (proxy tới n8n). Nếu cần streaming: bổ sung endpoint SSE ở backend để wrap n8n.
- FR3.2 Nhắn cố vấn người:
  - MVP: tích hợp Firebase/Stream Chat SDK (kênh 1–1 với advisor), đồng bộ danh tính sinh viên.
  - Lưu lịch sử, push notification khi advisor phản hồi.
- Chấp nhận:
  - Chatbot trả lời tài liệu RAG, giữ ngữ cảnh theo session; người dùng gửi file (sau v1).

Giai đoạn 2 — FR1: Tư vấn ở cấp chương trình (2–3 tuần)
- FR1.1 Khuyến nghị chuyên ngành:
  - Onboarding thu thập: điểm số, sở thích, mục tiêu; baseline heuristic + LLM reasoning để xếp hạng chuyên ngành (AI/IoT/SE/Biz IT).
- FR1.2 Gợi ý minor/tổ hợp môn (MVP, nếu kịp):
  - Sử dụng quy tắc + embedding cho gần đúng hướng nghề nghiệp.
- FR1.3 Sinh lộ trình học toàn chương trình:
  - Dữ liệu: đồ thị tiên quyết môn (Directed Acyclic Graph). Thuật toán: topo sort + ràng buộc tải học (tối ưu hoá số tín chỉ/ học kỳ).
  - API: POST /api/learning-path → danh sách học kỳ và môn đề xuất.
- Chấp nhận:
  - Màn wizard hiển thị top-3 chuyên ngành; lộ trình học tự động hợp lệ tiên quyết.

Giai đoạn 3 — FR2: Cá nhân hoá chiến lược học (2–3 tuần)
- FR2.1 Lập kế hoạch học kỳ:
  - UI kéo/thả (hoặc chọn), cân bằng tín chỉ, kiểm tra tiên quyết, cảnh báo xung đột.
- FR2.2 Gợi ý phương pháp & tài liệu (per-course):
  - Dựa trên kết quả trước đó và hồ sơ, list tài nguyên phù hợp (RAG + rules).
- FR2.3 Quiz thích ứng (MVP):
  - Thuật toán: difficulty ladder/IRT đơn giản, chọn câu hỏi kế tiếp theo khả năng ước lượng.
  - Lưu Attempt, ước lượng competency theo skill tag.
- Chấp nhận:
  - Kế hoạch học kỳ hợp lệ; quiz điều chỉnh độ khó sau mỗi câu.

Giai đoạn 4 — Theo dõi & can thiệp (2 tuần)
- Telemetry tiến độ (điểm, hoàn thành môn, on-track/at-risk).
- Cảnh báo sớm: trigger khi GPA giảm, fail pre-req, bỏ lịch học.
- Dashboard: cho sinh viên và cố vấn (màn mobile + trang web quản trị đơn giản).
- Chấp nhận:
  - Push cảnh báo + mục “Rủi ro” trong Dashboard.

-----------------------------------
4) Backlog chi tiết theo từng FR
-----------------------------------
FR1.1 — Khuyến nghị chuyên ngành
- Acceptance criteria:
  - Sau onboarding, hệ thống gợi ý ≥3 chuyên ngành có điểm tin cậy.
  - Cho phép người dùng chọn/khóa chuyên ngành.
- API (draft):
  - POST /api/recommendations/specialization {profile} → {ranked_specializations: [{code, score, rationale}]}
- Dữ liệu/Model:
  - Feature: GPA, điểm môn liên quan, sở thích, mục tiêu nghề.
  - Baseline: heuristic + LLM reasoning; sau v1: mô hình học máy.

FR1.2 — Gợi ý tổ hợp môn/minor
- Acceptance:
  - Đề xuất tổ hợp phù hợp chuyên ngành đã chọn và định hướng nghề.
- API:
  - GET /api/recommendations/minors?specialization=AI&amp;goal=DataScientist

FR1.3 — Sinh lộ trình học toàn chương trình
- Acceptance:
  - Lộ trình đảm bảo tiên quyết, tải học hợp lý (ví dụ 14–20 tín chỉ/kỳ), có lý do/giải thích.
- API:
  - POST /api/learning-path {studentId, constraints} → {semesters: [{term, courses: []}], notes}
- Thuật toán:
  - Topological sort trên đồ thị tiên quyết + ràng buộc tối ưu hoá đơn giản (ILP/heuristic).

FR2.1 — Lập kế hoạch học kỳ
- Acceptance:
  - UI chọn môn theo gợi ý; cảnh báo khi vi phạm tiên quyết/xung đột.
- API:
  - POST /api/plans {studentId, term, courses[]} → {planId}
  - GET /api/plans/:id

FR2.2 — Gợi ý phương pháp/tài liệu theo môn
- Acceptance:
  - Mỗi môn hiển thị phương pháp học, tài liệu ưu tiên theo hồ sơ.
- API:
  - GET /api/courses/:code/recommendations?studentId=...

FR2.3 — Quiz thích ứng
- Acceptance:
  - 10–15 câu/quiz, độ khó điều chỉnh theo kết quả; đánh giá competency.
- API:
  - POST /api/quizzes/start {course, skillTags[]}
  - POST /api/quizzes/answer {quizId, questionId, answer} → {nextQuestion, updatedAbility}

FR3.1 — Chatbot AI 24/7
- Acceptance:
  - Trả lời chính xác theo tài liệu; hiển thị nguồn trích dẫn nếu có.
- API hiện có:
  - POST /api/chat {chatInput, sessionId} → n8n RAG workflow.

FR3.2 — Kênh chat với cố vấn người
- Acceptance:
  - Nhắn 1–1, push khi có phản hồi; log hội thoại.
- Tích hợp:
  - Firebase/Stream Chat SDK hoặc backend WebSocket + REST lưu trữ.

---------------------------------
5) Thiết kế màn hình (mobile MVP)
---------------------------------
- Onboarding (3–5 bước): thông tin cá nhân, mục tiêu, sở thích, kết quả hiện có.
- Trang chủ: quick actions, tiến độ, cảnh báo, lối tắt chat.
- Khuyến nghị chuyên ngành: danh sách xếp hạng + giải thích.
- Lộ trình học (Program plan): danh sách học kỳ → chi tiết kỳ → danh sách môn.
- Lập kế hoạch học kỳ: chọn môn, xem tín chỉ/tải học, cảnh báo tiên quyết.
- Chi tiết môn: mục tiêu, tài liệu, phương pháp đề xuất, quiz entry.
- Quiz thích ứng: màn câu hỏi/đáp án, tiến trình, kết quả năng lực.
- Chat: tab AI và tab cố vấn người; lịch sử hội thoại.
- Dashboard tiến độ: GPA, số tín chỉ, môn rủi ro, to-do.
- Cài đặt/Tài khoản: ngôn ngữ, thông báo, quyền riêng tư.

------------------------------------
6) Thiết kế API và dữ liệu (draft)
------------------------------------
Thực thể chính:
- Student(id, name, email, major, goals, interests, gpa, risk_level)
- AcademicRecord(student_id, course_code, term, grade, status)
- Course(code, title, credits, description, tags[])
- Prerequisite(course_code, requires_course_code)
- Specialization(code, name, rules)
- LearningPath(student_id, semesters[])
- Plan(plan_id, student_id, term, items: [{course_code, source: recommended|manual}])
- Quiz(quiz_id, course_code, skill_tags[])
- Question(id, skill_tag, difficulty, stem, choices[], answer)
- Attempt(quiz_id, student_id, question_id, is_correct, ability_estimate)
- Message(thread_id, sender, text, created_at)
- Alert(student_id, type, severity, created_at, payload)

Endpoint (ví dụ):
- POST /api/auth/login
- GET /api/students/me
- GET /api/curriculum/courses
- POST /api/recommendations/specialization
- POST /api/learning-path
- POST /api/plans
- GET /api/quizzes/start / answer
- POST /api/messages/send
- GET /api/alerts

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
- Backend: Vercel (serverless) cho /api/chat; dịch vụ API riêng trên Fly.io/Render/VPS.
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