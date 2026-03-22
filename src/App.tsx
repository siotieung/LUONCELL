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

type Lang = 'kr' | 'en' | 'zh';

const LANG_LABELS: Record<Lang, string> = {
  kr: 'KR',
  en: 'EN',
  zh: '中文',
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

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8a9e7a]"></div>
          </div>
        ) : slides.length === 0 ? (
          <div className="mt-12 border-2 border-dashed border-white/10 rounded-3xl p-20 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mb-6">
              <LayoutGrid className="text-neutral-400" size={40} />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No media found</h2>
            <p className="text-neutral-500 max-w-xs text-center">
              Please place your images or videos in the <code className="bg-neutral-800 px-1 rounded text-emerald-400">/public/images</code> folder to see them here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Main Viewer */}
            <div
              ref={containerRef}
              className={`relative overflow-hidden shadow-2xl group ${isFullscreen ? 'rounded-none' : 'aspect-video rounded-2xl'}`}
              style={{
                background: 'linear-gradient(to bottom, #c8d4b8, #f0f0e8)',
                ...(isIOS && isFullscreen ? {
                  position: 'fixed',
                  inset: 0,
                  width: '100vw',
                  height: '100dvh',
                  zIndex: 9999,
                } : {}),
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={slides[currentIndex].id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="w-full h-full flex items-center justify-center"
                >
                  {isVideo(slides[currentIndex].url) ? (
                    <video
                      src={slides[currentIndex].url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={slides[currentIndex].url}
                      alt={slides[currentIndex].name}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://picsum.photos/seed/${slides[currentIndex].id}/1920/1080`;
                      }}
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Desktop Controls Overlay (hover) */}
              <div className="absolute inset-0 hidden md:flex flex-col justify-between p-6 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none">
                <div className="flex justify-between items-start pointer-events-auto">
                  <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-sm font-medium border border-white/10">
                    {currentIndex + 1} / {slides.length}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-2.5 bg-black/50 backdrop-blur-md rounded-full border border-white/10 hover:bg-white hover:text-black transition-all"
                      title={isPlaying ? "Pause" : "Play Slideshow"}
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <button
                      onClick={toggleFullscreen}
                      className="p-2.5 bg-black/50 backdrop-blur-md rounded-full border border-white/10 hover:bg-white hover:text-black transition-all"
                      title="Toggle Fullscreen"
                    >
                      {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center pointer-events-auto">
                  <button
                    onClick={prevSlide}
                    className="p-4 bg-black/50 backdrop-blur-md rounded-full border border-white/10 hover:bg-white hover:text-black transition-all"
                  >
                    <ChevronLeft size={32} />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="p-4 bg-black/50 backdrop-blur-md rounded-full border border-white/10 hover:bg-white hover:text-black transition-all"
                  >
                    <ChevronRight size={32} />
                  </button>
                </div>
              </div>

              {/* Mobile: 슬라이드 번호 상단 고정 */}
              <div className="absolute top-3 left-3 md:hidden bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/10 pointer-events-none">
                {currentIndex + 1} / {slides.length}
              </div>

              {/* Mobile: 전체화면 버튼 상단 우측 고정 */}
              <button
                onClick={toggleFullscreen}
                className="absolute top-3 right-3 md:hidden p-2.5 bg-black/60 backdrop-blur-md rounded-full border border-white/20 text-white active:scale-95 transition-all"
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>

            {/* Mobile Controls Bar */}
            <div className="flex md:hidden items-center justify-between gap-3 bg-neutral-800/80 rounded-2xl px-4 py-3 border border-white/5">
              <button
                onClick={prevSlide}
                className="flex-1 flex justify-center p-3 bg-neutral-700 rounded-xl active:scale-95 transition-all"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex-1 flex justify-center p-3 bg-neutral-700 rounded-xl active:scale-95 transition-all"
              >
                {isPlaying ? <Pause size={22} /> : <Play size={22} />}
              </button>
              <button
                onClick={nextSlide}
                className="flex-1 flex justify-center p-3 bg-neutral-700 rounded-xl active:scale-95 transition-all"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Thumbnail Strip */}
            <div className="bg-neutral-800/50 p-4 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <LayoutGrid size={18} className="text-[#8a9e7a]" />
                  Slides
                </h3>
                <button 
                  onClick={() => setShowThumbnails(!showThumbnails)}
                  className="text-xs text-neutral-400 hover:text-white transition-colors"
                >
                  {showThumbnails ? 'Hide Thumbnails' : 'Show Thumbnails'}
                </button>
              </div>
              
              {showThumbnails && (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {slides.map((slide, index) => (
                    <div 
                      key={slide.id}
                      className={`relative flex-shrink-0 w-24 sm:w-32 md:w-40 aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                        currentIndex === index ? 'border-[#8a9e7a] scale-105 shadow-lg shadow-[#8a9e7a]/20' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                      onClick={() => setCurrentIndex(index)}
                    >
                      {isVideo(slide.url) ? (
                        <div className="w-full h-full bg-neutral-700 flex items-center justify-center">
                          <Play size={24} className="text-white/50" />
                        </div>
                      ) : (
                        <img 
                          src={slide.url} 
                          alt={slide.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://picsum.photos/seed/${slide.id}/400/225`;
                          }}
                        />
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-[10px] truncate">
                        {index + 1}. {slide.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
