import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import {
  ArweaveWalletKit,
  useWallet,
  ConnectButton,
} from "arweave-wallet-kit";
import { message, createDataItemSigner } from "@permaweb/aoconnect";

// Extend the Window interface for TypeScript
declare global {
  interface Window {
    arweaveWallet: {
      sign: (tx: any) => Promise<any>;
      [key: string]: any;
    };
  }
}

// --- CONFIGURATION ---
// Replace this with your actual AO Process ID
const AO_PROCESS_ID = "YOUR_AO_PROCESS_ID_HERE"; 
const GEMINI_MODEL = 'gemini-2.5-flash';
const API_KEY = process.env.API_KEY;

// --- API INITIALIZATION ---
const ai = new GoogleGenAI({ apiKey: API_KEY });

// Custom hook for typewriter effect
const useTypewriter = (text: string, speed: number = 20) => {
    const [displayText, setDisplayText] = useState('');

    useEffect(() => {
        setDisplayText('');
        if (text) {
            let i = 0;
            const typingInterval = setInterval(() => {
                if (i < text.length) {
                    setDisplayText(prevText => prevText + text.charAt(i));
                    i++;
                } else {
                    clearInterval(typingInterval);
                }
            }, speed);
            return () => clearInterval(typingInterval);
        }
    }, [text, speed]);

    return displayText;
};

const App = () => {
    const { connected } = useWallet();
    const [cryptoName, setCryptoName] = useState("");
    const [roast, setRoast] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [messageId, setMessageId] = useState("");

    const displayedRoast = useTypewriter(roast);

    const handleRoast = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setRoast("");
        setMessageId("");

        if (!cryptoName.trim()) {
            setError("...A crypto name is required, genius.");
            return;
        }
        if (!connected) {
            setError("Connect your wallet, you absolute degen.");
            return;
        }
        if (AO_PROCESS_ID === "YOUR_AO_PROCESS_ID_HERE") {
            setError("Error: AO_PROCESS_ID is not configured by the developer.");
            return;
        }

        setIsLoading(true);

        const prompt = `Roast ${cryptoName} like it's the biggest scam in the market. Mock its uselessness, dead community, delusional holders, and compare it to worse-than-worthless objects. Make it brutally savage, sarcastic, and hilarious—like a stand-up comedian tearing it apart on stage. No mercy, no hope—just pure crypto roast energy.`;

        try {
            // 1. Generate the roast using Gemini AI
            const response = await ai.models.generateContent({
                model: GEMINI_MODEL,
                contents: prompt,
            });
            const generatedRoast = response.text;
            setRoast(generatedRoast);

            // 2. Send the roast to the AO process
            const msgId = await message({
                process: AO_PROCESS_ID,
                signer: createDataItemSigner(window.arweaveWallet),
                tags: [
                    { name: "Action", value: "Generate-Roast" }, 
                    { name: "Crypto", value: cryptoName }
                ],
                data: generatedRoast,
            });
            setMessageId(msgId);

        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(`Roast failed: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const styles: { [key: string]: React.CSSProperties } = {
        header: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '2rem', borderBottom: '1px solid var(--primary-color)', marginBottom: '2rem' },
        title: { fontSize: '2.5rem', margin: 0, textTransform: 'uppercase' },
        main: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '800px', flex: 1 },
        form: { display: 'flex', width: '100%', marginBottom: '2rem', gap: '1rem' },
        input: { flex: 1, background: 'transparent', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', padding: '0.75rem', fontSize: '1.2rem', fontFamily: 'inherit', outline: 'none', boxShadow: '0 0 5px var(--glow-color)' },
        button: { background: 'transparent', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', padding: '0.75rem 1.5rem', fontSize: '1.2rem', fontFamily: 'inherit', cursor: 'pointer', textTransform: 'uppercase', boxShadow: '0 0 5px var(--glow-color)', transition: 'all 0.2s ease-in-out', },
        buttonDisabled: { cursor: 'not-allowed', opacity: 0.5 },
        roastContainer: { width: '100%', minHeight: '250px', background: 'rgba(0, 255, 65, 0.05)', border: '1px solid var(--primary-color)', padding: '1.5rem', whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontSize: '1.2rem', lineHeight: 1.6, flex: 1 },
        status: { marginTop: '1rem', minHeight: '2.5rem', width: '100%', textAlign: 'left', fontSize: '1.1rem' },
        error: { color: 'var(--error-color)', textShadow: '0 0 5px var(--error-glow-color)' },
        messageLink: { color: 'var(--primary-color)', textDecoration: 'underline' },
    };

    return (
        <>
            <header style={styles.header}>
                <h1 style={styles.title}>Conor's Crypto Roaster</h1>
                <ConnectButton profileModal={true} showBalance={false} showProfilePicture={true} />
            </header>
            <main style={styles.main}>
                <form onSubmit={handleRoast} style={styles.form}>
                    <input type="text" value={cryptoName} onChange={(e) => setCryptoName(e.target.value)} placeholder="Crypto to obliterate (e.g., BTC)" style={styles.input} aria-label="Cryptocurrency to roast" />
                    <button type="submit" disabled={isLoading || !connected} style={{ ...styles.button, ...((isLoading || !connected) && styles.buttonDisabled) }}>
                        {isLoading ? "Roasting..." : "Roast 'em"}
                    </button>
                </form>
                <div style={styles.roastContainer} aria-live="polite">
                    {displayedRoast}
                    {isLoading && <span className="blinking-cursor">_</span>}
                </div>
                 <div style={styles.status}>
                    {error && <p style={styles.error}>{error}</p>}
                    {messageId && (
                        <p>
                            &gt; Roast permanently inscribed on Arweave. <br />
                            &gt; Message ID: {' '}
                            <a href={`https://viewblock.io/message/${messageId}`} target="_blank" rel="noopener noreferrer" style={styles.messageLink}>
                                {messageId}
                            </a>
                        </p>
                    )}
                </div>
            </main>
        </>
    );
};

const Root = () => (
    <ArweaveWalletKit
        config={{
            name: "Conor's Crypto Roaster",
            permissions: ["ACCESS_ADDRESS", "SIGN_TRANSACTION"],
            ensurePermissions: true,
            appInfo: {
                logo: "https://arweave.net/z-3vF2gS8g5l2Fw9y2_G_f5Yc2prsmD0t2v_2_EbiI"
            }
        }}
        theme={{ displayTheme: "dark" }}
    >
        <App />
    </ArweaveWalletKit>
);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<React.StrictMode><Root /></React.StrictMode>);
