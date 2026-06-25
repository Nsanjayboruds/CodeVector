document.addEventListener('DOMContentLoaded', () => {
  const productGrid = document.getElementById('product-grid');
  const categoryFilter = document.getElementById('category-filter');
  const loadMoreBtn = document.getElementById('load-more');
  const loadingIndicator = document.getElementById('loading');

  let currentCursor = null;
  let hasMore = true;
  let isLoading = false;

  async function fetchProducts(reset = false) {
    if (isLoading || (!hasMore && !reset)) return;
    
    isLoading = true;
    loadingIndicator.classList.remove('hidden');
    
    if (reset) {
      currentCursor = null;
      productGrid.innerHTML = '';
      hasMore = true;
      loadMoreBtn.classList.add('hidden');
    }

    const category = categoryFilter.value;
    let url = `/api/products?limit=20`;
    
    if (category !== 'All') url += `&category=${encodeURIComponent(category)}`;
    if (currentCursor) {
      url += `&cursorUpdatedAt=${encodeURIComponent(currentCursor.updated_at)}`;
      url += `&cursorId=${encodeURIComponent(currentCursor._id)}`;
    }

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.error('Server error:', data.error);
        return;
      }

      currentCursor = data.nextCursor;
      // If nextCursor is null, there are no more pages
      hasMore = !!data.nextCursor;

      renderProducts(data.products);

      if (hasMore) {
        loadMoreBtn.classList.remove('hidden');
      } else {
        loadMoreBtn.classList.add('hidden');
        if (data.products.length === 0 && reset) {
            productGrid.innerHTML = '<p class="no-products">No products found.</p>';
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      isLoading = false;
      loadingIndicator.classList.add('hidden');
    }
  }

  function renderProducts(products) {
    products.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';
      
      const updatedDate = new Date(product.updated_at).toLocaleString();
      
      card.innerHTML = `
        <div class="product-category">${product.category}</div>
        <h3 class="product-name">${product.name}</h3>
        <div class="product-price">$${product.price.toFixed(2)}</div>
        <div class="product-date">Updated: ${updatedDate}</div>
      `;
      productGrid.appendChild(card);
    });
  }

  // Event Listeners
  categoryFilter.addEventListener('change', () => fetchProducts(true));
  loadMoreBtn.addEventListener('click', () => fetchProducts(false));

  // Initial load
  fetchProducts(true);
});
