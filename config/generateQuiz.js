import 'dotenv/config.js';
import axios from 'axios';
import { PDFExtract } from 'pdf.js-extract';
import fs from 'fs';
import path from 'path';
import { createWorker } from 'tesseract.js';
import {fetchImage} from './googleSearch.js';
// Khắc phục lỗi file test của pdf-parse
const testDir = path.join(process.cwd(), 'backend', 'test', 'data');
const testFile = path.join(testDir, '05-versions-space.pdf');

try {
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  if (!fs.existsSync(testFile)) {
    // Tạo file PDF đơn giản
    const simplePdf = '%PDF-1.3\n1 0 obj\n<< >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF';
    fs.writeFileSync(testFile, simplePdf);
  }
} catch (err) {
  console.error("Could not create test file:", err);
}

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Khởi tạo PDFExtract
const pdfExtract = new PDFExtract();

// Thay thế hàm extractTextFromPDF
export async function extractTextFromPDF(pdfBuffer) {
  try {
    if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
      console.error("Invalid PDF buffer provided");
      return "Invalid PDF format";
    }
    
    console.log("📄 Processing PDF buffer of size:", pdfBuffer.length, "bytes");
    
    // try {
    //   // Bước 1: Trích xuất với pdf.js-extract
    //   const options = {};
    //   const data = await pdfExtract.extractBuffer(pdfBuffer, options);
      
    //   let extractedText = '';
      
    //   if (data && data.pages) {
    //     // Nối văn bản từ tất cả các trang
    //     data.pages.forEach(page => {
    //       page.content.forEach(item => {
    //         extractedText += item.str + ' ';
    //       });
    //       extractedText += '\n\n';
    //     });
    //   }
      
    //   console.log(`📊 Text length from PDF.js: ${extractedText.length} characters`);
      
    //   // Nếu trích xuất được ít hơn 100 ký tự, có thể đây là PDF scan
    //   if (extractedText.length < 100) {
    //     console.log("⚠️ PDF có thể là scan, sử dụng phương pháp dự phòng...");
        
    //     // Trả về thông tin tạm thời để không làm dừng quy trình
    //     return `Đây có thể là PDF scan hoặc được bảo vệ. 
    //     Vui lòng thử một file PDF khác có thể trích xuất được text, 
    //     hoặc tạo câu hỏi về chủ đề chung thay vì từ nội dung PDF.`;
    //   }
      
    //   console.log("✅ Successfully extracted text from PDF");
      
    //   // Lưu text vào file để kiểm tra
    //   fs.writeFileSync('extracted_text.txt', extractedText);
    //   console.log("💾 Saved extracted text to 'extracted_text.txt' for inspection");
      
    //   // In ra một phần của text để kiểm tra
    //   console.log("👀 Extract preview:", extractedText.substring(0, 200) + "...");
      
    //   return extractedText;
    try {
      const questionsWithImages = await Promise.all(
        parsedQuestions.map(async (question, index) => {
          try {
            // Tạo chuỗi tìm kiếm dựa trên nội dung câu hỏi
            const searchQuery = question.question.split(' ').slice(0, 6).join(' ');
            console.log(`🔍 Tìm hình ảnh cho câu hỏi PDF ${index + 1}: "${searchQuery}"`);
            
            // Gọi API tìm hình ảnh
            const imageResult = await fetchImage(searchQuery);
            
            if (imageResult && imageResult.url) {
              console.log(`✅ Đã tìm thấy hình ảnh cho câu hỏi PDF ${index + 1}`);
              return {
                ...question,
                imageUrl: imageResult.url
              };
            }
            
            return question;
          } catch (imageError) {
            console.error(`❌ Lỗi khi tìm hình ảnh cho câu hỏi PDF ${index + 1}:`, imageError.message);
            return question;
          }
        })
      );
      
      return questionsWithImages;
    } catch (pdfError) {
      console.error("Error parsing PDF:", pdfError);
      
      return "Không thể trích xuất nội dung từ PDF. Đây có thể là PDF được scan hoặc bảo vệ.";
    }
  } catch (error) {
    console.error("❌ Error handling PDF:", error);
    return "Error processing PDF file";
  }
}

