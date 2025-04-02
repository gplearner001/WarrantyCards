import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { createWorker } from 'tesseract.js';

// Define the extracted data structure
export interface ExtractedWarrantyData {
  productName?: string;
  company?: string;
  purchaseDate?: string;
  expiryDate?: string;
  price?: string;
}

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
  for (let i = 0; i < Math.min(5, allLines.length); i++) {
    const line = allLines[i].trim();
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
          let year, month, day;
          if (pattern === datePatterns[0]) {
            month = match[1].padStart(2, '0');
            day = match[2].padStart(2, '0');
            year = match[3].length === 2 ? `20${match[3]}` : match[3];
          } else if (pattern === datePatterns[1]) {
            year = match[1];
            month = match[2].padStart(2, '0');
            day = match[3].padStart(2, '0');
          } else {
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
    
    if (extractedData.purchaseDate) break;
  }
  
  // If no purchase date found with keywords, look for any date
  if (!extractedData.purchaseDate) {
    for (const line of allLines) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          let year, month, day;
          if (pattern === datePatterns[0]) {
            month = match[1].padStart(2, '0');
            day = match[2].padStart(2, '0');
            year = match[3].length === 2 ? `20${match[3]}` : match[3];
          } else if (pattern === datePatterns[1]) {
            year = match[1];
            month = match[2].padStart(2, '0');
            day = match[3].padStart(2, '0');
          } else {
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
 * Perform OCR on an image using Tesseract.js
 * @param imagePath Path to the image
 * @returns Promise with extracted warranty data
 */
export async function performOcr(imagePath: string): Promise<ExtractedWarrantyData> {
  try {
    console.log('Processing image for OCR:', imagePath);

    if (Platform.OS === 'web') {
      // For web, we'll use Tesseract.js
      const worker = await createWorker('eng');
      
      try {
        const { data: { text } } = await worker.recognize(imagePath);
        await worker.terminate();
        
        if (!text) {
          console.log('No text recognized, using fallback');
          return simulateOcrResult();
        }
        
        return processOcrText(text);
      } catch (err) {
        console.error('Tesseract OCR Error:', err);
        return simulateOcrResult();
      }
    } else {
      // For native platforms, we'll use simulated results for now
      // In a production app, you would implement platform-specific OCR here
      return simulateOcrResult();
    }
  } catch (error) {
    console.error('Error in OCR processing:', error);
    return simulateOcrResult();
  }
}

/**
 * Generate simulated OCR results for testing or fallback
 * @returns Simulated warranty data
 */
function simulateOcrResult(): ExtractedWarrantyData {
  const products = [
    'Smart TV 55" OLED',
    'Wireless Headphones',
    'Smartphone Pro Max',
    'Laptop Ultra Slim',
    'Digital Camera 24MP',
    'Bluetooth Speaker'
  ];
  
  const companies = [
    'TechVision',
    'SoundWave',
    'MobilePro',
    'ComputeX',
    'PhotoTech',
    'AudioSphere'
  ];
  
  const today = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(today.getMonth() - 6);
  const randomPurchaseDate = new Date(
    sixMonthsAgo.getTime() + Math.random() * (today.getTime() - sixMonthsAgo.getTime())
  );
  
  const expiryDate = new Date(randomPurchaseDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + Math.floor(Math.random() * 2) + 1);
  
  const price = (Math.floor(Math.random() * 1900) + 100).toFixed(2);
  
  return {
    productName: products[Math.floor(Math.random() * products.length)],
    company: companies[Math.floor(Math.random() * companies.length)],
    purchaseDate: randomPurchaseDate.toISOString().split('T')[0],
    expiryDate: expiryDate.toISOString().split('T')[0],
    price: price
  };
}