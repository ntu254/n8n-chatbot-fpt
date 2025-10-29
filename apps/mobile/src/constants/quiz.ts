export const QUIZ_CONFIG = {
  TOTAL_QUESTIONS: 5,
  LOADING_DELAY: 100, // ms - delay rất ngắn để UI mượt mà
  MAX_RESULTS_DISPLAY: 4
};

export const QUIZ_MESSAGES = {
  TITLE: "Quiz phân tích ngành học phù hợp",
  DESCRIPTION: "Trả lời 5 câu hỏi để tìm hiểu ngành học phù hợp với bạn nhất!",
  START_BUTTON: "Bắt đầu Quiz",
  RESTART_BUTTON: "Làm lại Quiz",
  STOP_BUTTON: "Dừng Quiz",
  RESULTS_TITLE: "🎉 Kết quả phân tích ngành học",
  TOP_RESULT_LABEL: "Ngành học phù hợp nhất:",
  OTHER_RESULTS_LABEL: "Các ngành khác phù hợp:",
  LOADING_RESULTS: "Đang phân tích kết quả...",
  LOADING_QUESTIONS: "Đang tải câu hỏi...",
  ERROR_CALCULATION: "Không thể tính toán kết quả. Vui lòng thử lại.",
  DETAILED_INFO_TITLE: "Thông tin chi tiết:",
  SALARY_LABEL: "Mức lương",
  JOB_MARKET_LABEL: "Thị trường việc làm",
  SKILLS_LABEL: "Kỹ năng cần có"
};

export const QUIZ_STYLES = {
  COLORS: {
    BACKGROUND: "#0b1220",
    CARD_BACKGROUND: "#111827",
    BORDER: "#1f2937",
    TEXT_PRIMARY: "#e5e7eb",
    TEXT_SECONDARY: "#9ca3af",
    PRIMARY: "#10b981",
    SECONDARY: "#2563eb",
    SUCCESS: "#065f46",
    CHOICE_BACKGROUND: "#374151",
    CHOICE_BORDER: "#4b5563"
  },
  BORDER_RADIUS: {
    SMALL: 8,
    MEDIUM: 10,
    LARGE: 12
  },
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 12,
    LG: 16,
    XL: 20,
    XXL: 24
  }
};