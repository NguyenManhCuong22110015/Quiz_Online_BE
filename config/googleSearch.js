import { google } from 'googleapis';
import axios from 'axios';
import 'dotenv/config.js';
import nlp from 'compromise';
function extractKeywords(question) {
    question = question.replace(/\?$/, ''); // Xóa dấu hỏi

    let doc = nlp(question);

    // Lấy danh từ + danh từ riêng
    let properNouns = doc.match('#ProperNoun').out('array');

    let keywords = [...properNouns]; 

    return keywords.join(' ');
}
export async function fetchImage(prompt) {
    const customsearch = google.customsearch('v1');
    const API_KEY = process.env.GG_SEARCH_API_KEY; 
    const CX = process.env.GG_SEARCH_CX;   
    console.log("cau hoi:" + extractKeywords(prompt));
    try {
        const response = await customsearch.cse.list({
            auth: API_KEY,
            cx: CX,
            q: extractKeywords(prompt),
            searchType: 'image',
            num: 1,
            imgSize: 'medium',
        });

        if (response.data.items && response.data.items.length > 0) {
            const imageUrl = response.data.items[0].link;
            
            // Tải hình ảnh
            const imageResponse = await axios.get(imageUrl, { 
                responseType: 'arraybuffer' 
            });
            
            // Trả về dữ liệu dạng Buffer
            // Buffer này có thể dễ dàng chuyển thành Blob ở phía client
            return {
                buffer: imageResponse.data,
                contentType: imageResponse.headers['content-type'] || 'image/jpeg',
                url: imageUrl
            };
        } else {
            console.error('No images found for the given prompt.');
            return null;
        }
    } catch (error) {
        console.error('Error fetching image:', error.message);
        return null;
    }
}