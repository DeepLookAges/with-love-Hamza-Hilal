import React, { useState, useCallback, ChangeEvent, FormEvent, Fragment, useEffect } from 'react';
import { Platform } from '../types';
import { generateStoryImage } from '../services/geminiService';
import { useWatermark } from '../hooks/useWatermark';
import UploadIcon from './icons/UploadIcon';
import CloseIcon from './icons/CloseIcon';
import DownloadIcon from './icons/DownloadIcon';
// FIX: Import constants from the constants file to resolve errors and centralize configuration.
import { cameraStyles, lightingStyles, loadingMessages } from '../constants';

interface GeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PreviewIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

// FIX: Removed hardcoded constants as they are now imported from constants.ts.
const GeneratorModal: React.FC<GeneratorModalProps> = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [platform, setPlatform] = useState<Platform>(Platform.INSTAGRAM);
  const [cameraStyle, setCameraStyle] = useState<string>(cameraStyles[0]);
  const [lightingStyle, setLightingStyle] = useState<string>(lightingStyles[0]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { applyWatermark } = useWatermark();

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);

      // Revoke old object URLs before creating new ones
      imagePreviews.forEach(URL.revokeObjectURL);
      
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(newPreviews);
      
      setGeneratedImage(null);
      setError(null);
    }
  };
  
  const resetState = useCallback(() => {
    setPrompt('');
    setSelectedFiles([]);
    setImagePreviews([]); // URLs are revoked by the useEffect cleanup
    setGeneratedImage(null);
    setError(null);
    setIsLoading(false);
    setPlatform(Platform.INSTAGRAM);
    setCameraStyle(cameraStyles[0]);
    setLightingStyle(lightingStyles[0]);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt || selectedFiles.length === 0) {
      setError('يرجى كتابة وصف وإرفاق صورة واحدة على الأقل.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    
    let messageIndex = 0;
    setLoadingMessage(loadingMessages[messageIndex]);
    const interval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex]);
    }, 2500);

    try {
      const base64Result = await generateStoryImage(prompt, selectedFiles, cameraStyle, lightingStyle);
      const finalImage = await applyWatermark(base64Result, platform);
      setGeneratedImage(finalImage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      clearInterval(interval);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="fixed inset-0 bg-gray-900 bg-opacity-33 backdrop-blur-sm" onClick={handleClose}></div>
      <div className="relative z-10 bg-slate-800 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-700">
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">صانع القصص بالذكاء الاصطناعي</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors">
            <CloseIcon />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form Side */}
          <div className="flex flex-col gap-4">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-slate-300 mb-2">اكتب فكرتك (عربي أو انجليزي)</label>
                <textarea id="prompt" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition" placeholder="مثال: اجعل الصورة تبدو كأنها في الفضاء..." dir="auto"></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">ارفع صورك</label>
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full min-h-[10rem] border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-900 hover:bg-slate-700 transition">
                  {imagePreviews.length > 0 ? (
                    <div className="flex flex-wrap justify-center gap-2 p-2">
                      {imagePreviews.map((src, index) => (
                        <img key={index} src={src} alt={`Preview ${index + 1}`} className="h-24 w-24 object-cover rounded-md border border-slate-500" />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadIcon />
                      <p className="mb-2 text-sm text-slate-400"><span className="font-semibold">انقر للرفع</span> أو اسحب الصور</p>
                      <p className="text-xs text-slate-500">PNG, JPG or WEBP</p>
                    </div>
                  )}
                  <input id="dropzone-file" type="file" className="hidden" accept="image/*" onChange={handleFileChange} multiple />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="camera-style" className="block text-sm font-medium text-slate-300 mb-2">ستايل الكاميرا</label>
                    <select id="camera-style" value={cameraStyle} onChange={(e) => setCameraStyle(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition">
                        {cameraStyles.map(style => <option key={style} value={style}>{style}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="lighting-style" className="block text-sm font-medium text-slate-300 mb-2">ستايل الإضاءة</label>
                    <select id="lighting-style" value={lightingStyle} onChange={(e) => setLightingStyle(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition">
                        {lightingStyles.map(style => <option key={style} value={style}>{style}</option>)}
                    </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">اختر المنصة</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.values(Platform) as Platform[]).map((p) => (
                    // FIX: Add key prop for list rendering.
                    <button key={p} type="button" onClick={() => setPlatform(p)} className={`px-4 py-2 text-sm font-medium rounded-lg transition ${ platform === p ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={isLoading || !prompt || selectedFiles.length === 0} className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors shadow-md flex items-center justify-center">
                {isLoading ? '...جاري التوليد' : 'إنشاء القصة'}
              </button>
            </form>
            {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
          </div>

          {/* Result Side */}
          <div className="bg-slate-900 rounded-lg flex items-center justify-center min-h-[400px] aspect-[9/16] max-w-sm mx-auto p-2 border border-slate-700">
            {isLoading ? (
              <div className="text-center text-white">
                <div className="w-12 h-12 border-4 border-t-purple-500 border-slate-600 rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 font-semibold">{loadingMessage}</p>
              </div>
            ) : generatedImage ? (
                <div className="w-full h-full flex flex-col items-center justify-center relative group">
                    <img src={generatedImage} alt="Generated Story" className="object-contain w-full h-full rounded-md" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col sm:flex-row items-center justify-center gap-4 p-4">
                        <button onClick={() => window.open(generatedImage, '_blank')} className="bg-slate-700 text-white py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-slate-600 transition w-full sm:w-auto justify-center">
                            <PreviewIcon />
                            معاينة
                        </button>
                        <a href={generatedImage} download="with-love-story.png" className="bg-purple-600 text-white py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition w-full sm:w-auto justify-center">
                            <DownloadIcon />
                            تحميل
                        </a>
                    </div>
                </div>

            ) : (
              <div className="text-center text-slate-400">
                <p>ستظهر معاينة قصتك هنا</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratorModal;