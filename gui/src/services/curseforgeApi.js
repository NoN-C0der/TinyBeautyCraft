/**
 * CurseForge API Service
 * Handles all interactions with the CurseForge API
 */

const API_BASE_URL = 'https://api.curseforge.com';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// In-memory cache for API responses
const apiCache = new Map();

/**
 * Get cached data if available and not expired
 */
function getCachedData(key) {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  apiCache.delete(key);
  return null;
}

/**
 * Set data in cache
 */
function setCachedData(key, data) {
  apiCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Clear the entire cache
 */
export function clearCache() {
  apiCache.clear();
}

/**
 * Make a request to the CurseForge API
 * @param {string} endpoint - API endpoint
 * @param {string} apiKey - CurseForge API key
 * @param {object} options - Fetch options
 * @returns {Promise<any>} - API response data
 */
async function curseForgeRequest(endpoint, apiKey, options = {}) {
  const cacheKey = `${endpoint}:${JSON.stringify(options)}`;
  
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log('[CurseForgeAPI] Cache hit:', endpoint);
    return cached;
  }

  console.log('[CurseForgeAPI] Request:', endpoint);

  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await window.electronAPI.curseForgeRequest(url, {
    ...options,
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!response.success) {
    throw new Error(response.error || 'API request failed');
  }

  // Cache successful responses
  setCachedData(cacheKey, response.data);

  return response.data;
}

/**
 * Validate CurseForge API key
 * @param {string} apiKey - API key to validate
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export async function validateApiKey(apiKey) {
  try {
    const result = await curseForgeRequest('/v1/mods/search?gameId=432&pageSize=1', apiKey);
    return { valid: true };
  } catch (error) {
    console.error('[CurseForgeAPI] Key validation failed:', error.message);
    return { 
      valid: false, 
      error: error.message.includes('401') ? 'Invalid API key' : 
             error.message.includes('429') ? 'Rate limit exceeded' : 
             'Connection failed'
    };
  }
}

/**
 * Search for mods on CurseForge
 * @param {string} apiKey - CurseForge API key
 * @param {object} params - Search parameters
 * @returns {Promise<Array>} - List of mods
 */
export async function searchMods(apiKey, params = {}) {
  const {
    gameId = 432, // Minecraft
    searchFilter = '',
    categoryId = 0,
    gameVersion = '',
    sortField = 2, // Sort by popularity
    sortOrder = 'desc',
    index = 0,
    pageSize = 20
  } = params;

  const queryParams = new URLSearchParams({
    gameId: String(gameId),
    index: String(index),
    pageSize: String(pageSize),
    sortField: String(sortField),
    sortOrder
  });

  if (searchFilter) queryParams.append('searchFilter', searchFilter);
  if (categoryId) queryParams.append('classId', String(categoryId));
  if (gameVersion) queryParams.append('gameVersion', gameVersion);

  const endpoint = `/v1/mods/search?${queryParams.toString()}`;
  const result = await curseForgeRequest(endpoint, apiKey);
  
  return result.data || [];
}

/**
 * Get mod details by ID
 * @param {string} apiKey - CurseForge API key
 * @param {number} modId - Mod ID
 * @returns {Promise<object>} - Mod details
 */
export async function getModDetails(apiKey, modId) {
  const endpoint = `/v1/mods/${modId}`;
  const result = await curseForgeRequest(endpoint, apiKey);
  return result.data;
}

/**
 * Get mod files (versions)
 * @param {string} apiKey - CurseForge API key
 * @param {number} modId - Mod ID
 * @returns {Promise<Array>} - List of mod files
 */
export async function getModFiles(apiKey, modId) {
  const endpoint = `/v1/mods/${modId}/files`;
  const result = await curseForgeRequest(endpoint, apiKey);
  return result.data || [];
}

/**
 * Get specific mod file details
 * @param {string} apiKey - CurseForge API key
 * @param {number} modId - Mod ID
 * @param {number} fileId - File ID
 * @returns {Promise<object>} - File details
 */
export async function getModFileDetails(apiKey, modId, fileId) {
  const endpoint = `/v1/mods/${modId}/files/${fileId}`;
  const result = await curseForgeRequest(endpoint, apiKey);
  return result.data;
}

/**
 * Get download URL for a mod file
 * @param {string} apiKey - CurseForge API key
 * @param {number} modId - Mod ID
 * @param {number} fileId - File ID
 * @returns {Promise<string>} - Download URL
 */
export async function getDownloadUrl(apiKey, modId, fileId) {
  const endpoint = `/v1/mods/${modId}/files/${fileId}/download-url`;
  const result = await curseForgeRequest(endpoint, apiKey);
  return result.data?.downloadUrl;
}

/**
 * Get mod categories
 * @param {string} apiKey - CurseForge API key
 * @returns {Promise<Array>} - List of categories
 */
export async function getCategories(apiKey) {
  const endpoint = '/v1/categories?gameId=432';
  const result = await curseForgeRequest(endpoint, apiKey);
  return result.data || [];
}

/**
 * Get game versions for Minecraft
 * @param {string} apiKey - CurseForge API key
 * @returns {Promise<Array>} - List of game versions
 */
export async function getGameVersions(apiKey) {
  const endpoint = '/v1/versions/game/432';
  const result = await curseForgeRequest(endpoint, apiKey);
  return result.data || [];
}

/**
 * Get mod dependencies
 * @param {string} apiKey - CurseForge API key
 * @param {number} modId - Mod ID
 * @param {number} fileId - File ID
 * @returns {Promise<Array>} - List of dependencies
 */
export async function getModDependencies(apiKey, modId, fileId) {
  const endpoint = `/v1/mods/${modId}/files/${fileId}/dependencies`;
  const result = await curseForgeRequest(endpoint, apiKey);
  return result.data || [];
}

/**
 * Get multiple mods by IDs (batch request)
 * @param {string} apiKey - CurseForge API key
 * @param {Array<number>} modIds - Array of mod IDs
 * @returns {Promise<Array>} - List of mods
 */
export async function getModsByIds(apiKey, modIds) {
  if (modIds.length === 0) return [];
  
  const endpoint = '/v1/mods';
  const result = await curseForgeRequest(endpoint, apiKey, {
    method: 'POST',
    body: JSON.stringify({ modIds })
  });
  
  return result.data || [];
}

/**
 * Get featured mods
 * @param {string} apiKey - CurseForge API key
 * @returns {Promise<Array>} - List of featured mods
 */
export async function getFeaturedMods(apiKey) {
  const endpoint = '/v1/mods/featured';
  const result = await curseForgeRequest(endpoint, apiKey);
  return result.data?.data || [];
}

/**
 * Format mod data for UI display
 * @param {object} mod - Raw mod data from API
 * @returns {object} - Formatted mod data
 */
export function formatModData(mod) {
  return {
    id: mod.id,
    name: mod.name,
    slug: mod.slug,
    summary: mod.summary,
    description: mod.description,
    author: mod.authors?.[0]?.name || 'Unknown',
    authors: mod.authors || [],
    logoUrl: mod.logo?.thumbnailUrl || mod.logo?.url || '',
    screenshotUrls: mod.screenshots?.slice(0, 5).map(s => s.thumbnailUrl) || [],
    downloadCount: mod.downloadCount || 0,
    likeCount: mod.thumbsUpCount || 0,
    rating: mod.rating || 0,
    gameVersions: mod.latestFiles?.[0]?.gameVersions || [],
    modType: mod.classId,
    category: mod.category?.name || 'Unknown',
    latestFile: mod.latestFiles?.[0] || null,
    releaseDate: mod.dateModified,
    createdDate: mod.dateCreated
  };
}

/**
 * Format file data for UI display
 * @param {object} file - Raw file data from API
 * @returns {object} - Formatted file data
 */
export function formatFileData(file) {
  return {
    id: file.id,
    displayName: file.displayName,
    fileName: file.fileName,
    fileSize: file.fileLength,
    downloadCount: file.downloadCount,
    gameVersions: file.gameVersions,
    releaseType: file.releaseType, // 1=Release, 2=Beta, 3=Alpha
    releaseDate: file.fileDate,
    downloadUrl: file.downloadUrl,
    isServerPack: file.isServerPack,
    serverPackFileId: file.serverPackFileId
  };
}

/**
 * Dependency types
 */
export const DependencyType = {
  EMBEDDED_LIBRARY: 1,
  OPTIONAL_DEPENDENCY: 2,
  REQUIRED_DEPENDENCY: 3,
  TOOL: 4,
  INCOMPATIBLE: 5,
  INCLUDE: 6
};

/**
 * Release types
 */
export const ReleaseType = {
  RELEASE: 1,
  BETA: 2,
  ALPHA: 3
};

export default {
  validateApiKey,
  searchMods,
  getModDetails,
  getModFiles,
  getModFileDetails,
  getDownloadUrl,
  getCategories,
  getGameVersions,
  getModDependencies,
  getModsByIds,
  getFeaturedMods,
  formatModData,
  formatFileData,
  clearCache,
  DependencyType,
  ReleaseType
};
