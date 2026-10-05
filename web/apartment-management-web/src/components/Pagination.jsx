import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import CustomDropdown from './CustomDropdown';
import './Pagination.css';

function getPageItems(currentPage, totalPages) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const items = [];
  let previousPage = 0;

  [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)
    .forEach((page) => {
      if (page - previousPage > 1) items.push(`ellipsis-${page}`);
      items.push(page);
      previousPage = page;
    });

  return items;
}

function Pagination({
  currentPage,
  totalItems,
  pageSize = 10,
  pageSizeOptions = [],
  onPageChange,
  onPageSizeChange,
  label = 'results',
}) {
  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalItems <= 10) return null;

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) onPageChange(page);
  };

  return (
    <nav className="table-pagination" aria-label={`${label} pagination`}>
      <p className="table-pagination-summary">
        <span className="pagination-summary-full">
          Showing {(currentPage - 1) * pageSize + 1}&ndash;{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
        </span>
        <span className="pagination-summary-compact" aria-hidden="true">
          {(currentPage - 1) * pageSize + 1}&ndash;{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
        </span>
      </p>
      {pageSizeOptions.length > 0 && (
        <div className="pagination-size-control">
          <span>Rows per page</span>
          <CustomDropdown
            value={String(pageSize)}
            onChange={(value) => onPageSizeChange(Number(value))}
            options={pageSizeOptions.map((size) => ({ value: String(size), label: String(size) }))}
            placeholder={String(pageSize)}
          />
        </div>
      )}
      {totalPages > 1 && (
      <div className="table-pagination-controls">
        <button
          type="button"
          className="pagination-direction"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <MdChevronLeft aria-hidden="true" />
          <span>Previous</span>
        </button>

        <div className="pagination-pages">
          {getPageItems(currentPage, totalPages).map((item) => (
            typeof item === 'string' ? (
              <span className="pagination-ellipsis" key={item} aria-hidden="true">&hellip;</span>
            ) : (
              <button
                type="button"
                key={item}
                className={`pagination-page ${item === currentPage ? 'is-active' : ''}`}
                onClick={() => goToPage(item)}
                aria-label={`Page ${item}`}
                aria-current={item === currentPage ? 'page' : undefined}
              >
                {item}
              </button>
            )
          ))}
        </div>

        <button
          type="button"
          className="pagination-direction"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <span>Next</span>
          <MdChevronRight aria-hidden="true" />
        </button>
      </div>
      )}
    </nav>
  );
}

export default Pagination;
