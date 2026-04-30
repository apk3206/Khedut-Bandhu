import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const VoiceNavigation = ({ onNavigate }) => {
    const { t } = useTranslation();
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech recognition not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US'; // Could be 'gu-IN' for Gujarati support

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onresult = (event) => {
            const command = event.results[0][0].transcript.toLowerCase();
            setTranscript(command);
            
            if (command.includes("sell") || command.includes("market")) onNavigate("sell");
            else if (command.includes("buy") || command.includes("product")) onNavigate("buy");
            else if (command.includes("order")) onNavigate("orders");
            else if (command.includes("stat") || command.includes("analysis")) onNavigate("stats");
            else if (command.includes("diag") || command.includes("crop")) onNavigate("ai");
            else if (command.includes("home") || command.includes("dash")) onNavigate("dashboard");
            else if (command.includes("profile")) onNavigate("profile");
        };

        const handleKeyDown = (e) => {
            if (e.code === "Space" && e.ctrlKey) {
                // Only start if not already listening to prevent 'already started' crash
                if (!window.isVoiceListening) {
                    try {
                        recognition.start();
                        window.isVoiceListening = true;
                    } catch (err) {
                        console.error("Speech start failed", err);
                    }
                }
            }
        };

        recognition.onstart = () => {
            setIsListening(true);
            window.isVoiceListening = true;
        };
        recognition.onend = () => {
            setIsListening(false);
            window.isVoiceListening = false;
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onNavigate]);

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
        }}>
            {transcript && (
                <div style={{
                    background: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    padding: '8px 15px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    border: '1px solid #4f46e5'
                }}>
                    "{transcript}"
                </div>
            )}
            <button 
                className={`voice-trigger ${isListening ? 'listening' : ''}`}
                style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    border: 'none',
                    background: isListening ? '#ef4444' : '#4f46e5',
                    color: 'white',
                    fontSize: '20px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    transition: 'all 0.3s'
                }}
                title="Ctrl + Space to Speak"
            >
                {isListening ? "⏺️" : "🎤"}
            </button>
            <style>{`
                .voice-trigger.listening {
                    animation: pulse 1.5s infinite;
                }
                @keyframes pulse {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
            `}</style>
        </div>
    );
};

export default VoiceNavigation;
