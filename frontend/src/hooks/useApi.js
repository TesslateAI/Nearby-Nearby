import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import api from '../services/api';

export const useApiRequest = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiCall, options = {}) => {
    const { 
      successMessage, 
      errorMessage = 'An error occurred',
      showNotification = true 
    } = options;

    setLoading(true);
    setError(null);

    try {
      const response = await apiCall();
      
      if (showNotification && successMessage) {
        notifications.show({
          title: 'Success',
          message: successMessage,
          color: 'green',
        });
      }

      return response;
    } catch (err) {
      const message = err.response?.data?.detail || errorMessage;
      setError(message);
      
      if (showNotification) {
        notifications.show({
          title: 'Error',
          message,
          color: 'red',
        });
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, loading, error };
};

export const usePOI = () => {
  const { execute, loading, error } = useApiRequest();

  const fetchPOIs = useCallback(async (params = {}) => {
    return execute(() => api.get('/api/pois/', { params }));
  }, [execute]);

  const fetchPOI = useCallback(async (id) => {
    return execute(() => api.get(`/api/pois/${id}`));
  }, [execute]);

  const createPOI = useCallback(async (data) => {
    return execute(() => api.post('/api/pois/', data), {
      successMessage: 'POI created successfully',
    });
  }, [execute]);

  const updatePOI = useCallback(async (id, data) => {
    return execute(() => api.put(`/api/pois/${id}`, data), {
      successMessage: 'POI updated successfully',
    });
  }, [execute]);

  const deletePOI = useCallback(async (id) => {
    return execute(() => api.delete(`/api/pois/${id}`), {
      successMessage: 'POI deleted successfully',
    });
  }, [execute]);

  return {
    fetchPOIs,
    fetchPOI,
    createPOI,
    updatePOI,
    deletePOI,
    loading,
    error,
  };
};

export const useCategories = () => {
  const { execute, loading, error } = useApiRequest();

  const fetchCategories = useCallback(async () => {
    return execute(() => api.get('/api/categories/'));
  }, [execute]);

  const createCategory = useCallback(async (data) => {
    return execute(() => api.post('/api/categories/', data), {
      successMessage: 'Category created successfully',
    });
  }, [execute]);

  const updateCategory = useCallback(async (id, data) => {
    return execute(() => api.put(`/api/categories/${id}`, data), {
      successMessage: 'Category updated successfully',
    });
  }, [execute]);

  const deleteCategory = useCallback(async (id) => {
    return execute(() => api.delete(`/api/categories/${id}`), {
      successMessage: 'Category deleted successfully',
    });
  }, [execute]);

  return {
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    loading,
    error,
  };
};

export const useAttributes = () => {
  const { execute, loading, error } = useApiRequest();

  const fetchAttributes = useCallback(async () => {
    return execute(() => api.get('/api/attributes/'));
  }, [execute]);

  const createAttribute = useCallback(async (data) => {
    return execute(() => api.post('/api/attributes/', data), {
      successMessage: 'Attribute created successfully',
    });
  }, [execute]);

  const updateAttribute = useCallback(async (id, data) => {
    return execute(() => api.put(`/api/attributes/${id}`, data), {
      successMessage: 'Attribute updated successfully',
    });
  }, [execute]);

  const deleteAttribute = useCallback(async (id) => {
    return execute(() => api.delete(`/api/attributes/${id}`), {
      successMessage: 'Attribute deleted successfully',
    });
  }, [execute]);

  return {
    fetchAttributes,
    createAttribute,
    updateAttribute,
    deleteAttribute,
    loading,
    error,
  };
};

export const useRelationships = () => {
  const { execute, loading, error } = useApiRequest();

  const fetchRelationships = useCallback(async (poiId) => {
    return execute(() => api.get(`/api/pois/${poiId}/relationships`));
  }, [execute]);

  const createRelationship = useCallback(async (data) => {
    return execute(() => api.post('/api/relationships/', data), {
      successMessage: 'Relationship created successfully',
    });
  }, [execute]);

  const deleteRelationship = useCallback(async (id) => {
    return execute(() => api.delete(`/api/relationships/${id}`), {
      successMessage: 'Relationship removed successfully',
    });
  }, [execute]);

  return {
    fetchRelationships,
    createRelationship,
    deleteRelationship,
    loading,
    error,
  };
};