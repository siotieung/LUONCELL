// src/utils/imageLoader.js

// 언어 코드: 'kr' | 'en' 
export const getAllAssetsImages = (lang = 'kr') => {
  const modules = import.meta.glob('./assets/images/*.{png,jpg,jpeg,svg,mp4,gif}', { eager: true });

  const allFiles = Object.entries(modules).map(([path, module]) => {
    const fileName = path.split('/').pop() ?? '';
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, ''); // 확장자 제거
    // baseName: 언어 접미사 제거 (e.g. "001_en" -> "001", "001" -> "001")
    const baseName = nameWithoutExt.replace(/_(?:kr|en)$/, '');
    const langMatch = nameWithoutExt.match(/_([a-z]+)$/)?.[1] ?? null;
    return { path, fileName, nameWithoutExt, baseName, langMatch, url: module.default };
  });

  // 고유 baseName 목록 (정렬)
  const baseNames = [...new Set(allFiles.map(f => f.baseName))].sort();

  return baseNames.map((baseName) => {
    // 1순위: 선택 언어 파일 (e.g. 001_en)
    let file = allFiles.find(f => f.baseName === baseName && f.langMatch === lang);
    // 2순위: 한국어 기본 파일 (001_kr)
    if (!file) file = allFiles.find(f => f.baseName === baseName && f.langMatch === 'kr');
    // 3순위: 접미사 없는 기본 파일 (001)
    if (!file) file = allFiles.find(f => f.baseName === baseName && f.langMatch === null);
    // 4순위: 영어가 아닌 파일 (마지막 예외 처리)
    if (!file) file = allFiles.find(f => f.baseName === baseName && f.langMatch !== 'en');

    if (!file) return null;

    return {
      id: baseName,
      url: file.url,
      name: baseName,
    };
  }).filter(Boolean);
};
