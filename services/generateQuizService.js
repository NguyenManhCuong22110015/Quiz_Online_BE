import 'dotenv/config.js'; 
import {generateQuizGroqToJSON, extractTextFromPDF, generateQuizFromText} from "../config/generateQuiz.js"; 
import {GoogleGenerativeAI} from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.API);

const createQuizFunctionDeclaration = {
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
  const generativeModel = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro',
    tools: [
      {
        functionDeclarations: [createQuizFunctionDeclaration],
      },
    ],
  });
  
  async function setQuiz(topics, questionTypes, numberOfQuestions, difficulty) {
    console.log("💡 Topics:", topics);
    console.log("🎨Question Types:", questionTypes);
    console.log("Number Of Questions:", numberOfQuestions);
  
    return {
        topics,
        questionTypes,
        numberOfQuestions,
        difficulty
    };
  }

  const functions = {
    createQuiz: ({ topics, questionTypes, numberOfQuestions, difficulty }) => {
      return setQuiz(topics, questionTypes, numberOfQuestions, difficulty);
    },
  };
  
  export async function generateQuiz(prompt) {
    try {
      console.log("🔹 Khởi tạo chat với Gemini...");
      const chat = await generativeModel.startChat();
      
      console.log("🔹 Gửi prompt đến Gemini:", prompt);
      const result = await chat.sendMessage(prompt);

      const call = result.response.functionCalls()?.[0];

      if (call) {
        console.log("✅ Nhận function call từ Gemini:", call.name);
        
        const apiResponse = await functions[call.name](call.args);
        console.log("🔹 Gọi Groq API để tạo quiz...");
        
        return generateQuizGroqToJSON(apiResponse.topics, apiResponse.questionTypes, apiResponse.numberOfQuestions, apiResponse.difficulty);
      } else {
        console.log("❌ Không có function call nào được tạo!");
        
        // Tạo quiz mặc định nếu không có function call
        return generateQuizGroqToJSON(
          ["General Knowledge"], 
          ["Multiple choices"], 
          5, 
          "trung bình"
        );
      }
    } catch (error) {
      console.error("❌ Lỗi trong quá trình tạo quiz:", error);
      // Trả về mảng rỗng thay vì null
      return [];
    }
  }
  
  export async function generateQuizFromPDF(pdf) {
    try {
      console.log("🔹 Xử lý file PDF...");
      
      if (!pdf || !Buffer.isBuffer(pdf)) {
        console.error("❌ Buffer PDF không hợp lệ");
        return generateFallbackQuestions();
      }
      
      console.log(`📄 Kích thước buffer PDF: ${pdf.length} bytes`);
      
      // Trích xuất text từ PDF
      let text = await extractTextFromPDF(pdf);
      
      if (typeof text !== 'string' || text.length < 50 || 
          text.includes("Unable to extract") || 
          text.includes("Error processing PDF")) {
        console.warn("⚠️ Không thể trích xuất text hợp lệ từ PDF");
        return generateFallbackQuestions();
      }
      
      console.log(`📝 Đã trích xuất ${text.length} ký tự từ PDF`);
      
      // Tạo quiz từ text
      console.log("🔹 Tạo quiz từ văn bản...");
      const res = await generateQuizFromText(text);
      
      if (!res || !Array.isArray(res) || res.length === 0) {
        console.warn("⚠️ Không nhận được câu hỏi hợp lệ từ generateQuizFromText");
        return generateFallbackQuestions();
      }
      
      console.log(`✅ Đã tạo ${res.length} câu hỏi từ PDF`);
      return res;
    } catch (error) {
      console.error("❌ Lỗi khi tạo quiz từ PDF:", error);
      return generateFallbackQuestions();
    }
  }
  
  // Định nghĩa hàm generateFallbackQuestions nếu chưa có
  function generateFallbackQuestions() {
    return [
      {
        question: "Không thể xử lý file PDF. Đây là câu hỏi mẫu thay thế.",
        type: "Multiple choices",
        difficulty: "trung bình",
        choices: [
          { text: "PDF không hợp lệ", isCorrect: false },
          { text: "Định dạng file không được hỗ trợ", isCorrect: true },
          { text: "File quá lớn", isCorrect: false },
          { text: "File đã bị mã hóa", isCorrect: false }
        ],
        explanation: "Đây là câu hỏi mẫu do không thể xử lý file PDF."
      },
      {
        question: "Bạn có thể thử lại với file PDF khác không?",
        type: "Multiple choices",
        difficulty: "dễ",
        choices: [
          { text: "Có, tôi sẽ thử file khác", isCorrect: true },
          { text: "Không, tôi không có file khác", isCorrect: false },
          { text: "Tôi sẽ thử chuyển đổi file trước", isCorrect: false },
          { text: "Tôi muốn tạo quiz theo cách khác", isCorrect: false }
        ],
        explanation: "Thử lại với file PDF khác có thể giải quyết vấn đề."
      }
    ];
  }

