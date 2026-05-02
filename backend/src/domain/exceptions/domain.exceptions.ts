export class AssetNotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssetNotFoundException';
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

export class PortfolioSnapshotNotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PortfolioSnapshotNotFoundException';
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

export class AssetAlreadyDisposedException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssetAlreadyDisposedException';
  }
}

export class AssetTypeInUseException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssetTypeInUseException';
  }
}

export class AssetSnapshotNotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssetSnapshotNotFoundException';
  }
}
