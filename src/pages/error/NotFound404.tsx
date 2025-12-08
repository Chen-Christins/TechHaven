import React, { useEffect, useRef, useState } from 'react';
import styles from './NotFound404.module.css';
import { useNavigate } from 'react-router-dom';

const UFO_SOUND = 'https://cdn.pixabay.com/audio/2022/10/16/audio_12b2b7e2b2.mp3';

const NotFound404: React.FC = () => {
        const navigate = useNavigate();
        const [blink, setBlink] = useState(false);
        const [showUfo, setShowUfo] = useState(false);
        const audioRef = useRef<HTMLAudioElement>(null);

        // Robot blink effect
        useEffect(() => {
                const blinkInterval = setInterval(() => {
                        setBlink(true);
                        setTimeout(() => setBlink(false), 180);
                }, 2200 + Math.random() * 1200);
                return () => clearInterval(blinkInterval);
        }, []);

        // UFO appears after 1.5s
        useEffect(() => {
                const timer = setTimeout(() => {
                        setShowUfo(true);
                        audioRef.current?.play();
                }, 1500);
                return () => clearTimeout(timer);
        }, []);

        return (
                <div className={styles.container}>
                        <div className={styles.code}>404</div>
                        <div className={styles.illustration}>
                                {/* SVG: Cute lost robot with blink */}
                                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.robot}>
                                    <ellipse cx="60" cy="70" rx="38" ry="32" fill="#4f8ef7" opacity="0.12" />
                                    <rect x="32" y="38" width="56" height="44" rx="16" fill="#fff" stroke="#4f8ef7" strokeWidth="3" />
                                    <rect x="44" y="52" width="32" height="16" rx="8" fill="#e0e7ef" />
                                    {/* Eyes: blink effect */}
                                    {blink ? (
                                        <>
                                            <rect x="44" y="58" width="8" height="4" rx="2" fill="#4f8ef7" />
                                            <rect x="68" y="58" width="8" height="4" rx="2" fill="#4f8ef7" />
                                        </>
                                    ) : (
                                        <>
                                            <circle cx="48" cy="60" r="4" fill="#4f8ef7" />
                                            <circle cx="72" cy="60" r="4" fill="#4f8ef7" />
                                        </>
                                    )}
                                    <rect x="56" y="68" width="8" height="4" rx="2" fill="#4f8ef7" />
                                    <rect x="58" y="32" width="4" height="10" rx="2" fill="#4f8ef7" />
                                    <rect x="32" y="80" width="8" height="12" rx="4" fill="#4f8ef7" />
                                    <rect x="80" y="80" width="8" height="12" rx="4" fill="#4f8ef7" />
                                </svg>
                                {/* UFO Easter Egg */}
                                {showUfo && (
                                    <div className={styles.ufoWrap}>
                                        <svg width="80" height="60" viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.ufo}>
                                            <ellipse cx="40" cy="30" rx="32" ry="12" fill="#b3e5fc" />
                                            <ellipse cx="40" cy="24" rx="18" ry="8" fill="#4f8ef7" />
                                            <ellipse cx="40" cy="20" rx="8" ry="4" fill="#fff" />
                                            <rect x="36" y="32" width="8" height="18" rx="4" fill="url(#beam)" opacity="0.7" />
                                            <defs>
                                                <linearGradient id="beam" x1="40" y1="32" x2="40" y2="50" gradientUnits="userSpaceOnUse">
                                                    <stop stopColor="#b3e5fc" stopOpacity="0.7" />
                                                    <stop offset="1" stopColor="#fff" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                    </div>
                                )}
                                <audio ref={audioRef} src={UFO_SOUND} preload="auto" />
                            </div>
                        <div className={styles.title}>哎呀，页面迷路了！</div>
                        <div className={styles.desc}>你访问的页面不在地球上，可能被外星人带走了。<br/>别担心，带你回家！</div>
                        <button className={styles.homeBtn} onClick={() => navigate('/index')}>
                                返回首页
                        </button>
                </div>
        );
};

export default NotFound404;
