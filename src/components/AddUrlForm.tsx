import { useState, useRef } from 'react';
import { Plus, Upload } from 'lucide-react';

interface AddUrlFormProps {
  onAdd: (url: string, name: string) => void;
  showForm: boolean;
  onShowFormChange: (show: boolean) => void;
  onBulkAdd: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AddUrlForm({ onAdd, showForm, onShowFormChange, onBulkAdd, fileInputRef, onFileSelect }: AddUrlFormProps) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAdd(url.trim(), name.trim());
      setUrl('');
      setName('');
      onShowFormChange(false);
    }
  };

  if (!showForm) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-sm space-y-3">
      <div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
          URL *
        </label>
        <input
          type="url"
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name (optional)
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Website"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Add URL
        </button>
        <button
          type="button"
          onClick={() => {
            onShowFormChange(false);
            setUrl('');
            setName('');
          }}
          className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
