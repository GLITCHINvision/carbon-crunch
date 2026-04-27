# Carbon Crunch: Project Documentation

## 1. Approach
The Carbon Crunch system is designed to extract structured financial data from receipt images using a multi-stage pipeline:

1.  **Image Preprocessing**: Raw images are processed using OpenCV to improve OCR accuracy. This includes grayscale conversion, noise reduction (Fast Non-Local Means Denoising), and adaptive thresholding. A deskewing algorithm based on Hough Line Transform is applied to correct rotation.
2.  **OCR Pipeline**: We utilize the **EasyOCR** engine, which leverages deep learning models (CRAFT for text detection and a ResNet-LSTM-CTC architecture for recognition). EasyOCR was chosen for its robustness against real-world variations like blur and poor lighting compared to traditional Tesseract-based approaches.
3.  **Entity Extraction**: Extracted text fragments are processed using a combination of regular expressions and heuristics to identify:
    *   **Store Name**: Identifying the most prominent text at the header.
    *   **Date**: Pattern matching for common date formats (MM/DD/YYYY, etc.).
    *   **Line Items**: Heuristics that correlate descriptions with nearby decimal patterns.
    *   **Total Amount**: Keyword-based search (e.g., "TOTAL", "AMOUNT") followed by price extraction.
4.  **Confidence Scoring**: Each extracted field is assigned a confidence score based on the OCR engine's output and validation against expected patterns.

## 2. Tools Used
*   **Backend**: Python, Flask, Flask-CORS.
*   **Computer Vision**: OpenCV (cv2).
*   **OCR**: EasyOCR (PyTorch-based).
*   **Frontend**: React, Vite, TypeScript, Tailwind CSS, Framer Motion (for animations), Lucide React (icons).

## 3. Challenges Faced
*   **Noisy Receipts**: Low-quality mobile photos often have shadows and blur. This was mitigated using adaptive thresholding and denoising.
*   **Skewed Layouts**: Users rarely take perfectly flat photos. Deskewing logic helped normalize the text alignment.
*   **Layout Variation**: Receipt formats vary wildly between vendors. The item extraction logic uses a flexible heuristic approach rather than rigid templates.

## 4. Future Improvements
*   **Fine-tuning**: Training a custom Transformer model (like LayoutLM) on a large-scale receipt dataset (e.g., SROIE) for even higher extraction accuracy.
*   **Cloud Integration**: Exporting extracted data directly to accounting software like QuickBooks or Xero.
*   **Multi-Currency Support**: Automatic detection and conversion of various currencies.
