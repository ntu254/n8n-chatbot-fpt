import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from "react-native";
import { useQuiz } from "../src/hooks/useQuiz";
import { QUIZ_MESSAGES, QUIZ_STYLES } from "../src/constants/quiz";

// Component cho các button với hover effect
const AnimatedButton = ({ 
  style, 
  textStyle, 
  onPress, 
  children,
  variant = 'primary'
}: { 
  style: any, 
  textStyle: any, 
  onPress: () => void, 
  children: React.ReactNode,
  variant?: 'primary' | 'secondary' | 'stop'
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getActiveStyle = () => {
    if (variant === 'secondary') {
      return {
        backgroundColor: "#1d4ed8",
        shadowColor: "#2563eb",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2
      };
    }
    if (variant === 'stop') {
      return {
        backgroundColor: "#b91c1c",
        shadowColor: "#dc2626",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2
      };
    }
    return styles.buttonActive;
  };

  const buttonStyle = [
    style,
    (isPressed || isHovered) && getActiveStyle()
  ];

  // Props cho web hover
  const webHoverProps = Platform.OS === 'web' ? {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  } : {};

  return (
    <TouchableOpacity
      style={buttonStyle}
      activeOpacity={0.8}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onPress={onPress}
      {...webHoverProps}
    >
      <Text style={textStyle}>{children}</Text>
    </TouchableOpacity>
  );
};
const ChoiceButton = ({ choice, index, onPress }: { 
  choice: any, 
  index: number, 
  onPress: (index: number) => void 
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const buttonStyle = [
    styles.choiceButton,
    (isPressed || isHovered) && styles.choiceButtonActive
  ];

  const textStyle = [
    styles.choiceText,
    (isPressed || isHovered) && styles.choiceTextActive
  ];

  const handlePress = () => {
    onPress(index);
  };

  // Props cho web hover
  const webHoverProps = Platform.OS === 'web' ? {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  } : {};

  return (
    <TouchableOpacity
      style={buttonStyle}
      activeOpacity={0.8}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onPress={handlePress}
      {...webHoverProps}
    >
      <Text style={textStyle}>{choice.text}</Text>
    </TouchableOpacity>
  );
};

export default function QuizScreen() {
  const {
    quizStarted,
    quizCompleted,
    results,
    loading,
    error,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    startQuiz,
    selectAnswer,
    restartQuiz,
    stopQuiz
  } = useQuiz();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{QUIZ_MESSAGES.TITLE}</Text>
      
      {!quizStarted ? (
        <View style={styles.startContainer}>
          <Text style={styles.description}>
            {QUIZ_MESSAGES.DESCRIPTION}
          </Text>
          <AnimatedButton
            style={styles.btn}
            textStyle={styles.btnText}
            onPress={startQuiz}
          >
            {QUIZ_MESSAGES.START_BUTTON}
          </AnimatedButton>
        </View>
      ) : quizCompleted ? (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>{QUIZ_MESSAGES.RESULTS_TITLE}</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{QUIZ_MESSAGES.LOADING_RESULTS}</Text>
            </View>
          ) : error ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{error}</Text>
              <AnimatedButton
                style={styles.restartBtn}
                textStyle={styles.restartBtnText}
                onPress={restartQuiz}
                variant="secondary"
              >
                {QUIZ_MESSAGES.RESTART_BUTTON}
              </AnimatedButton>
            </View>
          ) : results.length > 0 ? (
            <>
              <Text style={styles.topResultLabel}>{QUIZ_MESSAGES.TOP_RESULT_LABEL}</Text>
              <View style={styles.topResult}>
                <Text style={styles.topResultMajor}>{results[0]?.major || 'Không xác định'}</Text>
                <Text style={styles.topResultScore}>
                  Điểm phù hợp: {results[0]?.score || 0} ({results[0]?.percentage || 0}%)
                </Text>
                <Text style={styles.topResultDescription}>{results[0]?.description || 'Không có mô tả'}</Text>
                
                {results[0]?.detailedInfo && (
                  <View style={styles.detailedInfo}>
                    <Text style={styles.detailedInfoTitle}>{QUIZ_MESSAGES.DETAILED_INFO_TITLE}</Text>
                    <Text style={styles.detailedInfoText}>
                      • {QUIZ_MESSAGES.SALARY_LABEL}: {results[0].detailedInfo.averageSalary}
                    </Text>
                    <Text style={styles.detailedInfoText}>
                      • {QUIZ_MESSAGES.JOB_MARKET_LABEL}: {results[0].detailedInfo.jobMarket}
                    </Text>
                    <Text style={styles.detailedInfoText}>
                      • {QUIZ_MESSAGES.SKILLS_LABEL}: {results[0].detailedInfo.skills?.join(', ')}
                    </Text>
                  </View>
                )}
              </View>

              {results.length > 1 && (
                <>
                  <Text style={styles.otherResultsLabel}>{QUIZ_MESSAGES.OTHER_RESULTS_LABEL}</Text>
                  {results.slice(1, 4).map((result, index) => (
                    <View key={index} style={styles.resultItem}>
                      <Text style={styles.resultMajor}>{result.major}</Text>
                      <Text style={styles.resultScore}>
                        Điểm: {result.score} ({result.percentage}%)
                      </Text>
                      <Text style={styles.resultDescription}>{result.description}</Text>
                    </View>
                  ))}
                </>
              )}

              <AnimatedButton
                style={styles.restartBtn}
                textStyle={styles.restartBtnText}
                onPress={restartQuiz}
                variant="secondary"
              >
                {QUIZ_MESSAGES.RESTART_BUTTON}
              </AnimatedButton>
            </>
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>{QUIZ_MESSAGES.ERROR_CALCULATION}</Text>
              <AnimatedButton
                style={styles.restartBtn}
                textStyle={styles.restartBtnText}
                onPress={restartQuiz}
                variant="secondary"
              >
                {QUIZ_MESSAGES.RESTART_BUTTON}
              </AnimatedButton>
            </View>
          )}
        </View>
      ) : currentQuestion ? (
        <View style={styles.questionContainer}>
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>
                Câu {currentQuestionIndex + 1} / {totalQuestions}
              </Text>
              <AnimatedButton
                style={styles.stopBtn}
                textStyle={styles.stopBtnText}
                onPress={stopQuiz}
                variant="stop"
              >
                {QUIZ_MESSAGES.STOP_BUTTON}
              </AnimatedButton>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }
                ]} 
              />
            </View>
          </View>

          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
            
            <View style={styles.choicesContainer}>
              {currentQuestion.choices.map((choice, index) => (
                <ChoiceButton
                  key={index}
                  choice={choice}
                  index={index}
                  onPress={selectAnswer}
                />
              ))}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{QUIZ_MESSAGES.LOADING_QUESTIONS}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#0b1220", 
    padding: 12 
  },
  title: { 
    color: "#e5e7eb", 
    fontSize: 22, 
    fontWeight: "700", 
    marginBottom: 16,
    textAlign: "center"
  },
  
  // Start screen styles
  startContainer: {
    alignItems: "center",
    paddingVertical: 40
  },
  description: {
    color: "#9ca3af",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24
  },
  btn: { 
    backgroundColor: "#10b981", 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: 10,
    alignSelf: "center"
  },
  buttonActive: {
    backgroundColor: "#059669",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2
  },
  btnText: { 
    color: "#052e25", 
    fontWeight: "700",
    fontSize: 16
  },

  // Question screen styles
  questionContainer: {
    flex: 1
  },
  progressContainer: {
    marginBottom: 20
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  progressText: {
    color: "#9ca3af",
    fontSize: 14
  },
  progressBar: {
    height: 4,
    backgroundColor: "#374151",
    borderRadius: 2,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 2
  },
  stopBtn: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  stopBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600"
  },
  questionCard: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1f2937"
  },
  questionText: {
    color: "#e5e7eb",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    lineHeight: 26
  },
  choicesContainer: {
    gap: 12
  },
  choiceButton: {
    backgroundColor: "#374151",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4b5563"
  },
  choiceButtonActive: {
    backgroundColor: "#4b5563",
    borderColor: "#10b981",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2
  },
  choiceText: {
    color: "#e5e7eb",
    fontSize: 16,
    lineHeight: 22
  },
  choiceTextActive: {
    color: "#ffffff",
    fontWeight: "600"
  },

  // Results screen styles
  resultsContainer: {
    paddingVertical: 20
  },
  resultsTitle: {
    color: "#e5e7eb",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 30
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40
  },
  loadingText: {
    color: "#9ca3af",
    fontSize: 16
  },
  topResultLabel: {
    color: "#10b981",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12
  },
  topResult: {
    backgroundColor: "#065f46",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#10b981"
  },
  topResultMajor: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8
  },
  topResultScore: {
    color: "#6ee7b7",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8
  },
  topResultDescription: {
    color: "#d1fae5",
    fontSize: 14,
    lineHeight: 20
  },
  otherResultsLabel: {
    color: "#9ca3af",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12
  },
  resultItem: {
    backgroundColor: "#111827",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1f2937"
  },
  resultMajor: {
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4
  },
  resultScore: {
    color: "#9ca3af",
    fontSize: 12,
    marginBottom: 4
  },
  resultDescription: {
    color: "#9ca3af",
    fontSize: 14,
    lineHeight: 18
  },
  restartBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    alignSelf: "center",
    marginTop: 20
  },
  restartBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16
  },
  
  // Detailed info styles
  detailedInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#10b981"
  },
  detailedInfoTitle: {
    color: "#6ee7b7",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8
  },
  detailedInfoText: {
    color: "#d1fae5",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4
  }
});