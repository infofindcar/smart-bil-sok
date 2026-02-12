

## Fixa hero-bilden pa mobil

### Problemet
Mobilskarmens format (ca 9:19, hogt och smalt) gor det svart att skapa en bild som ser bra ut -- bilden blir antingen for inzoomad eller felcentrerad med `object-cover`.

### Losning
Istallet for att forsoka skapa en perfekt mobil-bild, anpassar vi hur den befintliga bilden visas pa mobil med CSS-justeringar:

1. **Anvand surfplatte-bilden aven for mobil** -- den har ett hogre format som passar battre an desktop-bilden
2. **Justera `object-position`** sa att loggan och bilen centreras korrekt pa smala skarmar
3. **Minska hero-sektionens hojd pa mobil** fran `min-h-screen` till `min-h-[85vh]` sa att bilden inte stracks ut lika mycket
4. **Lagg till en subtil gradient-overlay** langst ned for att mjuka upp overgangen

### Tekniska detaljer

**Fil: `src/pages/Index.tsx`**

- Ta bort den separata mobil-bilden fran `<picture>` -- lat surfplatte-bilden (`hero-tablet.png`) anvandas for bade mobil och surfplatta
- Andra hero-sektionens klass fran `min-h-screen` till `min-h-[85vh] sm:min-h-screen` sa att mobilen far en kortare hero
- Justera `object-position` till `object-[center_35%]` pa mobil for att fokusera pa ratt del av bilden

Resultatet: samma bild pa mobil och surfplatta, men med bra beskaring och proportioner pa bada.

