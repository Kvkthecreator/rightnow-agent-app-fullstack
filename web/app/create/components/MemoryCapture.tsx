'use client';

import { useState, useCallback } from 'react';
import { Upload, Type, Link, Sparkles } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { SubstrateEvolution } from './SubstrateEvolution';
import { IntentField } from './IntentField';

export interface Input {
  type: 'file' | 'text' | 'url';
  name?: string;
  content: string;
  size?: number;
}

interface Props {
  onFormation: (intent: string, inputs: Input[]) => void;
  basketId: string | null;
}

export function MemoryCapture({ onFormation, basketId }: Props) {
  const [intent, setIntent] = useState('');
  const [inputs, setInputs] = useState<Input[]>([]);
  const [isForming, setIsForming] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setInputs((prev) => [
          ...prev,
          { type: 'file', name: file.name, content: reader.result as string, size: file.size },
        ]);
      };
      reader.readAsText(file);
    });
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData('text');
    if (!text) return;
    try {
      const url = new URL(text);
      setInputs((prev) => [...prev, { type: 'url', content: url.toString(), name: url.hostname }]);
    } catch {
      setInputs((prev) => [...prev, { type: 'text', content: text }]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: false,
    multiple: true,
  });

  const handleCreate = () => {
    setIsForming(true);
    onFormation(intent, inputs);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto p-8">
      <div className="mb-12">
        <IntentField value={intent} onChange={setIntent} />
      </div>

      <div
        {...getRootProps()}
        onPaste={handlePaste}
        className={`relative min-h-[400px] rounded-lg border-2 border-dashed ${
          isDragActive ? 'border-white bg-white/5' : 'border-gray-800'
        } ${isForming ? 'pointer-events-none' : 'cursor-pointer'} transition-all duration-300`}
      >
        <input {...getInputProps()} />

        {!isForming && inputs.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="flex justify-center gap-4 text-gray-600">
                <Upload size={24} />
                <Type size={24} />
                <Link size={24} />
              </div>
              <p className="text-gray-500">Drop files, paste text, or add URLs</p>
            </div>
          </div>
        )}

        {!isForming && inputs.length > 0 && (
          <div className="p-6 space-y-3">
            {inputs.map((input, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-gray-400">
                {input.type === 'file' && <Upload size={16} />}
                {input.type === 'text' && <Type size={16} />}
                {input.type === 'url' && <Link size={16} />}
                <span>{input.name || `${input.type} input`}</span>
              </div>
            ))}
          </div>
        )}

        {isForming && basketId && <SubstrateEvolution basketId={basketId} />}
      </div>

      {!isForming && inputs.length > 0 && intent && (
        <button
          onClick={handleCreate}
          className="mt-8 w-full py-4 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles size={20} />
          Begin Formation
        </button>
      )}
    </div>
  );
}

