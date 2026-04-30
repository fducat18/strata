import {
  AssetNotFoundException,
  PortfolioNotFoundException,
  CategoryNotFoundException,
  TagNotFoundException,
  AssetTypeNotFoundException,
  DuplicateNameException,
  CategoryHasChildrenException,
} from './domain.exceptions.js';

describe('Domain Exceptions', () => {
  const cases: Array<[string, new (msg: string) => Error]> = [
    ['AssetNotFoundException', AssetNotFoundException],
    ['PortfolioNotFoundException', PortfolioNotFoundException],
    ['CategoryNotFoundException', CategoryNotFoundException],
    ['TagNotFoundException', TagNotFoundException],
    ['AssetTypeNotFoundException', AssetTypeNotFoundException],
    ['DuplicateNameException', DuplicateNameException],
    ['CategoryHasChildrenException', CategoryHasChildrenException],
  ];

  it.each(cases)(
    '%s has correct name and message',
    (expectedName, ExceptionClass) => {
      const msg = `Test message for ${expectedName}`;
      const error = new ExceptionClass(msg);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe(expectedName);
      expect(error.message).toBe(msg);
    },
  );
});
