module.exports = {
  schemaFile: './swagger.json',
  apiFile: './apps/hospital-portal/src/features/api.ts',
  outputFile: './apps/hospital-portal/src/features/generatedApi.ts',
  exportName: 'generatedApi',
  hooks: true,
  tag: true,
  unionUndefined: false,
  flattenArg: true,
};
