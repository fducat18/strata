# naming consistency

let's be consistent in naming all XXXService and not a mix of XXXservice and XXXUseCase.

Example in file backend/src/presentation/controllers/asset.controller.ts:

  constructor(
    private readonly assetService: AssetService,
    private readonly assetSnapshotService: AssetSnapshotService,
    private readonly addTag: AddTagToAssetUseCase,
    private readonly removeTagUC: RemoveTagFromAssetUseCase,
    private readonly addCategory: AddCategoryToAssetUseCase,
    private readonly removeCategoryUC: RemoveCategoryFromAssetUseCase,
  )

This should be done in the complete backend code base.

# mappers

Is it normal that in this folder backend/src/presentation/controllers/mappers/
There is only the asset mapper (backend/src/presentation/controllers/mappers/asset.mapper.ts)
I am surprised not to see consistency I expected to see mapper for every object (asset, assetType, portofolio etc.) ??

# request-id middelware

Ok to keep it but the documentation must mention it and explain its purpose clearly for humans.

# prisma warn

I got this log during "npm run docker:dev"

```log
warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please m[+] up 1/2a Prisma config file (e.g., `prisma.config.ts`).
```

=> Update available 6.19.3 -> 7.8.0

# doc site error

after the command "npm run docker:dev"

when I go to <http://localhost:8001>

it goes to <http://localhost:8000/docs/> with:  This site can’t be reached localhost refused to connect.

so I cannot even see the  astro doc site for the moment

# portfolios

when I go to <<http://localhost:4321/portfolios>

I got

Could not load portfolios
There was a problem fetching portfolios.
Retry

same for <http://localhost:4321/assets> and <http://localhost:4321/tags>

# UI

at <http://localhost:4321/categories>

there are 2 buttons to create category, is it useful ??? what's the diff ?

# UI settings

at <http://localhost:4321/settings> the Documentation link is  strata.ducatillon.net/docs but it should be relevant to the env so in this case it should be the dev doc link (<http://localhost:8001> ) ?
