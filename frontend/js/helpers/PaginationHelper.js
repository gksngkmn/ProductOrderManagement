class PaginationHelper {
  static getTotalPages(totalItems, perPage) {
    return Math.ceil(totalItems / perPage) || 1;
  }

  static getPageData(items, currentPage, perPage) {
    const totalItems = items.length;
    const totalPages = this.getTotalPages(totalItems, perPage);

    let safePage = currentPage;

    if (safePage > totalPages) safePage = totalPages;
    if (safePage < 1) safePage = 1;

    const startIndex = (safePage - 1) * perPage;
    const endIndex = startIndex + perPage;

    return {
      currentPage: safePage,
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      pageItems: items.slice(startIndex, endIndex),
      visibleStart: totalItems === 0 ? 0 : startIndex + 1,
      visibleEnd: Math.min(endIndex, totalItems)
    };
  }

  static getVisiblePages(currentPage, totalPages) {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      ];
    }

    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  }

  static render(currentPage, totalPages) {
    if (totalPages <= 1) return "";

    const visiblePages = this.getVisiblePages(currentPage, totalPages);

    let html = `
      <button
        type="button"
        data-page="${currentPage - 1}"
        ${currentPage === 1 ? "disabled" : ""}
      >
        Prev
      </button>
    `;

    visiblePages.forEach((page) => {
      if (page === "...") {
        html += `<span class="pagination-dots">...</span>`;
        return;
      }

      html += `
        <button
          type="button"
          class="${page === currentPage ? "active-page" : ""}"
          data-page="${page}"
        >
          ${page}
        </button>
      `;
    });

    html += `
      <button
        type="button"
        data-page="${currentPage + 1}"
        ${currentPage === totalPages ? "disabled" : ""}
      >
        Next
      </button>

      <div class="pagination-info">
        Page ${currentPage} of ${totalPages}
      </div>
    `;

    return html;
  }

  static getClickedPage(event) {
    const page = Number(event.target.dataset.page);

    if (!page || Number.isNaN(page)) {
      return null;
    }

    return page;
  }
}

export default PaginationHelper;