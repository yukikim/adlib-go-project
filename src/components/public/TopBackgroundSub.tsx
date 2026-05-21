'use client'
import React, { useState, useEffect } from 'react';

type MainBackgroundProps = {
    imageUrl: string;
    startScrollY?: number;
    zIndex?: number;
};

const INITIAL_BLUR = 360;

export default function TopBackground({ imageUrl, startScrollY = 0, zIndex = -10 }: MainBackgroundProps) {
    const [scrollY, setScrollY] = useState(INITIAL_BLUR);


    useEffect(() => {
        // スクロール時に実行される関数
        const handleScroll = () => {
            if (window.scrollY <= startScrollY) {
                setScrollY(INITIAL_BLUR);
                return;
            }

            const progress = (window.scrollY - startScrollY) * 0.3;
            const phase = progress % (INITIAL_BLUR * 2);
            const next = phase <= INITIAL_BLUR ? INITIAL_BLUR - phase : phase - INITIAL_BLUR;
            setScrollY(next);
        };

        handleScroll(); // 初期表示時にも一度適用
        // イベントリスナーを登録
        window.addEventListener('scroll', handleScroll);

        // クリーンアップ関数（コンポーネントが消える時にイベントを削除）
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [startScrollY]);

    return (
        <div className={`fixed top-0 ${zIndex} min-h-screen w-full overflow-hidden`}>
            <div className="absolute min-h-screen w-full bg-auto bg-center bg-no-repeat bg-mist-500 bg-blend-color-burn"
                style={{ backgroundImage: `url('/images/${imageUrl}')` }}
            >
                <div
                    className="absolute min-h-screen w-full"
                    style={{
                        backdropFilter: `hue-rotate(${scrollY}deg)`,
                        WebkitBackdropFilter: `hue-rotate(${scrollY}deg)`, // Safari対応
                    }}
                ></div>
            </div>
            {/* <div className="absolute min-h-screen w-full bg-rose-300/80 backdrop-blur-xs bg-blend-darken"></div> */}
            {/* <div className="absolute min-h-screen w-full bg-[url('/images/main_logo.svg')] bg-bottom bg-no-repeat bg-size-auto opacity-30"></div> */}
            <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-teal-700/80 blur-[120px] animate-orb [animation-delay:800ms]"></div>
            <div className="absolute bottom-[10%] right-[25%] h-[400px] w-[400px] rounded-full bg-indigo-300/50 blur-[100px] animate-orb [animation-delay:500ms]"></div>
            <div className="absolute top-[24%] right-[10%] h-[300px] w-[300px] rounded-full bg-pink-800/60 blur-[140px] animate-orb [animation-delay:1200ms]"></div>
        </div>
    )
}
