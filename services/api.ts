const EXTERNAL_API_BASE_URL = 'https://assessment.shwapno.app/product';
// Backend API deployed on Vercel
const BACKEND_API_BASE_URL = 'https://aci-backend.vercel.app/api';

export interface Product {
  material: number;
  barcode: string;
  description: string;
  category?: string;
}

export interface ProductResponse {
  status: boolean;
  product: Product;
}

export interface SavedProduct extends Product {
  _id?: string;
  category: string;
  scannedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Fetch product from external API
export async function fetchProductByBarcode(barcode: string): Promise<ProductResponse> {
  const response = await fetch(`${EXTERNAL_API_BASE_URL}/${barcode}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch product: ${response.statusText}`);
  }
  
  const data: ProductResponse = await response.json();
  
  if (!data.status || !data.product) {
    throw new Error('Product not found');
  }
  
  return data;
}

// Save product to backend database
export async function saveProductToDatabase(
  product: Product,
  category: string = 'Uncategorized'
): Promise<SavedProduct> {
  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        material: product.material,
        barcode: product.barcode,
        description: product.description,
        category,
      }),
    });

    const data = await response.json();

    // Backend returns 200 with existing product if it already exists
    if (response.status === 200 && data.message === 'Product already exists') {
      return data.product;
    }

    if (!response.ok) {
      throw new Error(data.message || 'Failed to save product');
    }

    return data.product;
  } catch (error) {
    console.error('Error saving product to database:', error);
    throw error;
  }
}

// Check if product exists in database by barcode
export async function getProductByBarcode(barcode: string): Promise<SavedProduct | null> {
  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/products/${barcode}`);

    if (response.status === 404) {
      return null; // Product not found
    }

    if (!response.ok) {
      throw new Error('Failed to check product');
    }

    const data = await response.json();
    return data.product || null;
  } catch (error) {
    console.error('Error checking product:', error);
    // If it's a network error or 404, return null (product doesn't exist)
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

// Get all products from backend
export async function getAllProducts(category?: string): Promise<SavedProduct[]> {
  try {
    const url = category
      ? `${BACKEND_API_BASE_URL}/products?category=${encodeURIComponent(category)}`
      : `${BACKEND_API_BASE_URL}/products`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

// Update product category
export async function updateProductCategory(
  productId: string,
  category: string
): Promise<SavedProduct> {
  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/products/${productId}/category`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ category }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update product category');
    }

    return data.product;
  } catch (error) {
    console.error('Error updating product category:', error);
    throw error;
  }
}

export interface Category {
  name: string;
  createdAt: string;
}

// Get all categories
export async function getAllCategories(): Promise<string[]> {
  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/categories`);

    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    const data = await response.json();
    // Backend now returns categories with createdAt, sorted by createdAt
    // Extract just the names, they're already sorted
    const categories = data.categories || [];
    return categories.map((cat: Category | string) => 
      typeof cat === 'string' ? cat : cat.name
    );
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

// Create a new category
export async function createCategory(categoryName: string): Promise<string> {
  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: categoryName }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create category');
    }

    return data.category;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}

// Delete a category
export async function deleteCategory(categoryName: string): Promise<void> {
  try {
    const encodedName = encodeURIComponent(categoryName);
    const response = await fetch(`${BACKEND_API_BASE_URL}/categories/${encodedName}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete category');
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}

