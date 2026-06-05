import { useState, useEffect, useRef } from "react";

/**
 * A custom hook to calculate the remaining height of the viewport for Ant Design Table scroll.y.
 * It dynamically detects the presence and heights of the table header and pagination components
 * to adjust the scrollable body height precisely, and disables scrolling on outer containers.
 *
 * @param {Object} options
 * @param {number} options.bottomPadding - Bottom padding to prevent touching the viewport edge. Default is 20px.
 * @param {number} options.minHeight - Minimum table body height. Default is 200px.
 * @returns {[React.RefObject, number]} An array containing the ref to attach to a table container div and the calculated height.
 */
export function useTableHeight({ bottomPadding = 20, minHeight = 200 } = {}) {
  const containerRef = useRef(null);
  const [tableHeight, setTableHeight] = useState(minHeight);

  // Effect to manage outer scrollbars
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    // 1. Prevent scrolling on body and HTML document elements
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // 2. Find and prevent scrolling on ancestor layout scroll containers
    const scrollParents = [];
    let parent = element.parentElement;
    while (parent && parent !== document.body) {
      const style = window.getComputedStyle(parent);
      const isScrollable = 
        style.overflowY === "auto" || 
        style.overflowY === "scroll" || 
        parent.classList.contains("ant-layout-content") || 
        parent.classList.contains("layout-app-content");
      
      if (isScrollable) {
        scrollParents.push({
          el: parent,
          originalOverflow: parent.style.overflowY,
        });
        parent.style.overflowY = "hidden";
      }
      parent = parent.parentElement;
    }

    return () => {
      // Restore original scroll settings on cleanup
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      scrollParents.forEach(({ el, originalOverflow }) => {
        el.style.overflowY = originalOverflow;
      });
    };
  }, []);

  // Effect to calculate table height
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const calculateHeight = () => {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Total vertical space remaining from the top of the table to the bottom of the viewport
      const totalRemaining = windowHeight - rect.top;
      
      // 1. Get the table header height dynamically
      const headerEl = 
        element.querySelector(".ant-table-header") || 
        element.querySelector(".ant-table-thead") || 
        element.querySelector("thead");
      const headerHeight = headerEl ? headerEl.offsetHeight : 0;
      
      // 2. Get the pagination element height dynamically including margins
      const paginationEl = element.querySelector(".ant-pagination");
      let paginationHeight = 0;
      if (paginationEl) {
        const style = window.getComputedStyle(paginationEl);
        const marginTop = parseFloat(style.marginTop) || 0;
        const marginBottom = parseFloat(style.marginBottom) || 0;
        paginationHeight = paginationEl.offsetHeight + marginTop + marginBottom;
      }
      
      // 3. Scrollable body height = total remaining - header - pagination - bottom padding
      const calculated = totalRemaining - headerHeight - paginationHeight - bottomPadding;
      const finalHeight = Math.max(minHeight, calculated);
      
      setTableHeight(finalHeight);
    };

    // Run initially
    calculateHeight();

    // Set up ResizeObserver to recalculate when layout/window changes size
    const resizeObserver = new ResizeObserver(() => {
      calculateHeight();
    });

    if (element.parentElement) {
      resizeObserver.observe(element.parentElement);
    }
    resizeObserver.observe(element);

    // MutationObserver to recalculate whenever the DOM inside the Table updates
    const mutationObserver = new MutationObserver(() => {
      calculateHeight();
    });
    mutationObserver.observe(element, { childList: true, subtree: true });

    window.addEventListener("resize", calculateHeight);

    return () => {
      window.removeEventListener("resize", calculateHeight);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [bottomPadding, minHeight]);

  return [containerRef, tableHeight];
}
