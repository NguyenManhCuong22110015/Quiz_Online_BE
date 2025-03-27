import weaviate from "weaviate-ts-client";

const client = weaviate.client({
  scheme: "http",
  host: "localhost:8080", 
});

async function createSchema() {
  await client.schema.classCreator().withClass({
    class: "QuizText",
    description: "Lưu trữ đoạn văn bản và embedding",
    vectorizer: "text2vec-openai", // Hoặc dùng "none" nếu tự tạo embedding
    properties: [
      {
        name: "text",
        dataType: ["string"],
        description: "Đoạn văn bản",
      },
    ],
  }).do();
}

createSchema();
