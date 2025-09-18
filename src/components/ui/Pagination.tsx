/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
    if (totalPages <= 1) return null;

    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <nav className="pagination" aria-label="Page navigation">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-arrow"
                aria-label="Go to previous page"
            >
                &laquo; Previous
            </button>
            <div className="pagination-pages">
                {pageNumbers.map(number => (
                    <button
                        key={number}
                        onClick={() => onPageChange(number)}
                        className={`page-number ${currentPage === number ? 'active' : ''}`}
                        aria-current={currentPage === number ? 'page' : undefined}
                    >
                        {number}
                    </button>
                ))}
            </div>
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-arrow"
                aria-label="Go to next page"
            >
                Next &raquo;
            </button>
        </nav>
    );
};

export default Pagination;