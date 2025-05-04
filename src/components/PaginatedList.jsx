import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import LoadingIndicator from './LoadingIndicator';
import '../styles/PaginatedList.css';

/**
 * A reusable component for displaying paginated lists
 * 
 * @param {Object} props - Component props
 * @param {Array} props.items - Array of items to display
 * @param {Function} props.renderItem - Function to render each item
 * @param {Function} props.loadMore - Function to load more items
 * @param {boolean} props.hasMore - Whether there are more items to load
 * @param {boolean} props.loading - Whether items are currently loading
 * @param {string} props.emptyMessage - Message to display when there are no items
 * @param {number} props.pageSize - Number of items per page
 * @param {string} props.loadingText - Text to display while loading
 * @param {string} props.className - Additional CSS class name
 */
const PaginatedList = ({
  items = [],
  renderItem,
  loadMore,
  hasMore = false,
  loading = false,
  error = null,
  emptyMessage = 'No items to display',
  pageSize = 10,
  loadingText = 'Loading more items...',
  className = '',
  onRetry = null
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [displayedItems, setDisplayedItems] = useState([]);
  const [paginationMode, setPaginationMode] = useState('client');

  // Determine if we're using client-side or server-side pagination
  useEffect(() => {
    setPaginationMode(loadMore ? 'server' : 'client');
  }, [loadMore]);

  // Update displayed items when items or page changes (for client-side pagination)
  useEffect(() => {
    if (paginationMode === 'client') {
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      setDisplayedItems(items.slice(startIndex, endIndex));
    } else {
      setDisplayedItems(items);
    }
  }, [items, currentPage, pageSize, paginationMode]);

  // Calculate total pages for client-side pagination
  const totalPages = paginationMode === 'client' 
    ? Math.ceil(items.length / pageSize) 
    : null;

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    
    // If we're at the last page and there are more items to load, load them
    if (paginationMode === 'server' && page === currentPage + 1 && hasMore && loadMore) {
      loadMore();
    }
  };

  // Handle retry when loading fails
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else if (loadMore) {
      loadMore();
    }
  };

  // Render pagination controls
  const renderPagination = () => {
    if (paginationMode === 'client') {
      // Client-side pagination
      if (totalPages <= 1) return null;

      return (
        <div className="pagination-controls">
          <button 
            className="pagination-button"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
          >
            &laquo;
          </button>
          
          <button 
            className="pagination-button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            &lsaquo;
          </button>
          
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button 
            className="pagination-button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            &rsaquo;
          </button>
          
          <button 
            className="pagination-button"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            &raquo;
          </button>
        </div>
      );
    } else {
      // Server-side pagination (infinite scroll style)
      if (!hasMore && items.length <= pageSize) return null;
      
      return (
        <div className="pagination-controls">
          {hasMore && (
            <button 
              className="load-more-button"
              onClick={() => loadMore()}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          )}
          
          {items.length > 0 && (
            <span className="pagination-info">
              Showing {items.length} items
            </span>
          )}
        </div>
      );
    }
  };

  return (
    <div className={`paginated-list ${className}`}>
      {items.length === 0 && !loading ? (
        <div className="empty-message">{emptyMessage}</div>
      ) : (
        <>
          <div className="list-items">
            {displayedItems.map((item, index) => (
              <div key={item.id || index} className="list-item">
                {renderItem(item, index)}
              </div>
            ))}
          </div>
          
          {renderPagination()}
          
          {loading && (
            <div className="list-loading">
              <LoadingIndicator 
                isLoading={true} 
                text={loadingText} 
                size="small" 
              />
            </div>
          )}
          
          {error && (
            <div className="list-error">
              <p>{error}</p>
              <button className="retry-button" onClick={handleRetry}>
                Retry
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

PaginatedList.propTypes = {
  items: PropTypes.array,
  renderItem: PropTypes.func.isRequired,
  loadMore: PropTypes.func,
  hasMore: PropTypes.bool,
  loading: PropTypes.bool,
  error: PropTypes.string,
  emptyMessage: PropTypes.string,
  pageSize: PropTypes.number,
  loadingText: PropTypes.string,
  className: PropTypes.string,
  onRetry: PropTypes.func
};

export default PaginatedList;