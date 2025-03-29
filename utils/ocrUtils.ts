import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import RNTesseractOcr from 'react-native-tesseract-ocr';


// Define the extracted data structure
export interface ExtractedWarrantyData {
  productName?: string;
  company?: string;
  purchaseDate?: string;
  expiryDate?: string;
  price?: string;
}


// Ensure Tesseract is initialized properly
const ocrConfig = {
  lang: 'eng',  // Language code (English)
};

/**
 * Process OCR text to extract warranty-related information
 * @param text The raw OCR text result
 * @returns Extracted warranty data
 */
export function processOcrText(text: string): ExtractedWarrantyData {
  // Initialize extracted data
  const extractedData: ExtractedWarrantyData = {};
  
  // If no text, return empty data
  if (!text || text.trim() === '') {
    return extractedData;
  }
  
  console.log('Processing OCR text:', text);
  
  // Split text into lines
  const allLines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Extract product name (usually appears with keywords like "item", "product", "description")
  const productNameKeywords = ['item', 'product', 'description', 'model'];
  for (const line of allLines) {
    const lowerLine = line.toLowerCase();
    for (const keyword of productNameKeywords) {
      if (lowerLine.includes(keyword) && lowerLine.includes(':')) {
        const parts = line.split(':');
        if (parts.length > 1) {
          extractedData.productName = parts[1].trim();
          break;
        }
      }
    }
    
    // If we found a product name, break out of the loop
    if (extractedData.productName) break;
  }
  
  // If no product name found with keywords, use heuristics
  // Often the product name is a longer line (more than 3 words) that doesn't contain common receipt words
  if (!extractedData.productName) {
    const commonReceiptWords = ['total', 'subtotal', 'tax', 'amount', 'payment', 'receipt', 'invoice', 'date', 'time', 'store', 'thank', 'you'];
    for (const line of allLines) {
      const words = line.split(' ').filter(word => word.length > 0);
      if (words.length >= 3 && words.length <= 8) {
        const lowerLine = line.toLowerCase();
        if (!commonReceiptWords.some(word => lowerLine.includes(word))) {
          extractedData.productName = line.trim();
          break;
        }
      }
    }
  }
  
  // Extract company name (usually at the top of the receipt)
  // Look for lines at the beginning that are not dates, times, or addresses
  for (let i = 0; i < Math.min(5, allLines.length); i++) {
    const line = allLines[i].trim();
    // Skip if line is a date, time, or appears to be an address
    if (
      !line.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/) && // date pattern
      !line.match(/\d{1,2}:\d{2}/) && // time pattern
      !line.match(/\d+\s+[a-zA-Z]+\s+(?:street|st|avenue|ave|road|rd|boulevard|blvd)/i) // address pattern
    ) {
      if (line.length > 2 && !line.match(/^[0-9\s]+$/)) { // not just numbers
        extractedData.company = line;
        break;
      }
    }
  }
  
  // Extract purchase date
  const datePatterns = [
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/, // MM/DD/YYYY or DD/MM/YYYY
    /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/, // YYYY/MM/DD
    /(\d{1,2})(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(\d{4})/ // 1st January 2023
  ];
  
  for (const line of allLines) {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('date') || lowerLine.includes('purchase') || lowerLine.includes('bought')) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          // Format as YYYY-MM-DD for consistency
          let year, month, day;
          if (pattern === datePatterns[0]) {
            // MM/DD/YYYY or DD/MM/YYYY (assume MM/DD/YYYY for simplicity)
            month = match[1].padStart(2, '0');
            day = match[2].padStart(2, '0');
            year = match[3].length === 2 ? `20${match[3]}` : match[3];
          } else if (pattern === datePatterns[1]) {
            // YYYY/MM/DD
            year = match[1];
            month = match[2].padStart(2, '0');
            day = match[3].padStart(2, '0');
          } else {
            // Text date format
            const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            day = match[1].padStart(2, '0');
            const monthText = line.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*/i)?.[0].toLowerCase().substring(0, 3);
            month = (monthNames.indexOf(monthText || '') + 1).toString().padStart(2, '0');
            year = match[2];
          }
          extractedData.purchaseDate = `${year}-${month}-${day}`;
          break;
        }
      }
    }
    
    // If we found a date, break out of the loop
    if (extractedData.purchaseDate) break;
  }
  
  // If no purchase date found with keywords, look for any date in the receipt
  if (!extractedData.purchaseDate) {
    for (const line of allLines) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          // Format as YYYY-MM-DD for consistency
          let year, month, day;
          if (pattern === datePatterns[0]) {
            // MM/DD/YYYY or DD/MM/YYYY (assume MM/DD/YYYY for simplicity)
            month = match[1].padStart(2, '0');
            day = match[2].padStart(2, '0');
            year = match[3].length === 2 ? `20${match[3]}` : match[3];
          } else if (pattern === datePatterns[1]) {
            // YYYY/MM/DD
            year = match[1];
            month = match[2].padStart(2, '0');
            day = match[3].padStart(2, '0');
          } else {
            // Text date format
            const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            day = match[1].padStart(2, '0');
            const monthText = line.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*/i)?.[0].toLowerCase().substring(0, 3);
            month = (monthNames.indexOf(monthText || '') + 1).toString().padStart(2, '0');
            year = match[2];
          }
          extractedData.purchaseDate = `${year}-${month}-${day}`;
          break;
        }
      }
      
      // If we found a date, break out of the loop
      if (extractedData.purchaseDate) break;
    }
  }
  
  // Extract price information
  const pricePattern = /\$?\s*(\d+(?:[.,]\d{2})?)(?!\d)/;
  for (const line of allLines) {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('total') || lowerLine.includes('price') || lowerLine.includes('amount')) {
      const match = line.match(pricePattern);
      if (match) {
        extractedData.price = match[1];
        break;
      }
    }
  }
  
  // Calculate expiry date (typically 1 year from purchase date)
  if (extractedData.purchaseDate) {
    const purchaseDate = new Date(extractedData.purchaseDate);
    const expiryDate = new Date(purchaseDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    extractedData.expiryDate = expiryDate.toISOString().split('T')[0];
  }
  
  return extractedData;
}

