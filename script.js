// Variáveis globais
let currentMode = 'clock';
let stopwatchRunning = false;
let timerRunning = false;
let stopwatchTime = 0;
let timerTime = 0;
let alarmTime = null;
let alarmEnabled = false;
let format24h = true;
let showSeconds = true;
let alarmTimeouts = []; // Para controlar os timeouts do alarme

// Variáveis para alarmes do cronômetro e timer
let stopwatchAlarmTime = 300; // 5 minutos em segundos
let stopwatchAlarmEnabled = false;
let stopwatchAlarmTriggered = false;
let timerWarningTime = 10; // 10 segundos
let timerWarningTriggered = false;

// Intervalos
let clockInterval;
let stopwatchInterval;
let timerInterval;
let instrumentsInterval;

// Elementos DOM
const timeDisplay = document.getElementById('timeDisplay');
const dateDisplay = document.getElementById('dateDisplay');
const modeIndicator = document.getElementById('modeIndicator');
const configPanel = document.getElementById('configPanel');
const alarmAudio = document.getElementById('alarmAudio');

// Botões
const modeButtons = document.querySelectorAll('.mode-btn');
const startStopBtn = document.getElementById('startStopBtn');
const resetBtn = document.getElementById('resetBtn');
const setBtn = document.getElementById('setBtn');
const configBtn = document.getElementById('configBtn');
const closeConfigBtn = document.getElementById('closeConfig');

// LEDs de status
const alarmLed = document.getElementById('alarmLed');
const timerLed = document.getElementById('timerLed');
const batteryLed = document.getElementById('batteryLed');

// Instrumentos
const altitudeDisplay = document.getElementById('altitude');
const headingDisplay = document.getElementById('heading');
const speedDisplay = document.getElementById('speed');

// Configurações
const alarmTimeInput = document.getElementById('alarmTime');
const alarmSoundSelect = document.getElementById('alarmSound');
const alarmEnabledCheck = document.getElementById('alarmEnabled');
const timerMinutesInput = document.getElementById('timerMinutes');
const timerSecondsInput = document.getElementById('timerSeconds');
const timerWarningTimeInput = document.getElementById('timerWarningTime');
const timerWarningSoundSelect = document.getElementById('timerWarningSound');
const stopwatchAlarmTimeInput = document.getElementById('stopwatchAlarmTime');
const stopwatchAlarmSoundSelect = document.getElementById('stopwatchAlarmSound');
const stopwatchAlarmEnabledCheck = document.getElementById('stopwatchAlarmEnabled');
const format24hCheck = document.getElementById('format24h');
const showSecondsCheck = document.getElementById('showSeconds');

// Elementos para arquivo personalizado
const customAudioRow = document.getElementById('customAudioRow');
const customAudioFile = document.getElementById('customAudioFile');
const selectAudioBtn = document.getElementById('selectAudioBtn');
const previewAudioBtn = document.getElementById('previewAudioBtn');
const selectedFileName = document.getElementById('selectedFileName');

// Variáveis para arquivo personalizado
let customAudioData = null;
let customAudioName = '';
let previewAudio = null;

// Sons de alarme (simulados com Web Audio API)
const alarmSounds = {
    'beep': { frequency: 800, duration: 0.5, repeat: 3 },
    'cockpit': { frequency: 1000, duration: 0.3, repeat: 5 },
    'radio': { frequency: 600, duration: 0.8, repeat: 2 },
    'warning': { frequency: 1200, duration: 0.4, repeat: 4 },
    'chime': { frequency: 440, duration: 1.0, repeat: 2 },
    'pullup': { frequency: 800, duration: 0.8, repeat: 3, voice: 'PULL UP, PULL UP', priority: 'critical' },
    'terrain': { frequency: 900, duration: 0.7, repeat: 4, voice: 'TERRAIN, TERRAIN', priority: 'warning' },
    'bankangle': { frequency: 750, duration: 0.6, repeat: 3, voice: 'BANK ANGLE, BANK ANGLE', priority: 'caution' },
    'windshear': { frequency: 1100, duration: 0.9, repeat: 2, voice: 'WINDSHEAR, WINDSHEAR', priority: 'critical' }
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    startClock();
    startInstruments();
    loadSettings();
    initializeVoices();
    startAlarmChecker();
});

