import os
import json
from dotenv import load_dotenv

load_dotenv()

# =========================================================================================
#  Dashboard Config Bridge — loads overrides from data/agent_config.json
# =========================================================================================
_CONFIG_FILE = os.path.join(os.path.dirname(__file__), "data", "agent_config.json")

def load_dashboard_config():
    """Reload config from the dashboard JSON file. Overrides module globals."""
    global SYSTEM_PROMPT, INITIAL_GREETING, FALLBACK_GREETING
    global STT_PROVIDER, STT_MODEL, STT_LANGUAGE
    global DEFAULT_TTS_PROVIDER, DEFAULT_TTS_VOICE, SARVAM_LANGUAGE
    global DEFAULT_LLM_PROVIDER, GROQ_MODEL, GROQ_TEMPERATURE
    global DEFAULT_TRANSFER_NUMBER

    try:
        if not os.path.exists(_CONFIG_FILE):
            return
        with open(_CONFIG_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        cfg = data.get("inbound")
        if not cfg:
            return

        if cfg.get("system_prompt"):
            prompt = cfg["system_prompt"]
            # Append resource content to the prompt
            resources = cfg.get("resources", [])
            if resources:
                prompt += "\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nADDITIONAL KNOWLEDGE BASE\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                for res in resources:
                    if res.get("type") == "url":
                        prompt += f"\nReference URL — {res.get('name', '')}: {res.get('value', '')}"
                    else:
                        prompt += f"\n## {res.get('name', 'Resource')}\n{res.get('value', '')}\n"
            SYSTEM_PROMPT = prompt
        if cfg.get("initial_greeting"):
            INITIAL_GREETING = cfg["initial_greeting"]
        if cfg.get("fallback_greeting"):
            FALLBACK_GREETING = cfg["fallback_greeting"]
        if cfg.get("stt_provider"):
            STT_PROVIDER = cfg["stt_provider"]
        if cfg.get("stt_model"):
            STT_MODEL = cfg["stt_model"]
        if cfg.get("stt_language"):
            STT_LANGUAGE = cfg["stt_language"]
        if cfg.get("tts_provider"):
            DEFAULT_TTS_PROVIDER = cfg["tts_provider"]
        if cfg.get("tts_voice"):
            DEFAULT_TTS_VOICE = cfg["tts_voice"]
        if cfg.get("tts_language"):
            SARVAM_LANGUAGE = cfg["tts_language"]
        if cfg.get("llm_provider"):
            DEFAULT_LLM_PROVIDER = cfg["llm_provider"]
        if cfg.get("llm_model"):
            GROQ_MODEL = cfg["llm_model"]
        if cfg.get("llm_temperature") is not None:
            GROQ_TEMPERATURE = cfg["llm_temperature"]
        if cfg.get("transfer_number"):
            DEFAULT_TRANSFER_NUMBER = cfg["transfer_number"]

    except Exception as e:
        print(f"[CONFIG] Failed to load dashboard config for inbound: {e}")

# =========================================================================================
#  🚗 INBOUND CALL CONFIGURATION — Doctor's Receptionist
#  Used when a patient calls in asking about appointments or clinic services.
# =========================================================================================

# --- 1. AGENT PERSONA & PROMPTS ---
SYSTEM_PROMPT = """
You are a professional, empathetic, and highly efficient Medical Receptionist at "City Health Clinic".
Your role is to warmly welcome callers, assist them with booking appointments, and answer general questions about the clinic.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — EMERGENCY TRIAGE (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If the caller mentions chest pain, severe bleeding, difficulty breathing, or any life-threatening emergency, IMMEDIATELY tell them:
"This sounds like a medical emergency. Please hang up and dial emergency services (911) immediately, or go to the nearest hospital emergency room."
Do not attempt to book an appointment for emergencies.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — PATIENT CAPTURE (MANDATORY FIRST)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
For all non-emergency calls, you MUST collect the following before booking an appointment or answering detailed medical questions:
  1. Caller's FULL NAME
  2. Caller's PHONE NUMBER and REASON FOR CALL
     Example: "Thank you for calling City Health Clinic. May I have your full name and a brief reason for your visit?"

Ask for the name first, then phone + reason. Once you have this information, you can call the `save_lead_info` tool to store the patient's information, then smoothly transition:
  "Thank you, [Name]. How can I help you schedule your appointment today?"

**If the caller refuses to share their details:**
Politely explain: "I understand your concern, but I need your basic information to look up your file or schedule an appointment with our doctors. We keep all information strictly confidential."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — CLINIC KNOWLEDGE BASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## OVERVIEW
City Health Clinic provides comprehensive primary care, pediatric care, and specialized internal medicine. We pride ourselves on offering compassionate, patient-centered healthcare.

## SERVICES OFFERED
- Primary Care & General Checkups
- Pediatrics & Vaccinations
- Women's Health
- Chronic Disease Management (Diabetes, Hypertension, etc.)
- In-house Lab Testing and X-Rays

## DOCTORS ON STAFF
- Dr. Sarah Jenkins (General Practitioner) - Available Mon, Wed, Fri
- Dr. Michael Chen (Pediatrician) - Available Tue, Thu
- Dr. Emily Stone (Internal Medicine) - Available Mon-Thu

## CLINIC TIMINGS & LOCATION
- Monday to Friday: 8:00 AM to 6:00 PM
- Saturday: 9:00 AM to 2:00 PM
- Sunday: Closed
- Location: 123 Wellness Avenue, Medical District

## APPOINTMENTS & BILLING
- Appointments are highly recommended, but walk-ins are accepted for urgent (non-life-threatening) issues.
- We accept most major insurances including Medicare and BlueCross.
- Co-pays are due at the time of the visit.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMMUNICATION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. **Empathetic & Professional**: Always sound caring and professional. Health matters can be stressful for callers.
2. **Concise**: Keep each response to 2-3 sentences.
3. **No Medical Advice**: NEVER give medical advice, diagnose, or suggest treatments. Always advise them to speak to a doctor.
4. **CTA**: End by offering to find an available time slot for them to see a doctor.
5. If the caller says "Bye" or "Thank you, goodbye", thank them and wish them good health.
"""

# The first message the agent speaks when the inbound call connects.
INITIAL_GREETING = (
    "A patient has just called in. Greet them warmly as the Receptionist at City Health Clinic and "
    "immediately ask for their name to begin the conversation."
)

# Fallback if already connected
FALLBACK_GREETING = (
    "Warmly greet the patient as the Receptionist at City Health Clinic and ask for their name."
)


# --- 2. SPEECH-TO-TEXT (STT) SETTINGS ---
STT_PROVIDER = "deepgram"
STT_MODEL = "nova-2"
STT_LANGUAGE = "en"


# --- 3. TEXT-TO-SPEECH (TTS) SETTINGS ---
DEFAULT_TTS_PROVIDER = "sarvam"
DEFAULT_TTS_VOICE = "anushka"

# Sarvam AI Specifics
SARVAM_MODEL = "bulbul:v2"
SARVAM_LANGUAGE = "en-IN"   # English (Indian accent) for Skoda advisor

# Cartesia Specifics (fallback)
CARTESIA_MODEL = "sonic-2"
CARTESIA_VOICE = "f786b574-daa5-4673-aa0c-cbe3e8534c02"


# --- 4. LARGE LANGUAGE MODEL (LLM) SETTINGS ---
DEFAULT_LLM_PROVIDER = "groq"
DEFAULT_LLM_MODEL = "gpt-4o-mini"

# Groq Specifics
GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_TEMPERATURE = 0.7


# --- 5. TELEPHONY & TRANSFERS ---
DEFAULT_TRANSFER_NUMBER = os.getenv("DEFAULT_TRANSFER_NUMBER")

# Inbound SIP Trunk (configure in .env)
SIP_TRUNK_ID = os.getenv("INBOUND_TRUNK_ID", os.getenv("VOBIZ_SIP_TRUNK_ID"))
SIP_DOMAIN = os.getenv("VOBIZ_SIP_DOMAIN")

# Call mode identifier
CALL_MODE = "inbound"

# Load any dashboard overrides on import
load_dashboard_config()
