# Mermaid graphs  

## Example 1

```mermaid
gitGraph
  commit id: "Debut du patrimoine" tag: "🌱 Origine"
  branch residence_principale
  commit id: "🏠 Appartement Paris 15eme" tag: "2010-06 - 250k€"
  branch residence_secondaire
  commit id: "🏖️ Maison Bretagne" tag: "2015-03 - 180k€"
  checkout main
  merge residence_secondaire tag: "Total: 430k€"
  branch eurl
  commit id: "🏢 EURL Conseil" tag: "2017-09 - 50k€"
  branch locatif
  commit id: "💰 Studio Lyon" tag: "2019-01 - 120k€"
  checkout main
  merge locatif tag: "Total: 600k€"
  checkout locatif
  commit id: "💰 T2 Bordeaux" tag: "2021-06 - 200k€"
  checkout residence_principale
  commit id: "🏠 Maison Neuilly" tag: "2023-11 - 650k€"
  checkout main
  merge residence_principale tag: "Total: 1450k€"
  ```

## Example 2

```mermaid
gitGraph
    commit id: "Patrimoine"
    branch achat
    commit id: "🏠 Home 150k€"
    checkout patrimoine
    merge achat
    checkout achat
    commit id: "🏠 Holiday Home 100k€"
    checkout patrimoine
    merge achat
    checkout achat
    commit id: "🏠 Company 200k€"
    checkout patrimoine
    merge achat
```