/**
 * Perform OCR on an image using Firebase ML Vision
 * @param imagePath Path to the image
 * @returns Promise with extracted warranty data
 */
export async function performOcr(imagePath: string): Promise<ExtractedWarrantyData> {

  try {
    console.log('Processing image for OCR:', imagePath);
    
    if (Platform.OS === 'web') {
      console.log('Firebase ML Vision is not supported on web platform');
      // Return simulated data for web platform
      return simulateOcrResult();
    }

    
    
    // Enhance the image for better OCR results
    // const enhancedImage = await ImageManipulator.manipulateAsync(
    //   imagePath,
    //   [
    //     { resize: { width: 1200 } }
    //   ],
    //   { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    // );
    // console.log("enhance image:",enhancedImage);

    try {
      const result = await RNTesseractOcr.recognize(imagePath, 'LANG_ENGLISH');
      console.log('OCR Result: ', result);
      const extractedData = processOcrText(result);
      return extractedData;
    } catch (err) {
      console.error(err);
    }
    /*
    try {
      // For Firebase v6.5.0, we need to use a different approach
      // We'll use a dynamic require to avoid issues with web platform
      let extractedText = '';
      
      if (Platform.OS !== 'web') {
        // Only try to use Firebase on native platforms
        try {
          // For older Firebase versions (6.x.x)
          const firebase = require('@react-native-firebase/app');
          const vision = require('@react-native-firebase/ml-vision');
          
          if (firebase && vision) {
            // Process the image with Firebase ML Vision
            const processedResult = await vision().textRecognizerProcessImage(enhancedImage.uri);
            
            if (processedResult && processedResult.text) {
              extractedText = processedResult.text;
            } else if (processedResult && processedResult.blocks) {
              extractedText = processedResult.blocks
                .map((block: any) => block.text)
                .join('\n');
            }
          }
        } catch (firebaseError) {
          console.error('Firebase ML Vision error:', firebaseError);
        }
      }
      
      if (!extractedText) {
        console.log('No text recognized in the image or Firebase not available');
        return simulateOcrResult();
      }
      
      console.log('Text recognized:', extractedText);
      
      // Process the extracted text to get warranty information
      const extractedData = processOcrText(extractedText);
      
      // If we couldn't extract meaningful data, use simulated data
      if (!extractedData.productName && !extractedData.company) {
        console.log('Could not extract meaningful warranty data, using fallback');
        return simulateOcrResult();
      }
      
      return extractedData;
    } catch (error) {
      console.error('Error in OCR processing:', error);
      return simulateOcrResult();
    }*/
  } catch (error) {
    console.error('Error in OCR processing:', error);
    
    // Fallback to simulated data in case of error
    console.log('Using fallback simulated data due to OCR error');
    return simulateOcrResult();
  }
}

/**
 * Generate simulated OCR results for testing or fallback
 * @returns Simulated warranty data
 */
function simulateOcrResult(): ExtractedWarrantyData {
  // Generate a random product from a list of common electronics
  const products = [
    'Smart TV 55" OLED',
    'Wireless Headphones',
    'Smartphone Pro Max',
    'Laptop Ultra Slim',
    'Digital Camera 24MP',
    'Bluetooth Speaker'
  ];
  
  // Generate a random company from a list of electronics manufacturers
  const companies = [
    'TechVision',
    'SoundWave',
    'MobilePro',
    'ComputeX',
    'PhotoTech',
    'AudioSphere'
  ];
  
  // Generate a random purchase date within the last 6 months
  const today = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(today.getMonth() - 6);
  const randomPurchaseDate = new Date(
    sixMonthsAgo.getTime() + Math.random() * (today.getTime() - sixMonthsAgo.getTime())
  );
  
  // Generate a random expiry date (typically 1-2 years from purchase)
  const expiryDate = new Date(randomPurchaseDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + Math.floor(Math.random() * 2) + 1);
  
  // Generate a random price between $100 and $2000
  const price = (Math.floor(Math.random() * 1900) + 100).toFixed(2);
  
  return {
    productName: products[Math.floor(Math.random() * products.length)],
    company: companies[Math.floor(Math.random() * companies.length)],
    purchaseDate: randomPurchaseDate.toISOString().split('T')[0],
    expiryDate: expiryDate.toISOString().split('T')[0],
    price: price
  };
}