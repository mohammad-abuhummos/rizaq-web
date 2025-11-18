import { useState } from 'react';

export interface SearchBarProps {
  onSearch: (text: string) => void;
  placeholder?: string;
  onSearchPress?: () => void;
}

export function SearchBar({
  onSearch,
  placeholder = 'ابحث عن الصنف',
  onSearchPress,
}: SearchBarProps) {
  const [searchText, setSearchText] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSearchText(text);
    onSearch(text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchPress) {
      onSearchPress();
    }
    onSearch(searchText);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-3">
      {/* Search input */}
      <div className="flex-1 h-12 flex items-center bg-white border-2 border-gray-200 rounded-xl px-4 shadow-sm hover:border-green-300 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-200 transition-all">
        <input
          type="text"
          value={searchText}
          onChange={handleChange}
          placeholder={placeholder}
          className="flex-1 text-right text-[15px] text-gray-800 outline-none bg-transparent placeholder:text-gray-400"
        />
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* List button */}
      <button
        type="button"
        onClick={onSearchPress}
        className="bg-gradient-to-r from-emerald-600 to-green-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-300 transform hover:scale-105"
      >
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </form>
  );
}

