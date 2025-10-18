try {
  const config = require('../config/env');

  console.log('Configuration validated successfully.');
  console.table(
    Object.entries(config)
      .filter(([key]) => key === key.toUpperCase())
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return [key, `${value.length} entr${value.length === 1 ? 'y' : 'ies'}`];
        }

        if (typeof value === 'string') {
          return [key, value ? 'SET' : 'EMPTY'];
        }

        return [key, value];
      })
  );
} catch (error) {
  console.error('Configuration validation failed:', error);
  process.exit(1);
}