// Função para inicializar e carregar vozes disponíveis
function initializeVoices() {
    if ('speechSynthesis' in window) {
        // Aguardar carregamento das vozes
        const loadVoices = () => {
            const voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
                console.log('Vozes disponíveis carregadas:', voices.length);
                // Listar vozes masculinas disponíveis para debug
                const maleVoices = voices.filter(voice => 
                    voice.lang.startsWith('en') && 
                    (voice.name.toLowerCase().includes('male') || 
                     voice.name.toLowerCase().includes('david') ||
                     voice.name.toLowerCase().includes('mark'))
                );
                if (maleVoices.length > 0) {
                    console.log('Vozes masculinas encontradas:', maleVoices.map(v => v.name));
                }
            }
        };
        
        // Tentar carregar imediatamente
        loadVoices();
        
        // Aguardar evento de carregamento se necessário
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoices;
        }
    }
}

function initializeApp() {
    updateDisplay();
    updateModeIndicator();
    batteryLed.classList.add('active');
    
    // Adicionar classes de cor aos LEDs
    alarmLed.classList.add('alarm');
    timerLed.classList.add('timer');
    
    // Garantir que o LED do alarm seja atualizado após a inicialização
    setTimeout(() => {
        updateAlarmLedState();
    }, 100);
}

function setupEventListeners() {
    // Botões de modo
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Se o alarme estiver tocando, parar primeiro
            if (alarmTimeouts.length > 0) {
                stopAlarm();
                return;
            }
            switchMode(btn.dataset.mode);
        });
    });

    // Botões de ação
    startStopBtn.addEventListener('click', () => {
        // Se o alarme estiver tocando, parar primeiro
        if (alarmTimeouts.length > 0) {
            stopAlarm();
            return;
        }
        handleStartStop();
    });
    resetBtn.addEventListener('click', () => {
        // Se o alarme estiver tocando, parar primeiro
        if (alarmTimeouts.length > 0) {
            stopAlarm();
            return;
        }
        handleReset();
    });
    setBtn.addEventListener('click', () => {
        // Se o alarme estiver tocando, parar primeiro
        if (alarmTimeouts.length > 0) {
            stopAlarm();
            return;
        }
        handleSet();
    });
    configBtn.addEventListener('click', toggleConfig);
    closeConfigBtn.addEventListener('click', toggleConfig);

    // Configurações
    alarmTimeInput.addEventListener('change', updateAlarmTime);
    alarmSoundSelect.addEventListener('change', saveSettings);
    alarmEnabledCheck.addEventListener('change', toggleAlarm);
    timerMinutesInput.addEventListener('change', saveSettings);
    timerSecondsInput.addEventListener('change', saveSettings);
    timerWarningTimeInput.addEventListener('change', saveSettings);
    timerWarningSoundSelect.addEventListener('change', saveSettings);
    stopwatchAlarmTimeInput.addEventListener('change', updateStopwatchAlarmTime);
    stopwatchAlarmSoundSelect.addEventListener('change', saveSettings);
    stopwatchAlarmEnabledCheck.addEventListener('change', toggleStopwatchAlarm);
    format24hCheck.addEventListener('change', toggleFormat);
    showSecondsCheck.addEventListener('change', toggleSeconds);
    
    // Event listeners para arquivo personalizado
    alarmSoundSelect.addEventListener('change', handleAlarmSoundChange);
    selectAudioBtn.addEventListener('click', () => customAudioFile.click());
    customAudioFile.addEventListener('change', handleCustomAudioSelection);
    previewAudioBtn.addEventListener('click', previewCustomAudio);
    
    // Tecla Escape para parar alarme
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && alarmTimeouts.length > 0) {
            stopAlarm();
        }
    });
    
    // Clique em qualquer lugar para parar alarme
    document.addEventListener('click', (e) => {
        if (alarmTimeouts.length > 0 && !e.target.closest('.config-panel')) {
            stopAlarm();
        }
    });
}

function switchMode(mode) {
    currentMode = mode;
    
    // Atualizar botões
    modeButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    
    // Parar intervalos anteriores
    if (stopwatchInterval) clearInterval(stopwatchInterval);
    if (timerInterval) clearInterval(timerInterval);
    
    // Resetar estados
    stopwatchRunning = false;
    timerRunning = false;
    
    updateModeIndicator();
    updateDisplay();
    updateActionButtons();
}

