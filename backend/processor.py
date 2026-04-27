import cv2
import easyocr
import numpy as np
import re
import math
import warnings


warnings.filterwarnings("ignore", category=UserWarning)


try:
    reader = easyocr.Reader(['en'], gpu=False) 
except Exception as e:
    print(f"Error initializing EasyOCR: {e}")
    reader = None

def preprocess_image(image_path):
    """
    Preprocess the image for better OCR results.
    Includes grayscale conversion, blur, thresholding, and basic deskewing.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Could not read image.")
        

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    

    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
 
    lines = cv2.HoughLines(edges, 1, np.pi/180, 200)
    
    angle = 0
    if lines is not None:
        angles = []
        for line in lines:
            rho, theta = line[0]
        
            degrees = theta * 180 / np.pi
            
            if 80 < degrees < 100:
                angles.append(degrees - 90)
        if angles:
            angle = np.median(angles)
            
    # Rotate if necessary
    if abs(angle) > 0.5:
        (h, w) = gray.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        gray = cv2.warpAffine(gray, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        
    # 3. Denoising
    denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
    
  
    thresh = cv2.adaptiveThreshold(denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    
    return thresh, img 

def extract_store_name(text_lines):

    for line in text_lines[:5]:
        text = line[1].strip()
        # Avoid lines that look like dates or addresses
        if len(text) > 3 and not re.search(r'\d', text) and text.upper() != "RECEIPT":
            return {"value": text, "confidence": float(line[2])}
    return {"value": "Unknown Store", "confidence": 0.4}

def extract_date(text_lines):
    date_pattern = r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b'
    for line in text_lines:
        match = re.search(date_pattern, line[1])
        if match:
            return {"value": match.group(1), "confidence": float(min(line[2] + 0.1, 1.0))} # Boost confidence if regex matches
    return {"value": None, "confidence": 0.0}

def extract_total(text_lines):
    total_pattern = r'TOTAL.*\b(\d+\.\d{2})\b'

    for line in text_lines:
        text = line[1].upper()
        match = re.search(total_pattern, text)
        if match:
            return {"value": match.group(1), "confidence": min(line[2] + 0.2, 1.0)}
            
  
    found_total_keyword = False
    for line in text_lines:
        text = line[1].upper()
        if "TOTAL" in text:
            found_total_keyword = True
        
            num_match = re.search(r'\b(\d+\.\d{2})\b', text)
            if num_match:
                return {"value": num_match.group(1), "confidence": line[2]}
                
        if found_total_keyword:
            num_match = re.search(r'\b(\d+\.\d{2})\b', text)
            if num_match:
                return {"value": num_match.group(1), "confidence": float(line[2] * 0.9)} 
                
    return {"value": None, "confidence": 0.0}

def extract_items(text_lines):
 
    items = []
    price_pattern = r'\b(\d+\.\d{2})\b'
    
    
    in_items_section = False
    
    for i, line in enumerate(text_lines):
        text = line[1]
        conf = line[2]
        upper_text = text.upper()
        
        if "TOTAL" in upper_text or "SUBTOTAL" in upper_text or "TAX" in upper_text:
            break
            
        # Check if line contains a price
        match = re.search(price_pattern, text)
        if match:
            price = match.group(1)
            # Remove the price from the description
            name = text.replace(price, "").strip()
            # Clean up common stray characters
            name = re.sub(r'[^a-zA-Z0-9\s]', '', name).strip()
            
            if len(name) > 2:
                items.append({
                    "name": name,
                    "price": price,
                    "confidence": float(conf)
                })
                
    return items

def process_receipt_image(image_path):
    if reader is None:
        return {"error": "OCR Engine not initialized"}
        
    try:
        preprocessed_img, orig_img = preprocess_image(image_path)
       
        results = reader.readtext(preprocessed_img, detail=1)
        

        results.sort(key=lambda x: x[0][0][1])
        
        store_data = extract_store_name(results)
        date_data = extract_date(results)
        total_data = extract_total(results)
        items_data = extract_items(results)
        
        # Calculate overall reliability
        all_confs = [res[2] for res in results]
        overall_confidence = sum(all_confs) / len(all_confs) if all_confs else 0
        
        return {
            "status": "success",
            "data": {
                "store_name": store_data,
                "date": date_data,
                "items": items_data,
                "total_amount": total_data
            },
            "metadata": {
                "overall_confidence": float(round(overall_confidence, 2)),
                "needs_review": bool(overall_confidence < 0.7 or total_data['confidence'] < 0.7)
            }
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}
