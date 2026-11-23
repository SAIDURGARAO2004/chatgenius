// ================= VOICE RECOGNITION FOR TELUGU =================

let recognition = null;
let isRecording = false;
let finalTranscript = ''; // Move to global scope so we can reset it properly

// Initialize Speech Recognition
function initVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        console.error('Speech Recognition not supported in this browser');
        alert('Voice recognition is not supported in your browser. Please use Chrome or Edge.');
        return null;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'te-IN'; // Telugu (India)
    recognition.continuous = true; // Keep listening
    recognition.interimResults = true; // Show text as you speak
    recognition.maxAlternatives = 1;

    recognition.onstart = function() {
        console.log('Voice recognition started');
        isRecording = true;
        updateMicButtonState(true);
    };

    recognition.onresult = function(event) {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }

        // Update the message input with the recognized text
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.value = finalTranscript + interimTranscript;
            // Auto-resize textarea
            messageInput.style.height = 'auto';
            messageInput.style.height = messageInput.scrollHeight + 'px';
        }
    };

    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        
        let errorMessage = 'Voice recognition error: ';
        switch(event.error) {
            case 'no-speech':
                errorMessage += 'No speech detected. Please try again.';
                break;
            case 'audio-capture':
                errorMessage += 'No microphone found or microphone access denied.';
                break;
            case 'not-allowed':
                errorMessage += 'Microphone permission denied. Please allow microphone access.';
                break;
            default:
                errorMessage += event.error;
        }
        
        alert(errorMessage);
        stopVoiceRecognition();
    };

    recognition.onend = function() {
        console.log('Voice recognition ended');
        isRecording = false;
        updateMicButtonState(false);
        // Reset finalTranscript when recording ends
        finalTranscript = '';
    };

    return recognition;
}

// Toggle voice recognition on/off
function toggleVoiceRecognition() {
    if (!recognition) {
        recognition = initVoiceRecognition();
        if (!recognition) return; // Browser doesn't support it
    }

    if (isRecording) {
        stopVoiceRecognition();
    } else {
        startVoiceRecognition();
    }
}

// Start voice recognition
function startVoiceRecognition() {
    try {
        // CRITICAL: Always reset the transcript to start completely fresh
        finalTranscript = '';
        
        // Clear the input box before starting new recording
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.value = '';
            messageInput.style.height = 'auto';
            // Auto-focus the input box
            messageInput.focus();
        }
        
        recognition.start();
        
        // Add click-to-stop listener when recording starts
        addClickToStopListener();
    } catch (error) {
        console.error('Error starting voice recognition:', error);
    }
}

// Stop voice recognition
function stopVoiceRecognition() {
    if (recognition && isRecording) {
        recognition.stop();
        // Reset finalTranscript immediately when stopping
        finalTranscript = '';
        // Remove click-to-stop listener when recording stops
        removeClickToStopListener();
    }
}

// Click-to-stop listener function
function handleClickToStop(e) {
    // Don't stop if clicking the mic button itself (let toggle handle it)
    const micButton = document.querySelector('.dictate-inside');
    if (micButton && micButton.contains(e.target)) {
        return;
    }
    
    // Stop recording on any other click
    if (isRecording) {
        stopVoiceRecognition();
    }
}

// Add click-to-stop listener
function addClickToStopListener() {
    // Add listener to the entire document
    document.addEventListener('click', handleClickToStop);
}

// Remove click-to-stop listener
function removeClickToStopListener() {
    document.removeEventListener('click', handleClickToStop);
}

// Update microphone button visual state
function updateMicButtonState(recording) {
    const micButton = document.querySelector('.dictate-inside');
    if (micButton) {
        if (recording) {
            micButton.classList.add('recording');
            micButton.innerHTML = '🔴'; // Red circle when recording
        } else {
            micButton.classList.remove('recording');
            micButton.innerHTML = '🎤'; // Microphone when not recording
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const micButton = document.querySelector('.dictate-inside');
    
    if (micButton) {
        micButton.addEventListener('click', function(e) {
            e.preventDefault();
            toggleVoiceRecognition();
        });
    }

    // Stop recording when message is sent
    const sendButton = document.querySelector('.send-inside');
    if (sendButton) {
        sendButton.addEventListener('click', function() {
            if (isRecording) {
                stopVoiceRecognition();
            }
            // Always reset finalTranscript when sending a message
            finalTranscript = '';
        });
    }

    // Also stop recording on Enter key
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                if (isRecording) {
                    stopVoiceRecognition();
                }
                // Always reset finalTranscript when sending a message
                finalTranscript = '';
            }
        });
    }
});