export async function generateQuizGroqToJSON(topic, questionTypes, numberOfQuestions, difficulty) {
  try {
    const prompt = `
      Hãy tạo một bài quiz gồm ${numberOfQuestions} câu hỏi về chủ đề "${topic}".
      Yêu cầu:
      - Các loại câu hỏi: ${questionTypes.join(', ')}.
      - Độ khó: ${difficulty}.
      
      Mỗi câu hỏi cần định dạng JSON như sau:
      {
        "question": "Nội dung câu hỏi",
        "type": "Loại câu hỏi (one answer,điền vào chỗ trống,đúng/sai,Multiple choices,Number response,Writing response)",
        "difficulty": "Mức độ (dễ/trung bình/khó)",
        "choices": [
          {
            "text": "Đáp án A",
            "isCorrect": false
          },
          {
            "text": "Đáp án B",
            "isCorrect": false
          },
          {
            "text": "Đáp án C",
            "isCorrect": false
          },
          {
            "text": "Đáp án D",
            "isCorrect": true
          }
        ],
        "explanation": "Giải thích ngắn gọn cho đáp án"
      }
      
      Lưu ý quan trọng:
      1. Trả về một mảng JSON hợp lệ, không có văn bản bổ sung
      2. Đối với câu hỏi TRẮC NGHIỆM hoặc ONE ANSWER: Phải có trường "choices" là một mảng các lựa chọn, mỗi lựa chọn có "text" và "isCorrect"
      3. Đối với câu hỏi ĐÚNG/SAI: Trường "choices" sẽ gồm 2 option { "text": "Đúng", "isCorrect": true/false } và { "text": "Sai", "isCorrect": true/false }
      4. Đối với câu hỏi ĐIỀN VÀO CHỖ TRỐNG hoặc NUMBER RESPONSE: Không cần "choices" nhưng phải có thêm trường "answer" chứa đáp án đúng
      5. Đối với WRITING RESPONSE: Không cần "choices" nhưng có thể có "answer" là gợi ý đáp án
      
      Trả về kết quả là một mảng JSON hợp lệ, không có thêm văn bản hay giải thích nào khác.
    `;

    console.log("🔹 Đang gửi prompt cho Groq...");
    
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2048
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = response.data.choices[0].message.content;
    console.log("✅ Nhận phản hồi từ Groq");

    try {
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      let parsedData;
      
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
        console.log(`📊 Đã parse ${parsedData.length} câu hỏi từ phản hồi`);
      } else {
        parsedData = JSON.parse(result);
        console.log(`📊 Đã parse dữ liệu từ phản hồi`);
      }
      
      // Thêm ảnh cho từng câu hỏi (xử lý bất đồng bộ)
      const questionsWithImages = await Promise.all(
        parsedData.map(async (question, index) => {
          try {
           
            const imageResult = await fetchImage(question.question, topic);
            
            if (imageResult && imageResult.url) {
              console.log(`✅ Đã tìm thấy hình ảnh cho câu hỏi ${index + 1}`);
              return {
                ...question,
                imageUrl: imageResult.url
              };
            }
            
            return question;
          } catch (imageError) {
            console.error(`❌ Lỗi khi tìm hình ảnh cho câu hỏi ${index + 1}:`, imageError.message);
            return question;
          }
        })
      );
      
      return {
        questions: questionsWithImages
      };
    } catch (parseError) {
      console.error("❌ Lỗi khi parse JSON:", parseError);
      console.error("💬 Phản hồi gốc:", result);
      
      return {
        questions: [
          {
            question: "Có vấn đề khi parse JSON. Đây là câu hỏi mẫu thay thế.",
            type: "Multiple choices",
            difficulty: "trung bình",
            choices: [
              { text: "Lựa chọn A", isCorrect: false },
              { text: "Lựa chọn B", isCorrect: true },
              { text: "Lựa chọn C", isCorrect: false },
              { text: "Lựa chọn D", isCorrect: false }
            ],
            explanation: "Đây là câu hỏi mẫu do không thể parse phản hồi từ Groq."
          }
        ]
      };
    }
   
  } catch (error) {
    console.error("❌ Lỗi khi gọi Groq hoặc parse JSON:", error.message);
    return {
      questions: []
    };
  }
}

