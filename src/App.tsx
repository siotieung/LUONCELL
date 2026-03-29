/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  Maximize2, 
  Minimize2, 
  X, 
  Play, 
  Pause,
  LayoutGrid
} from 'lucide-react';

interface Slide {
  id: string;
  url: string;
  name: string;
}

import { getAllAssetsImages } from './Utils';

// 여기서 zh, jp 제거
type Lang = 'kr' | 'en';

const LANG_LABELS: Record<Lang, string> = {
  kr: 'KR',
  en: 'EN',
};

export default function App() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Lang>('kr');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    try {
      const data = getAllAssetsImages(lang);
      setSlides(data);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  }, [lang]);

  const nextSlide = () => {
    if (slides.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    if (slides.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  const toggleFullscreen = () => {
    if (isIOS) {
      // iOS는 requestFullscreen 미지원 → CSS 기반 가짜 전체화면
      setIsFullscreen((prev) => !prev);
      return;
    }
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!isIOS) setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && slides.length > 0) {
      interval = setInterval(nextSlide, 3000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, slides.length]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
    if (e.key === 'f') toggleFullscreen();
    if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length]);

  // 모바일 Android 뒤로가기 버튼 → 이전 슬라이드 이동
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile || slides.length === 0) return;

    // 더미 히스토리 상태를 push해 뒤로가기 버튼을 가로챌 수 있게 준비
    window.history.pushState({ slidePresenter: true }, '');

    const handlePopState = () => {
      setCurrentIndex((prev) => {
        if (prev > 0) {
          // 이전 슬라이드로 이동하고 상태를 다시 push (계속 가로챌 수 있도록)
          window.history.pushState({ slidePresenter: true }, '');
          return prev - 1;
        } else {
          // 첫 슬라이드에서는 상태를 재push해 앱 종료/이탈 방지
          window.history.pushState({ slidePresenter: true }, '');
          return prev;
        }
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [slides.length]);

  const isVideo = (url: string) => {
    return /\.(mp4|webm|ogg)$/i.test(url);
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white font-sans selection:bg-[#8a9e7a]/30">
      {/* Header */}
      <header className="p-4 border-b border-white/10 flex justify-between items-center bg-neutral-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-[#8a9e7a]/20" style={{ background: 'linear-gradient(to bottom, #c8d4b8, #f0f0e8)' }}>
            <LayoutGrid className="text-[#5a7048]" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Luoncell</h1>
          </div>
        </div>

        {/* 언어 선택기 */}
        <div className="flex gap-1">
          {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                lang === l
                  ? 'bg-[#8a9e7a] text-white shadow-md shadow-[#8a9e7a]/30'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white border border-white/5'
              }`}
            >
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-