function updateModeIndicator() {
    const modeNames = {
        'clock': 'RELÓGIO',
        'stopwatch': 'CRONÔMETRO',
        'timer': 'TIMER',
        'alarm': 'ALARME'
    };
    modeIndicator.textContent = modeNames[currentMode];
}

function startClock() {
    clockInterval = setInterval(() => {
        updateDisplay();
        checkAlarm();
    }, 1000);
}

function updateDisplay() {
    const now = new Date();
    
    switch (currentMode) {
        case 'clock':
            displayClock(now);
            break;
        case 'stopwatch':
            displayStopwatch();
            break;
        case 'timer':
            displayTimer();
            break;
        case 'alarm':
            displayAlarm();
            break;
    }
    
    updateDate(now);
}

function displayClock(now) {
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    if (!format24h) {
        hours = hours % 12 || 12;
    }
    
    let timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    if (showSeconds) {
        timeString += `:${seconds.toString().padStart(2, '0')}`;
    }
    
    if (!format24h) {
        timeString += ` ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
    }
    
    timeDisplay.textContent = timeString;
}

function displayStopwatch() {
    const hours = Math.floor(stopwatchTime / 3600);
    const minutes = Math.floor((stopwatchTime % 3600) / 60);
    const seconds = stopwatchTime % 60;
    
    timeDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Verificar alarme do cronômetro
    if (stopwatchAlarmEnabled && !stopwatchAlarmTriggered && stopwatchTime >= stopwatchAlarmTime) {
        stopwatchAlarmTriggered = true;
        const soundType = stopwatchAlarmSoundSelect.value || 'beep';
        playAlarm('stopwatch', soundType);
        flashDisplay();
    }
}

function displayTimer() {
    const hours = Math.floor(timerTime / 3600);
    const minutes = Math.floor((timerTime % 3600) / 60);
    const seconds = timerTime % 60;
    
    timeDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Verificar aviso do timer
    if (timerRunning && !timerWarningTriggered && timerTime <= timerWarningTime && timerTime > 0) {
        timerWarningTriggered = true;
        const soundType = timerWarningSoundSelect.value || 'warning';
        playAlarm('timer-warning', soundType);
    }
    
    if (timerTime <= 0 && timerRunning) {
        timerRunning = false;
        clearInterval(timerInterval);
        playAlarm('timer');
        flashDisplay();
        updateActionButtons();
    }
}

function displayAlarm() {
    if (alarmTime) {
        timeDisplay.textContent = alarmTime;
    } else {
        timeDisplay.textContent = '00:00';
    }
}

function updateDate(now) {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    const dayName = days[now.getDay()];
    const day = now.getDate().toString().padStart(2, '0');
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    
    dateDisplay.textContent = `${dayName}, ${day} ${month} ${year}`;
}

function handleStartStop() {
    switch (currentMode) {
        case 'stopwatch':
            if (stopwatchRunning) {
                stopStopwatch();
            } else {
                startStopwatch();
            }
            break;
        case 'timer':
            if (timerRunning) {
                stopTimer();
            } else {
                startTimer();
            }
            break;
    }
    updateActionButtons();
}

function handleReset() {
    switch (currentMode) {
        case 'stopwatch':
            resetStopwatch();
            break;
        case 'timer':
            resetTimer();
            break;
    }
    updateActionButtons();
}

function handleSet() {
    switch (currentMode) {
        case 'timer':
            setTimer();
            break;
        case 'alarm':
            toggleConfig();
            break;
    }
}

function startStopwatch() {
    stopwatchRunning = true;
    stopwatchInterval = setInterval(() => {
        stopwatchTime++;
        displayStopwatch();
    }, 1000);
}

function stopStopwatch() {
    stopwatchRunning = false;
    clearInterval(stopwatchInterval);
}

function resetStopwatch() {
    stopStopwatch();
    stopwatchTime = 0;
    stopwatchAlarmTriggered = false; // Reset do flag do alarme
    displayStopwatch();
}

function startTimer() {
    if (timerTime > 0) {
        timerRunning = true;
        timerWarningTriggered = false; // Reset do flag do aviso ao iniciar
        timerLed.classList.add('active');
        timerInterval = setInterval(() => {
            timerTime--;
            displayTimer();
        }, 1000);
    }
}

function stopTimer() {
    timerRunning = false;
    timerLed.classList.remove('active');
    clearInterval(timerInterval);
}

function resetTimer() {
    stopTimer();
    timerWarningTriggered = false; // Reset do flag do aviso
    setTimer();
}

function setTimer() {
    const minutes = parseInt(timerMinutesInput.value) || 0;
    const seconds = parseInt(timerSecondsInput.value) || 0;
    timerTime = (minutes * 60) + seconds;
    displayTimer();
}

function updateActionButtons() {
    startStopBtn.classList.remove('active');
    
    switch (currentMode) {
        case 'stopwatch':
            startStopBtn.textContent = stopwatchRunning ? 'STOP' : 'START';
            startStopBtn.style.display = 'block';
            resetBtn.style.display = 'block';
            setBtn.style.display = 'none';
            if (stopwatchRunning) startStopBtn.classList.add('active');
            break;
        case 'timer':
            startStopBtn.textContent = timerRunning ? 'STOP' : 'START';
            startStopBtn.style.display = 'block';
            resetBtn.style.display = 'block';
            setBtn.style.display = 'block';
            if (timerRunning) startStopBtn.classList.add('active');
            break;
        case 'alarm':
            startStopBtn.style.display = 'none';
            resetBtn.style.display = 'none';
            setBtn.style.display = 'block';
            setBtn.textContent = 'CONFIG';
            break;
        default:
            startStopBtn.style.display = 'none';
            resetBtn.style.display = 'none';
            setBtn.style.display = 'none';
    }
}

function toggleConfig() {
    configPanel.classList.toggle('show');
}

function updateAlarmTime() {
    alarmTime = alarmTimeInput.value;
    if (currentMode === 'alarm') {
        displayAlarm();
    }
    saveSettings();
    
    // Agendar notificação no Service Worker
    if (alarmTime) {
        const [hours, minutes] = alarmTime.split(':').map(Number);
        scheduleAlarmNotification('main-alarm', hours * 60 + minutes, alarmSoundSelect.value, alarmEnabled);
    }
}

function toggleAlarm() {
    alarmEnabled = alarmEnabledCheck.checked;
    updateAlarmLedState();
    
    if (alarmEnabled) {
        // Agendar notificação
        if (alarmTime) {
            const [hours, minutes] = alarmTime.split(':').map(Number);
            scheduleAlarmNotification('main-alarm', hours * 60 + minutes, alarmSoundSelect.value, true);
        }
    } else {
        // Cancelar notificação
        cancelAlarmNotification('main-alarm');
    }
    saveSettings();
}

function updateAlarmLedState() {
    if (alarmEnabled) {
        alarmLed.classList.add('active');
    } else {
        alarmLed.classList.remove('active');
    }
}

function toggleFormat() {
    format24h = format24hCheck.checked;
    updateDisplay();
    saveSettings();
}

function toggleSeconds() {
    showSeconds = showSecondsCheck.checked;
    updateDisplay();
    saveSettings();
}

function updateStopwatchAlarmTime() {
    const timeValue = stopwatchAlarmTimeInput.value;
    if (timeValue) {
        const [hours, minutes, seconds] = timeValue.split(':').map(Number);
        stopwatchAlarmTime = (hours * 3600) + (minutes * 60) + (seconds || 0);
        saveSettings();
    }
}

function toggleStopwatchAlarm() {
    stopwatchAlarmEnabled = stopwatchAlarmEnabledCheck.checked;
    saveSettings();
}

// Funções para arquivo personalizado
function handleAlarmSoundChange() {
    const isCustom = alarmSoundSelect.value === 'custom';
    customAudioRow.style.display = isCustom ? 'flex' : 'none';
    saveSettings();
}

function handleCustomAudioSelection(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validar formato de arquivo
    const validFormats = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/m4a'];
    if (!validFormats.includes(file.type)) {
        alert('Formato de arquivo não suportado. Use MP3, WAV, OGG ou M4A.');
        return;
    }
    
    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('Arquivo muito grande. Máximo 10MB.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        customAudioData = e.target.result;
        customAudioName = file.name;
        selectedFileName.textContent = file.name;
        previewAudioBtn.style.display = 'inline-block';
        saveSettings();
    };
    reader.readAsDataURL(file);
}

function previewCustomAudio() {
    if (!customAudioData) return;
    
    // Parar preview anterior se existir
    if (previewAudio) {
        previewAudio.pause();
        previewAudio = null;
    }
    
    previewAudio = new Audio(customAudioData);
    previewAudio.volume = 0.7;
    previewAudio.play().catch(error => {
        console.error('Erro ao reproduzir preview:', error);
        alert('Erro ao reproduzir o arquivo de áudio.');
    });
    
    // Parar após 5 segundos
    setTimeout(() => {
        if (previewAudio) {
            previewAudio.pause();
            previewAudio = null;
        }
    }, 5000);
}

function playCustomAlarm() {
    if (!customAudioData) return;
    
    try {
        const customAlarmAudio = new Audio(customAudioData);
        customAlarmAudio.volume = 1.0;
        customAlarmAudio.loop = false;
        
        // Reproduzir o arquivo
        customAlarmAudio.play().catch(error => {
            console.error('Erro ao reproduzir alarme personalizado:', error);
            // Fallback para alarme padrão
            const sound = alarmSounds['beep'];
            playDefaultAlarm(sound);
        });
        
        // Repetir o alarme por 30 segundos
        const alarmDuration = 30000;
        const audioLength = customAlarmAudio.duration || 5; // Estimar 5s se não conseguir obter duração
        
        customAlarmAudio.addEventListener('loadedmetadata', () => {
            const actualDuration = customAlarmAudio.duration * 1000; // Converter para ms
            const repeatCount = Math.floor(alarmDuration / actualDuration);
            
            for (let i = 1; i < repeatCount; i++) {
                const timeoutId = setTimeout(() => {
                    const repeatAudio = new Audio(customAudioData);
                    repeatAudio.volume = 1.0;
                    repeatAudio.play().catch(console.error);
                }, i * actualDuration);
                alarmTimeouts.push(timeoutId);
            }
        });
        
        // Auto-parar após 30 segundos
        const autoStopTimeout = setTimeout(() => {
            stopAlarm();
        }, alarmDuration);
        alarmTimeouts.push(autoStopTimeout);
        
    } catch (error) {
        console.error('Erro ao reproduzir alarme personalizado:', error);
        // Fallback para alarme padrão
        const sound = alarmSounds['beep'];
        playDefaultAlarm(sound);
    }
}

function playDefaultAlarm(sound) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(sound.frequency, audioContext.currentTime);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(1.0, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.3, audioContext.currentTime + sound.duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + sound.duration);
    } catch (error) {
        console.error('Erro ao reproduzir alarme padrão:', error);
    }
}

function checkAlarm() {
    if (!alarmEnabled || !alarmTime) return;
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Debug: log para verificar se está funcionando
    if (now.getSeconds() === 0) {
        console.log(`Verificando alarme: ${currentTime} vs ${alarmTime}, Ativo: ${alarmEnabled}`);
    }
    
    if (currentTime === alarmTime && now.getSeconds() === 0) {
        console.log('🔔 ALARME DISPARADO!');
        playAlarm('alarm');
        flashDisplay();
        alarmLed.classList.add('alarm');
        setTimeout(() => alarmLed.classList.remove('alarm'), 5000);
    }
}

function stopAlarm() {
    // Limpar todos os timeouts do alarme
    alarmTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    alarmTimeouts = [];
    
    // Parar síntese de voz
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
    }
    
    // Remover classe de alarme do LED
    alarmLed.classList.remove('alarm');
    
    console.log('Alarme parado');
}

function playAlarm(type = 'alarm', customSoundType = null) {
    const soundType = customSoundType || (type === 'alarm' ? alarmSoundSelect.value : 'beep');
    
    // Limpar alarmes anteriores
    stopAlarm();
    
    // Se for arquivo personalizado, usar reprodução de áudio
    if (soundType === 'custom' && customAudioData) {
        playCustomAlarm();
        return;
    }
    
    const sound = alarmSounds[soundType] || alarmSounds['beep'];
    
    try {
        // Criar múltiplos sons simultâneos usando Web Audio API para efeito de coro
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Criar 3 osciladores com frequências ligeiramente diferentes
        const frequencyVariations = [
            sound.frequency * 0.95,  // Frequência mais grave
            sound.frequency,         // Frequência base
            sound.frequency * 1.05   // Frequência mais aguda
        ];
        
        frequencyVariations.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.6, audioContext.currentTime); // Volume reduzido para evitar distorção
            gainNode.gain.exponentialRampToValueAtTime(0.2, audioContext.currentTime + sound.duration);
            
            // Pequeno delay entre osciladores para efeito de coro
            oscillator.start(audioContext.currentTime + (index * 0.01));
            oscillator.stop(audioContext.currentTime + sound.duration + (index * 0.01));
        });
    
        // Adicionar múltiplas vozes sintéticas simultâneas para criar efeito de coro
        if (sound.voice && 'speechSynthesis' in window) {
            // Configurações base por tipo de alerta
            let baseConfig = {};
            switch(soundType) {
                case 'pullup':
                    baseConfig = { rate: 0.7, basePitch: 0.4, volume: 0.8 };
                    break;
                case 'terrain':
                    baseConfig = { rate: 0.8, basePitch: 0.5, volume: 0.8 };
                    break;
                case 'bankangle':
                    baseConfig = { rate: 0.75, basePitch: 0.45, volume: 0.8 };
                    break;
                case 'windshear':
                    baseConfig = { rate: 0.65, basePitch: 0.35, volume: 0.8 };
                    break;
                default:
                    baseConfig = { rate: 0.9, basePitch: 0.6, volume: 0.8 };
            }
            
            // Criar 3 vozes simultâneas com diferentes pitches para efeito de coro
            const pitchVariations = [
                baseConfig.basePitch - 0.1, // Tom mais grave
                baseConfig.basePitch,        // Tom base
                baseConfig.basePitch + 0.1   // Tom mais agudo
            ];
            
            const voices = speechSynthesis.getVoices();
            const preferredVoice = voices.find(voice => 
                voice.lang.startsWith('en') && 
                (voice.name.toLowerCase().includes('male') || 
                 voice.name.toLowerCase().includes('david') ||
                 voice.name.toLowerCase().includes('mark'))
            ) || voices.find(voice => voice.lang.startsWith('en'));
            
            // Reproduzir cada variação de pitch com pequeno delay para efeito de coro
            pitchVariations.forEach((pitch, index) => {
                setTimeout(() => {
                    const utterance = new SpeechSynthesisUtterance(sound.voice);
                    utterance.rate = baseConfig.rate;
                    utterance.pitch = Math.max(0.1, Math.min(2.0, pitch)); // Limitar pitch entre 0.1 e 2.0
                    utterance.volume = baseConfig.volume;
                    utterance.lang = 'en-US';
                    
                    if (preferredVoice) {
                        utterance.voice = preferredVoice;
                    }
                    
                    speechSynthesis.speak(utterance);
                }, index * 50); // Delay de 50ms entre cada voz para efeito de coro
            });
        }
        
        // Tocar por mais tempo como relógios convencionais (30 segundos)
        const alarmDuration = 30000; // 30 segundos
        const intervalTime = (sound.duration + 0.2) * 1000;
        const totalRepeats = Math.floor(alarmDuration / intervalTime);
        
        for (let i = 1; i < totalRepeats; i++) {
            const timeoutId = setTimeout(() => {
                // Criar múltiplos osciladores para cada repetição
                const frequencyVariations = [
                    sound.frequency * 0.95,  // Frequência mais grave
                    sound.frequency,         // Frequência base
                    sound.frequency * 1.05   // Frequência mais aguda
                ];
                
                frequencyVariations.forEach((freq, index) => {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    
                    osc.connect(gain);
                    gain.connect(audioContext.destination);
                    
                    osc.frequency.setValueAtTime(freq, audioContext.currentTime);
                    osc.type = 'sine';
                    
                    gain.gain.setValueAtTime(0.6, audioContext.currentTime); // Volume reduzido
                    gain.gain.exponentialRampToValueAtTime(0.2, audioContext.currentTime + sound.duration);
                    
                    osc.start(audioContext.currentTime + (index * 0.01));
                    osc.stop(audioContext.currentTime + sound.duration + (index * 0.01));
                });
                
                // Adicionar múltiplas vozes sintéticas simultâneas nas repetições
                if (sound.voice && 'speechSynthesis' in window) {
                    // Configurações base por tipo de alerta
                    let baseConfig = {};
                    switch(soundType) {
                        case 'pullup':
                            baseConfig = { rate: 0.7, basePitch: 0.4, volume: 0.8 };
                            break;
                        case 'terrain':
                            baseConfig = { rate: 0.8, basePitch: 0.5, volume: 0.8 };
                            break;
                        case 'bankangle':
                            baseConfig = { rate: 0.75, basePitch: 0.45, volume: 0.8 };
                            break;
                        case 'windshear':
                            baseConfig = { rate: 0.65, basePitch: 0.35, volume: 0.8 };
                            break;
                        default:
                            baseConfig = { rate: 0.9, basePitch: 0.6, volume: 0.8 };
                    }
                    
                    // Criar 3 vozes simultâneas com diferentes pitches
                    const pitchVariations = [
                        baseConfig.basePitch - 0.1, // Tom mais grave
                        baseConfig.basePitch,        // Tom base
                        baseConfig.basePitch + 0.1   // Tom mais agudo
                    ];
                    
                    const voices = speechSynthesis.getVoices();
                    const preferredVoice = voices.find(voice => 
                        voice.lang.startsWith('en') && 
                        (voice.name.toLowerCase().includes('male') || 
                         voice.name.toLowerCase().includes('david') ||
                         voice.name.toLowerCase().includes('mark'))
                    ) || voices.find(voice => voice.lang.startsWith('en'));
                    
                    // Reproduzir cada variação de pitch com pequeno delay
                    pitchVariations.forEach((pitch, index) => {
                        setTimeout(() => {
                            const utterance = new SpeechSynthesisUtterance(sound.voice);
                            utterance.rate = baseConfig.rate;
                            utterance.pitch = Math.max(0.1, Math.min(2.0, pitch));
                            utterance.volume = baseConfig.volume;
                            utterance.lang = 'en-US';
                            
                            if (preferredVoice) {
                                utterance.voice = preferredVoice;
                            }
                            
                            speechSynthesis.speak(utterance);
                        }, index * 50);
                    });
                }
            }, i * intervalTime);
            
            alarmTimeouts.push(timeoutId);
        }
        
        // Auto-parar após 30 segundos
        const autoStopTimeout = setTimeout(() => {
            stopAlarm();
        }, alarmDuration);
        alarmTimeouts.push(autoStopTimeout);
    } catch (error) {
        console.error('Erro ao reproduzir alarme:', error);
        // Fallback: usar alert como backup
        alert('🔔 ALARME! 🔔');
    }
}

function flashDisplay() {
    timeDisplay.classList.add('flash');
    setTimeout(() => timeDisplay.classList.remove('flash'), 500);
}

function startInstruments() {
    let altitude = 10000;
    let heading = 90;
    let speed = 250;
    
    instrumentsInterval = setInterval(() => {
        // Simular variações nos instrumentos
        altitude += (Math.random() - 0.5) * 100;
        heading += (Math.random() - 0.5) * 5;
        speed += (Math.random() - 0.5) * 10;
        
        // Manter valores dentro de limites realistas
        altitude = Math.max(0, Math.min(45000, altitude));
        heading = ((heading % 360) + 360) % 360;
        speed = Math.max(0, Math.min(600, speed));
        
        altitudeDisplay.textContent = `${Math.round(altitude).toLocaleString()} ft`;
        headingDisplay.textContent = `${Math.round(heading).toString().padStart(3, '0')}°`;
        speedDisplay.textContent = `${Math.round(speed)} kts`;
    }, 2000);
}

function saveSettings() {
    const settings = {
        alarmTime: alarmTimeInput.value,
        alarmSound: alarmSoundSelect.value,
        alarmEnabled: alarmEnabledCheck.checked,
        timerMinutes: timerMinutesInput.value,
        timerSeconds: timerSecondsInput.value,
        timerWarningTime: timerWarningTimeInput.value,
        timerWarningSound: timerWarningSoundSelect.value,
        stopwatchAlarmTime: stopwatchAlarmTimeInput.value,
        stopwatchAlarmSound: stopwatchAlarmSoundSelect.value,
        stopwatchAlarmEnabled: stopwatchAlarmEnabledCheck.checked,
        format24h: format24hCheck.checked,
        showSeconds: showSecondsCheck.checked,
        customAudioData: customAudioData,
        customAudioName: customAudioName
    };
    
    localStorage.setItem('cockpitWatchSettings', JSON.stringify(settings));
}

function loadSettings() {
    const saved = localStorage.getItem('cockpitWatchSettings');
    if (saved) {
        const settings = JSON.parse(saved);
        
        alarmTimeInput.value = settings.alarmTime || '07:00';
        alarmSoundSelect.value = settings.alarmSound || 'beep';
        alarmEnabledCheck.checked = settings.alarmEnabled || false;
        timerMinutesInput.value = settings.timerMinutes || 5;
        timerSecondsInput.value = settings.timerSeconds || 0;
        timerWarningTimeInput.value = settings.timerWarningTime || 10;
        timerWarningSoundSelect.value = settings.timerWarningSound || 'warning';
        stopwatchAlarmTimeInput.value = settings.stopwatchAlarmTime || '00:05:00';
        stopwatchAlarmSoundSelect.value = settings.stopwatchAlarmSound || 'beep';
        stopwatchAlarmEnabledCheck.checked = settings.stopwatchAlarmEnabled || false;
        format24hCheck.checked = settings.format24h !== false;
        showSecondsCheck.checked = settings.showSeconds !== false;
        
        // Aplicar configurações
        alarmTime = settings.alarmTime;
        alarmEnabled = settings.alarmEnabled;
        timerWarningTime = parseInt(settings.timerWarningTime) || 10;
        stopwatchAlarmEnabled = settings.stopwatchAlarmEnabled || false;
        if (settings.stopwatchAlarmTime) {
            const [hours, minutes, seconds] = settings.stopwatchAlarmTime.split(':').map(Number);
            stopwatchAlarmTime = (hours * 3600) + (minutes * 60) + (seconds || 0);
        }
        format24h = settings.format24h !== false;
        showSeconds = settings.showSeconds !== false;
        
        // Carregar arquivo personalizado
        if (settings.customAudioData && settings.customAudioName) {
            customAudioData = settings.customAudioData;
            customAudioName = settings.customAudioName;
            selectedFileName.textContent = settings.customAudioName;
            previewAudioBtn.style.display = 'inline-block';
        }
        
        // Mostrar/ocultar linha de arquivo personalizado
        const isCustom = alarmSoundSelect.value === 'custom';
        customAudioRow.style.display = isCustom ? 'flex' : 'none';
        
        // Atualizar LED do alarm
        updateAlarmLedState();
    }
    
    updateActionButtons();
}

// Funções para integração com Service Worker
function scheduleAlarmNotification(alarmId, timeInMinutes, sound, enabled) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const channel = new MessageChannel();
        
        channel.port1.onmessage = function(event) {
            if (event.data.success) {
                console.log('Alarme agendado no Service Worker:', alarmId);
            }
        };
        
        navigator.serviceWorker.controller.postMessage({
            type: 'SCHEDULE_ALARM',
            alarmId: alarmId,
            time: timeInMinutes,
            sound: sound,
            enabled: enabled
        }, [channel.port2]);
    }
}

function cancelAlarmNotification(alarmId) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const channel = new MessageChannel();
        
        channel.port1.onmessage = function(event) {
            if (event.data.success) {
                console.log('Alarme cancelado no Service Worker:', alarmId);
            }
        };
        
        navigator.serviceWorker.controller.postMessage({
            type: 'CANCEL_ALARM',
            alarmId: alarmId
        }, [channel.port2]);
    }
}

// Inicializar verificação periódica de alarmes
function startAlarmChecker() {
    // Verificar alarmes a cada minuto
    setInterval(() => {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then(registration => {
                return registration.sync.register('alarm-check');
            }).catch(err => {
                console.log('Background sync não suportado:', err);
                // Fallback: verificar alarmes manualmente
                checkAlarmsManually();
            });
        }
    }, 60000); // 1 minuto
}

// Verificação manual de alarmes (fallback)
function checkAlarmsManually() {
    const now = new Date();
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
    
    // Verificar alarme principal
    if (alarmEnabled && alarmTime) {
        const [hours, minutes] = alarmTime.split(':').map(Number);
        const alarmTimeMinutes = hours * 60 + minutes;
        
        if (Math.abs(currentTimeMinutes - alarmTimeMinutes) < 1) { // margem de 1 minuto
            if (!document.querySelector('.alarm-active')) {
                playAlarm('alarm', alarmSoundSelect.value);
                flashDisplay();
            }
        }
    }
}

// Cleanup ao sair
window.addEventListener('beforeunload', () => {
    if (clockInterval) clearInterval(clockInterval);
    if (stopwatchInterval) clearInterval(stopwatchInterval);
    if (timerInterval) clearInterval(timerInterval);
    if (instrumentsInterval) clearInterval(instrumentsInterval);
});