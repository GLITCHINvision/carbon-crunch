import easyocr
print("Downloading detection model...")
reader = easyocr.Reader(['en'], gpu=False)
print("Download complete.")
