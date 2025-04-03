

export const createQuizFunctionDeclaration = {
    name: "createQuiz",
    description: "Tạo bài quiz dựa trên các chủ đề và loại câu hỏi mà người dùng cung cấp",
    parameters: {
      type: "object",
      properties: {
        topics: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Danh sách các chủ đề mà bài quiz sẽ tập trung vào, ví dụ: Toán học, Lịch sử, Khoa học."
        },
        questionTypes: {
          type: "array",
          items: {
            type: "string",
            enum: ["one answer", "điền vào chỗ trống", "đúng/sai", "Multiple choices", "Number response", "Writing response"],
          },
          description: "Các loại câu hỏi sẽ xuất hiện trong bài quiz, ví dụ:  điền vào chỗ trống."
        },
        numberOfQuestions: {
          type: "integer",
          description: "Số lượng câu hỏi trong bài quiz.",
          minimum: 1
        },
        difficulty: {
            type: "string",
            description: "Độ khó của bài thi (dễ/trung bình/khó/rất khó).",
          },
      },
      required: ["topics", "questionTypes", "numberOfQuestions","difficulty"]
    }
  };