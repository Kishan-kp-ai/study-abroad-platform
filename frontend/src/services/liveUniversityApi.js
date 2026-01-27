import api from './api';

const liveUniversityApi = {
  async searchUniversities(query, limit = 20) {
    const response = await api.get('/live-universities/search', {
      params: { q: query, limit }
    });
    return response.data;
  },

  async getByCountry(country, limit = 50) {
    const response = await api.get(`/live-universities/by-country/${encodeURIComponent(country)}`, {
      params: { limit }
    });
    return response.data;
  },

  async getDetails(universityId) {
    const response = await api.get(`/live-universities/details/${encodeURIComponent(universityId)}`);
    return response.data;
  },

  async getRecommended() {
    const response = await api.get('/live-universities/recommended');
    return response.data;
  },

  async getForMe(limit = 100) {
    const response = await api.get('/live-universities/for-me', {
      params: { limit }
    });
    return response.data;
  },

  async getMySelections() {
    const response = await api.get('/live-universities/my-selections');
    return response.data;
  },

  async shortlistUniversity(universityId, universityName, country, category = 'target') {
    const response = await api.post('/live-universities/shortlist', {
      universityId,
      universityName,
      country,
      category
    });
    return response.data;
  },

  async removeFromShortlist(universityId) {
    const response = await api.delete(`/live-universities/shortlist/${encodeURIComponent(universityId)}`);
    return response.data;
  },

  async lockUniversity(universityId, universityName, country) {
    const response = await api.post('/live-universities/lock', {
      universityId,
      universityName,
      country
    });
    return response.data;
  },

  async unlockUniversity(universityId) {
    const response = await api.delete(`/live-universities/lock/${encodeURIComponent(universityId)}`);
    return response.data;
  }
};

export default liveUniversityApi;
