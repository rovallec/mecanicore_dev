import React, { useState } from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ onSearch, onClear }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    onClear();
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSearch} className="search-container">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por ID, nombre, descripción..."
          className="search-input"
        />
        <button type="submit" className="btn btn-primary">
          <Search size={16} />
          Buscar
        </button>
      </form>
      {searchTerm && (
        <button
          type="button"
          onClick={handleClear}
          className="btn btn-secondary"
        >
          Limpiar
        </button>
      )}
    </div>
  );
};

export default SearchBar;