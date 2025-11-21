import { http } from "../utils/http";

export interface Favorite {
  favoriteId?: number;
  userId: number;
  contextType: string;
  contextId: number;
}

export interface FavoriteResponse {
  favoriteId: number;
  userId: number;
  contextType: string;
  contextId: number;
}

/**
 * Add an item to favorites
 */
export async function addToFavorites(
  userId: number,
  contextType: string,
  contextId: number
): Promise<FavoriteResponse> {
  const response = await http.post<FavoriteResponse>("/api/favorites", {
    userId,
    contextType,
    contextId,
  });
  
  // Handle nested response structure
  const data = (response as any)?.data?.data || (response as any)?.data || response;
  return data as FavoriteResponse;
}

/**
 * Get user's favorites by context type
 */
export async function getUserFavorites(
  userId: number,
  contextType: string = "auction"
): Promise<FavoriteResponse[]> {
  const response = await http.get<FavoriteResponse[]>(
    `/api/favorites/${userId}?contextType=${contextType}`
  );
  
  // Handle nested response structure
  const data = (response as any)?.data?.data || (response as any)?.data || response;
  return Array.isArray(data) ? data : [];
}

/**
 * Remove an item from favorites
 */
export async function removeFromFavorites(
  userId: number,
  contextType: string,
  contextId: number
): Promise<void> {
  await http.delete(
    `/api/favorites?userId=${userId}&contextType=${contextType}&contextId=${contextId}`
  );
}

/**
 * Check if an item is in user's favorites
 */
export async function isFavorite(
  userId: number,
  contextType: string,
  contextId: number
): Promise<boolean> {
  try {
    const favorites = await getUserFavorites(userId, contextType);
    return favorites.some((fav) => fav.contextId === contextId);
  } catch (error) {
    console.error("Error checking favorite status:", error);
    return false;
  }
}

