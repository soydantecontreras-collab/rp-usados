## ADDED Requirements

### Requirement: fuente aprobada inmutable
El export SHALL usar el HTML del tema y recursos del commit aprobado sin alterar apariencia o comportamiento.

#### Scenario: recursos del hero
- **WHEN** se genera el paquete
- **THEN** hashes de ambos MP4 y posters coinciden con el repositorio
- **AND** CSS y JS provienen del build Vite local.

### Requirement: publicación aislada
La preview SHALL excluir credenciales, runtime administrativo, datos ficticios presentados como stock real, archivos de debug y recursos V1.

#### Scenario: auditoría de upload
- **WHEN** se inspecciona la carpeta publicada
- **THEN** contiene únicamente una lista permitida de recursos de presentación
- **AND** el catálogo incluye nueve vehículos DEMO explícitamente identificados, sin precios ni vendidos; el paquete productivo no recibe fixtures.

#### Scenario: ficha visual demo aprobada
- **WHEN** se revisa /vehiculos/demo-vento/
- **THEN** el título y descripción identifican una demostración sin unidad en venta
- **AND** los valores de desarrollo se identifican como DEMO / no stock real; no se inventa destinatario WhatsApp y las imágenes indican NO ES STOCK.

### Requirement: alcance explícito
La publicación SHALL esperar aprobación del alcance estático y distinguirlo de WordPress remoto.

#### Scenario: testing público
- **WHEN** el usuario aprueba la copia estática
- **THEN** se crea una preview y se documentan ausencia de wp-admin, stock dinámico y datos comerciales pendientes.

### Requirement: responsive aprobado
La preview SHALL cargar sólo el video correspondiente y conservar scroll reversible, fallback y reduced motion.

#### Scenario: red mobile y desktop
- **WHEN** se abre Home y se recarga a mitad del hero
- **THEN** se presenta el frame correcto del recurso seleccionado
- **AND** no se descargan Three.js, GLB, HDR o video del otro perfil.