// Hàm tạo quiz từ văn bản
export async function generateQuizFromText(text, numberOfQuestions = 5, difficulty = 'trung bình') {
  try {
    
    
    // Kiểm tra text
    if (!text || typeof text !== 'string' || text.length < 100) {
      console.warn("⚠️ Text is too short or invalid");
      return generateSampleQuestions(difficulty);
    }
    
    // Tạo prompt 
    const prompt = `
      Hãy tạo ${numberOfQuestions} câu hỏi dạng trắc nghiệm dựa trên nội dung sau:
      
      """
      ${text.substring(0, 5000)} ${text.length > 5000 ? '... (văn bản đã được cắt ngắn)' : ''}
      """
      
      Mỗi câu hỏi cần định dạng JSON như sau:
      {
        "question": "Nội dung câu hỏi",
        "type": "Multiple choices",
        "difficulty": "${difficulty}",
        "choices": [
          {
            "text": "Đáp án A",
            "isCorrect": false
          },
          {
            "text": "Đáp án B",
            "isCorrect": false
          },
          {
            "text": "Đáp án C",
            "isCorrect": false
          },
          {
            "text": "Đáp án D",
            "isCorrect": true
          }
        ],
        "explanation": "Giải thích ngắn gọn cho đáp án"
      }
      
      Lưu ý quan trọng:
      1. Trả về một mảng JSON hợp lệ, BẮT ĐẦU BẰNG '[' và KẾT THÚC BẰNG ']'
      2. Không có văn bản bổ sung, chỉ trả về mảng JSON
      3. Mỗi câu hỏi phải có 4 lựa chọn, trong đó chỉ có 1 lựa chọn đúng
    `;
    
    console.log("🔹 Đang gửi prompt để tạo quiz từ văn bản...");
    
    // Gọi API
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2048
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Xử lý phản hồi
    const result = response.data.choices[0].message.content;
    console.log("✅ Nhận phản hồi từ Groq, độ dài:", result.length, "ký tự");
    
    try {
      // Tìm mảng JSON trong phản hồi
      let jsonData;
      
      // Kiểm tra xem kết quả có dạng array không
      if (result.trim().startsWith('[') && result.trim().endsWith(']')) {
        console.log("🔍 Phản hồi có định dạng mảng JSON, thử parse");
        jsonData = JSON.parse(result);
      } else {
        // Tìm mảng JSON bằng regex
        const jsonMatch = result.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          console.log("🔍 Tìm thấy mảng JSON trong phản hồi");
          jsonData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Không tìm thấy mảng JSON hợp lệ trong phản hồi");
        }
      }
      
      if (Array.isArray(jsonData) && jsonData.length > 0) {
        console.log(`✅ Đã parse được ${jsonData.length} câu hỏi`);
        return jsonData;
      } else {
        throw new Error("Dữ liệu phân tích không phải là mảng hợp lệ");
      }
    } catch (parseError) {
      console.error("❌ Lỗi khi parse JSON:", parseError);
      console.log("💬 Đoạn đầu phản hồi:", result.substring(0, 200));
      
      return generateSampleQuestions(difficulty);
    }
  } catch (error) {
    console.error("❌ Lỗi khi tạo quiz từ text:", error);
    return generateSampleQuestions(difficulty);
  }
}

function generateSampleQuestions(difficulty) {
  console.log("🔄 Tạo câu hỏi mẫu với độ khó:", difficulty);
  
  return [
    {
      question: "Đây là câu hỏi mẫu về tài liệu PDF.",
      type: "Multiple choices",
      difficulty: difficulty,
      choices: [
        { text: "Đáp án A", isCorrect: false },
        { text: "Đáp án B", isCorrect: true },
        { text: "Đáp án C", isCorrect: false },
        { text: "Đáp án D", isCorrect: false }
      ],
      explanation: "Đây là câu hỏi mẫu do không thể parse kết quả từ mô hình."
    },
    {
      question: "Đây là câu hỏi mẫu thứ hai.",
      type: "Multiple choices",
      difficulty: difficulty,
      choices: [
        { text: "Lựa chọn 1", isCorrect: false },
        { text: "Lựa chọn 2", isCorrect: false },
        { text: "Lựa chọn 3", isCorrect: true },
        { text: "Lựa chọn 4", isCorrect: false }
      ],
      explanation: "Đây là giải thích mẫu cho câu hỏi thứ hai."
    }
  ];
}