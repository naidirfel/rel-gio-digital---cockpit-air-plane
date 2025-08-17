# Relógio Digital - Cockpit de Avião ✈️

Um relógio digital moderno com tema de cockpit de avião, incluindo cronômetro, timer e alarme configurável.

## 🚀 Funcionalidades

### Relógio Principal
- Display digital com horário atual
- Formato 24h ou 12h (AM/PM)
- Opção de mostrar/ocultar segundos
- Data completa em português

### Cronômetro
- Cronômetro preciso com controles START/STOP/RESET
- Display no formato HH:MM:SS
- Interface intuitiva

### Timer
- Timer configurável (minutos e segundos)
- Alerta visual e sonoro quando chega a zero
- Controles START/STOP/RESET/SET

### Alarme
- Configuração de horário do alarme
- 5 tipos diferentes de sons:
  - Beep Padrão
  - Alerta de Cockpit
  - Beep de Rádio
  - Tom de Aviso
  - Campainha Suave
- Ativação/desativação do alarme
- LED indicador de status

### Tema Cockpit de Avião
- Interface inspirada em painéis de instrumentos de aeronaves
- Indicadores simulados de altitude, direção e velocidade
- Animações de varredura e efeitos visuais
- LEDs de status (Alarme, Timer, Bateria)
- Design responsivo para diferentes tamanhos de tela

## 📱 Compatibilidade PWA (Progressive Web App)

Este aplicativo é uma PWA completa, pronta para:
- Instalação no dispositivo
- Funcionamento offline
- Ícones personalizados
- Atalhos rápidos

## 🎯 Como Usar

1. **Abrir o App**: Abra o arquivo `index.html` no navegador
2. **Trocar Modos**: Use os botões RELÓGIO, CRONÔMETRO, TIMER, ALARME
3. **Configurar**: Clique em CONFIG para acessar as configurações
4. **Cronômetro**: Use START/STOP para controlar e RESET para zerar
5. **Timer**: Configure o tempo em CONFIG, use SET para aplicar, START/STOP para controlar
6. **Alarme**: Configure horário e som em CONFIG, ative/desative conforme necessário

## 📲 Publicação na Play Store

### Opção 1: PWA (Mais Simples)
1. Hospedar os arquivos em um servidor HTTPS
2. Usuários podem "instalar" via navegador
3. Funciona como app nativo

### Opção 2: App Híbrido (Recomendado)
Use **Capacitor** ou **Cordova** para criar um APK:

```bash
# Instalar Capacitor
npm install -g @capacitor/cli

# Inicializar projeto
npx cap init

# Adicionar plataforma Android
npx cap add android

# Copiar arquivos web
npx cap copy

# Abrir no Android Studio
npx cap open android
```

### Opção 3: Trusted Web Activity (TWA)
Use **Bubblewrap** para criar um APK que encapsula a PWA:

```bash
# Instalar Bubblewrap
npm install -g @bubblewrap/cli

# Inicializar TWA
bubblewrap init --manifest https://seusite.com/manifest.json

# Construir APK
bubblewrap build
```

## 🛠️ Estrutura do Projeto

```
DigitalCockpitWatch/
├── index.html          # Página principal
├── styles.css          # Estilos do tema cockpit
├── script.js           # Lógica do aplicativo
├── manifest.json       # Configuração PWA
├── sw.js              # Service Worker
├── icon.svg           # Ícone do aplicativo
└── README.md          # Este arquivo
```

## 🎨 Personalização

### Cores do Tema
- Verde principal: `#00ff00`
- Azul ciano: `#00cccc`
- Laranja: `#ffaa00`
- Fundo escuro: `#1a1a1a`

### Modificar Sons
Os sons são gerados via Web Audio API no arquivo `script.js`. Para personalizar:

```javascript
const alarmSounds = {
    'meu-som': { frequency: 800, duration: 0.5 }
};
```

## 🔧 Requisitos Técnicos

- Navegador moderno com suporte a:
  - ES6+ JavaScript
  - Web Audio API
  - Service Workers
  - Local Storage
  - CSS Grid/Flexbox

## 📄 Licença

Este projeto é de código aberto. Sinta-se livre para modificar e distribuir.

## 🤝 Contribuições

Contribuições são bem-vindas! Algumas ideias para melhorias:
- Mais temas visuais
- Sons de alarme em arquivo
- Múltiplos alarmes
- Fuso horário mundial
- Integração com calendário

---

**Desenvolvido com ❤️ love para entusiastas da aviação**
