import { useEffect, useRef, useState } from 'react';

interface WebViewProps {
  url: string;
}

export const WebView = ({ url }: WebViewProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!iframeRef.current) return;
    const handleLoad = () => setIsLoading(false);
    const handleError = () => setIsLoading(false);

    iframeRef.current.addEventListener('load', handleLoad);
    iframeRef.current.addEventListener('error', handleError);

    return () => {
      iframeRef.current.removeEventListener('load', handleLoad);
      iframeRef.current.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-gray-50">
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : null}
      <iframe
        ref={iframeRef}
        src={url || 'about:blank'}
        title="Web view"
        className="w-full h-full border-0"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        allow="microphone; camera"
      />
    </div>
  );
};