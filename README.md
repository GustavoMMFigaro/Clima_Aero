# Clima Aero

Site de previsão do tempo no estilo Frutiger Aero, feito com **Vite + React + TypeScript** a partir do protótipo no Figma, usando dados da **[Open-Meteo](https://open-meteo.com/)** (gratuita, sem chave de API).

## Como rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera a versão de produção em dist/
```

## Telas

| Rota          | Tela        | Conteúdo                                                                                              |
| ------------- | ----------- | ----------------------------------------------------------------------------------------------------- |
| `#/`          | Início      | Clima atual, próximas horas, alerta, nascer/pôr do sol e métricas (umidade, vento, UV, pressão, visibilidade, qualidade do ar) |
| `#/previsao`  | Previsão    | Próximos 7 / 10 / 16 dias, gráfico de temperatura das próximas 24h e resumo do período                 |
| `#/cidades`   | Cidades     | Cidades salvas (com a sua localização em destaque verde), adicionar e remover cidades                  |

## Estrutura

```
src/
  api/openMeteo.ts      chamadas à Open-Meteo (previsão, geocodificação, qualidade do ar)
  lib/weather.ts        códigos WMO → descrição/ícone, formatação de datas no fuso da cidade
  hooks/                useAsync, useLocalStorage, useHashRoute, useNow
  components/           Header, SearchField, GlossyButton, WeatherIcon, MetricTile, SunArc, TempChart, Cards
  pages/                Home, Forecast, Cities
  assets/figma/         SVGs exportados do Figma (ícones, marca, fundo)
  index.css             tokens do guia de estilo + estilos (vidro, botões glossy, layout responsivo)
```

## Observações

- **Localização:** o navegador pede permissão de geolocalização. O nome da cidade vem da API gratuita da BigDataCloud, porque a Open-Meteo não faz geocodificação reversa. Se a permissão for negada, o site usa a última cidade escolhida (padrão: Londrina).
- **Alertas:** a Open-Meteo não publica alertas oficiais. O cartão de alerta é calculado a partir da previsão das próximas 24h (trovoadas, chuva forte, rajadas ≥ 60 km/h ou UV ≥ 8).
- **Radar:** aparece no menu como "em breve" (não existe no protótipo).
- Cidades salvas e a última cidade ficam no `localStorage` do navegador.
