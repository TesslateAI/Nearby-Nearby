// Utility functions for filtering and sorting data

export const handleSort = (field, currentSortBy, currentSortOrder, setSortBy, setSortOrder) => {
  if (currentSortBy === field) {
    setSortOrder(currentSortOrder === 'asc' ? 'desc' : 'asc');
  } else {
    setSortBy(field);
    setSortOrder('asc');
  }
};

// getSortIcon function should be defined locally in each component since it returns JSX

export const clearAllFilters = (...setters) => {
  setters.forEach(setter => setter(''));
};

export const sortData = (data, sortBy, sortOrder, customSortHandlers = {}) => {
  return [...data].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    // Apply custom sort handlers if provided
    if (customSortHandlers[sortBy]) {
      const result = customSortHandlers[sortBy](a, b, sortOrder);
      if (result !== undefined) return result;
    }

    // Default sorting logic
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
      aValue = aValue ? 1 : 0;
      bValue = bValue ? 1 : 0;
    } else if (Array.isArray(aValue) && Array.isArray(bValue)) {
      aValue = aValue.join(', ').toLowerCase();
      bValue = bValue.join(', ').toLowerCase();
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
};

export const filterByText = (data, searchText, searchFields) => {
  if (!searchText) return data;

  const searchLower = searchText.toLowerCase();
  return data.filter(item => {
    return searchFields.some(field => {
      const value = item[field];
      if (Array.isArray(value)) {
        return value.some(v => v.toLowerCase().includes(searchLower));
      }
      return value?.toLowerCase().includes(searchLower);
    });
  });
};

export const filterByField = (data, filterValue, fieldName) => {
  if (!filterValue) return data;

  return data.filter(item => {
    const value = item[fieldName];
    if (Array.isArray(value)) {
      return value.includes(filterValue);
    }
    return value === filterValue;
  });
};

export const filterByBoolean = (data, filterValue, fieldName) => {
  if (filterValue === '') return data;

  const boolValue = filterValue === 'true';
  return data.filter(item => item[fieldName] === boolValue);
};

export const getUniqueValues = (data, fieldName) => {
  const values = new Set();
  data.forEach(item => {
    const value = item[fieldName];
    if (Array.isArray(value)) {
      value.forEach(v => values.add(v));
    } else if (value) {
      values.add(value);
    }
  });
  return Array.from(values).map(value => ({ value, label: value }));
};