from flask import Flask, request, jsonify
from flask_cors import CORS
from processor import process_receipt_image
import os
import uuid
import tempfile

app = Flask(__name__)
CORS(app) # Allow all origins for the development frontend

@app.route('/api/upload', methods=['POST'])
def upload_receipt():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if file:
        # Save file to a temporary directory
        temp_dir = tempfile.gettempdir()
        filename = f"{uuid.uuid4()}_{file.filename}"
        filepath = os.path.join(temp_dir, filename)
        file.save(filepath)
        
        try:
            # Process the image
            result = process_receipt_image(filepath)
            
            # Clean up the temp file
            os.remove(filepath)
            
            return jsonify(result), 200
        except Exception as e:
            # Attempt cleanup if it fails
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
