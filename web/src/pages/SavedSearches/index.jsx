import React, { useState, useEffect } from 'react';
import { Search, Trash2, ArrowRight, Calendar, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../services/axiosInstance';
import { toast } from 'react-toastify';
import DeleteSearchConfirmationModal from '../../components/Modals/DeleteSearchConfirmationModal';
import './styles.scss';

const SavedSearches = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSearch, setSelectedSearch] = useState(null);

  const userId = user?.email || user?.username;

  const fetchSavedSearches = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get(`/api/saved-searches?userId=${userId}`);
      setSearches(response.data || []);
    } catch (err) {
      console.error('Error fetching saved searches:', err);
      setError('Failed to load saved searches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedSearches();
  }, [userId]);

  const handleDeleteClick = (search, e) => {
    e.stopPropagation();
    setSelectedSearch(search);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSearch || !userId) return;
    try {
      await axiosInstance.delete(`/api/saved-searches/${selectedSearch.id}?userId=${userId}`);
      setSearches(prev => prev.filter(s => s.id !== selectedSearch.id));
      toast.success(`Saved search "${selectedSearch.query}" was deleted.`);
      setIsDeleteModalOpen(false);
      setSelectedSearch(null);
    } catch (err) {
      console.error('Failed to delete saved search:', err);
      toast.error('Failed to delete saved search. Please try again.');
    }
  };

  const handleRunSearch = (query) => {
    const q = query.trim().toLowerCase();
    
    // Dynamically check if query is a Form pattern e.g., "i-131", "i131", "i-485", "n-400"
    const formRegex = /^(i|n)-?(\d{3})$/i;
    const match = q.match(formRegex);
    if (match) {
      const type = match[1].toUpperCase();
      const num = match[2];
      navigate(`/form/${type}-${num}`);
      return;
    }

    // Check if query points to newsroom/feeds
    if (q.includes('newsroom') || q.includes('alert')) {
      navigate('/newsroom/newsroom-alerts');
      return;
    }
    if (q.includes('release')) {
      navigate('/newsroom/news-releases');
      return;
    }
    if (q.includes('policy') || q.includes('manual')) {
      navigate('/newsroom/policy-updates');
      return;
    }
    if (q.includes('bulletin') || q.includes('visa')) {
      navigate('/newsroom/visa-bulletin');
      return;
    }
    if (q.includes('processing') || q.includes('time')) {
      navigate('/processing-times');
      return;
    }

    // Default general fallback
    navigate(`/sources?search=${encodeURIComponent(query)}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="savedSearchesLoading">
        <div className="loadingSpinner"></div>
        <p>Loading your saved searches...</p>
      </div>
    );
  }

  return (
    <div className="savedSearchesPage">
      {/* Header */}
      <div className="pageHeader">
        <div className="headerContent">
          <div className="titleArea">
            <div className="badge">
              <Search size={14} />
              <span>Saved Queries</span>
            </div>
            <h1 className="savedSearchesTitle">Saved Searches</h1>
            <p className="subtitle">
              Quickly rerun search queries to monitor changes, news, policy updates, and processing times.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="errorCard">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={fetchSavedSearches} className="retryBtn">Retry</button>
        </div>
      )}

      {!error && searches.length === 0 ? (
        <div className="noResultsCard">
          <div className="noResultsIcon">
            <Search size={48} />
          </div>
          <h3>No Saved Searches</h3>
          <p>
            You haven't saved any search queries yet. Type in the global search bar above, and click <strong>⭐ Save search</strong> to add it here.
          </p>
        </div>
      ) : (
        <div className="searchesGrid">
          {searches.map((search) => (
            <div
              key={search.id}
              className="searchCard"
              onClick={() => handleRunSearch(search.query)}
            >
              <div className="cardMain">
                <div className="searchIconWrapper">
                  <Search size={18} />
                </div>
                <div className="searchDetails">
                  <h3 className="searchQuery">"{search.query}"</h3>
                  <div className="searchMeta">
                    <span className="metaItem">
                      <Calendar size={12} />
                      {formatDate(search.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="cardActions">
                <button
                  className="runBtn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRunSearch(search.query);
                  }}
                  title="Run Search"
                >
                  <span>Run Search</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  className="deleteBtn"
                  onClick={(e) => handleDeleteClick(search, e)}
                  title="Delete Search"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Confirmation Alert Modal */}
      <DeleteSearchConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedSearch(null);
        }}
        onConfirm={handleConfirmDelete}
        query={selectedSearch?.query || ''}
      />
    </div>
  );
};

export default SavedSearches;
