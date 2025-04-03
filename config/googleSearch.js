import { google } from 'googleapis';
import axios from 'axios';
import 'dotenv/config.js';
import nlp from 'compromise';
import translate from 'google-translate-api-x';

async function translateToEnglish(text) {
    try {
        // Cú pháp có thể khác tùy thư viện
        const res = await translate(text, { from: 'vi', to: 'en' });
        return res.text;
    } catch (error) {
        console.error('Translation error:', error.message);
        return text;
    }
}

async function extractKeywords(question) {
    try {
        const translatedQuestion = await translateToEnglish(question);
        
        const cleanQuestion = translatedQuestion.replace(/[^\w\s]/g, '');
        
        const doc = nlp(cleanQuestion);
        
        const nouns = doc.match('#Noun').out('array');
        const properNouns = doc.match('#ProperNoun').out('array'); 
        const adjectives = doc.match('#Adjective').out('array');
        
        const allWords = [...new Set([...properNouns, ...nouns, ...adjectives])];
        
        const stopWords = ['a', 'an', 'the', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were'];
        const filteredWords = allWords.filter(word => 
            !stopWords.includes(word.toLowerCase()) && word.length > 1
        );
        const resultString = filteredWords.join(" and ");
        console.log("Extracted keywords:", resultString);
        
        if (filteredWords.length === 0) {
            return cleanQuestion;
        }
        
        return resultString;
    } catch (error) {
        console.error('Keyword extraction error:', error.message);
        return question;
    }
}

export async function fetchImage(prompt) {
    const customsearch = google.customsearch('v1');
    const API_KEY = process.env.GG_SEARCH_API_KEY; 
    const CX = process.env.GG_SEARCH_CX;   
    const keyword = await extractKeywords(prompt);
    console.log("cau hoi:" + keyword);
    try {
        const response = await customsearch.cse.list({
            auth: API_KEY,
            cx: CX,
            q: keyword,
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