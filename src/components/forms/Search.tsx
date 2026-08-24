import React, { useState } from 'react';
import { AiOutlineSearch } from 'react-icons/ai';

interface SearchProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

const Search = ({ 
  placeholder = 'Pesquisar ou digitar endereço...',
  onSearch,
  className = '',
  ...props 
}: SearchProps) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
  };

  return (
    <form onSubmit={handleSubmit} className={`relative flex w-full max-w-xl ${className}`}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="flex-1 h-10 px-4 py-2 pr-10 rounded-l-lg border border-transparent bg-background/50 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        {...props}
      />
      <button
        type="submit"
        className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-r-lg bg-transparent hover:bg-primary/20"
      >
        <AiOutlineSearch className="text-primary-400 hover:text-primary-500 transition-colors" />
      </button>
    </form>
  )
};

Search.displayName = 'Search';

export { Search };
