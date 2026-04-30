export class AssetNotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssetNotFoundException';
  }
}

export class PortfolioNotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PortfolioNotFoundException';
  }
}

export class CategoryNotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CategoryNotFoundException';
  }
}

export class TagNotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TagNotFoundException';
  }
}

export class AssetTypeNotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssetTypeNotFoundException';
  }
}

export class DuplicateNameException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateNameException';
  }
}

export class CategoryHasChildrenException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CategoryHasChildrenException';
  }
}
