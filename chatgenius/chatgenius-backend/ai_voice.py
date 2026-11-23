# ai_voice.py
from flask import Blueprint, request, jsonify
from indic_transliteration.sanscript import transliterate, ITRANS
from indic_transliteration import sanscript

voice_bp = Blueprint("voice", __name__)

# Map unicode ranges to scripts
SCRIPT_RANGES = [
    # (start, end, script)
    ("\u0C00", "\u0C7F", sanscript.TELUGU),        # Telugu
    ("\u0D00", "\u0D7F", sanscript.MALAYALAM),     # Malayalam
    ("\u0900", "\u097F", sanscript.DEVANAGARI),    # Hindi / Marathi / Nepali / Sanskrit
    ("\u0980", "\u09FF", sanscript.BENGALI),       # Bengali / Assamese
    ("\u0A80", "\u0AFF", sanscript.GUJARATI),      # Gujarati
    ("\u0A00", "\u0A7F", sanscript.GURMUKHI),      # Punjabi
    ("\u0B00", "\u0B7F", sanscript.ORIYA),         # Odia
    ("\u0B80", "\u0BFF", sanscript.TAMIL),         # Tamil
    ("\u0C80", "\u0CFF", sanscript.KANNADA),       # Kannada
    ("\uA8E0", "\uA8FF", sanscript.SAURASHTRA),    # Saurashtra
]


def detect_script(text):
    for start, end, script in SCRIPT_RANGES:
        if any(start <= ch <= end for ch in text):
            return script
    return None


def to_roman(text):
    script = detect_script(text)
    if script:
        return transliterate(text, script, ITRANS)
    return text


@voice_bp.route("/romanize", methods=["POST"])
def romanize():
    text = request.json.get("text", "")
    roman_text = to_roman(text)
    return jsonify({"roman": roman_text})