# Logo Hashi App — 15/09/2026

Última revisão: cabeçalho com apenas a logo, sem caminhão, aumentada para 144 × 48 px. Faixa de 64 px preservada. Solicitação do usuário posterior à composição horizontal abaixo; demais telas mantêm a composição anterior.

Refinamento posterior do cabeçalho, solicitado na mesma data: logo à esquerda e caminhão à direita, em composição horizontal menor. Altura do cabeçalho: 64 px. Entrada, login e abertura nativa mantêm o caminhão acima. Validação TypeScript e conferência web em 320/412 px aprovadas.

Criada a pedido do usuário com a ferramenta integrada de geração de imagens, usando `assets/Hashimoto_secundaria.png` como referência. Arquivo: `assets/Hashi_App_v1.png`.

Após aprovação do usuário em 15/09/2026, foi aplicada abaixo do caminhão laranja em `Brand.tsx`, usado pelo cabeçalho, boas-vindas/espera de sessão e login. A abertura nativa usa `assets/splash-hashi-app.png`, configurado em `app.json` e reproduzível por `node scripts/generate-splash.mjs`. Essa abertura requer uma nova compilação nativa para aparecer no aplicativo instalado. O PNG aprovado permanece intacto.

Validação: TypeScript aprovado; entrada, login e cabeçalho renderizados em Chrome com viewport Pixel 7 e conferência visual da entrada/cabeçalho; imagem nativa conferida como arquivo, sem teste de APK no aparelho.

Prompt utilizado:

> Use case: logo-brand. Create one clean horizontal wordmark logo for the application, based closely on the supplied reference image assets/Hashimoto_secundaria.png (reference for typography, orange color and small dotted detail). Exact text: "Hashi App" (H and A capitalized, remaining lowercase, one space between words). Use bold rounded geometric sans-serif lettering similar to the original Hashimoto wordmark; warm vivid orange #ff6200, flat solid fill. Retain a tasteful small dotted accent inspired by the reference near the dot of the i. Balanced spacing, excellent legibility at small sizes, professional and simple. Center a single logo on a genuinely transparent background with modest clear margins. No truck, no extra symbol, no tagline, no mockup, no shadows, no gradients, no additional text. High-resolution crisp edges. This is a new sibling logo, preserve the supplied original image.
