// src/utils/imageLoader.js
export const getAllAssetsImages = () => {
  // src/assets/images 폴더 내의 모든 이미지/동영상 파일을 가져옴
  const modules = import.meta.glob('./assets/images/*.{png,jpg,jpeg,svg,mp4}', { eager: true });

  return Object.entries(modules).map(([path, module], index) => {
    const fileName = path.split('/').pop() ?? `파일 ${index + 1}`;
    const name = fileName.replace(/\.[^/.]+$/, ''); // 확장자 제거
    return {
      id: String(index),
      url: module.default, // Vite가 처리한 해시 경로
      name,
    };
  });
};