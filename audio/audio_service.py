import speech_recognition as sr
from gtts import gTTS
import os
import time

def listen_to_mic():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("🎤 Listening... describe your symptoms.")
        # Step for patent consideration: calibrate for hospital background noise
        recognizer.adjust_for_ambient_noise(source, duration=1)
        audio = recognizer.listen(source)
    try:
        text = recognizer.recognize_google(audio, language="en-IN")
        print(f"📝 Recognized Text: {text}")
        return text
    except Exception as e:
        print("Could not understand audio.")
        return None

def speak_text(text):
    tts = gTTS(text=text, lang='en', tld='co.in')
    filename = f"response_{int(time.time())}.mp3"
    tts.save(filename)
    os.system(f"start {filename}") # Windows command to play audio

if __name__ == "__main__":
    captured_text = listen_to_mic()
    if captured_text:
        speak_text(f"Processing your symptom: {captured_text}")