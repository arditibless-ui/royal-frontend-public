// Sound effects utility for the poker game

class SoundManager {
  private sounds: { [key: string]: HTMLAudioElement } = {};
  private enabled: boolean = true;
  private volume: number = 0.5;
  private musicVolume: number = 0.3;
  private musicEnabled: boolean = true; // Music enabled by default
  private currentMusic: HTMLAudioElement | null = null;
  private lobbyMusic: HTMLAudioElement | null = null;
  private gameMusic: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private cardDealSound: HTMLAudioElement | null = null;
  private cardFlipSound: HTMLAudioElement | null = null;
  private chipStackSound: HTMLAudioElement | null = null;
  private chipClinkSound: HTMLAudioElement | null = null;
  private chipCollectSound: HTMLAudioElement | null = null;
  private victorySound: HTMLAudioElement | null = null;
  private cardShuffleSound: HTMLAudioElement | null = null;
  private allInSound: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeSounds();
      this.initializeAudioContext();
      this.initializeLobbyMusic();
      this.initializeGameMusic();
      this.initializeGameSounds();
    }
  }

  private initializeGameSounds() {
    if (typeof window !== 'undefined') {
      try {
        this.cardDealSound = new Audio('/audio/card-deal.mp3');
        this.cardDealSound.volume = this.volume * 0.5;
        this.cardDealSound.load();
        
        this.cardFlipSound = new Audio('/audio/card-flip.mp3');
        this.cardFlipSound.volume = this.volume * 0.6;
        this.cardFlipSound.load();
        
        this.chipStackSound = new Audio('/audio/chip-stack.mp3');
        this.chipStackSound.volume = this.volume * 0.7;
        this.chipStackSound.load();
        
        this.chipClinkSound = new Audio('/audio/chip-clink.mp3');
        this.chipClinkSound.volume = this.volume * 0.6;
        this.chipClinkSound.load();
        
        this.chipCollectSound = new Audio('/audio/chip-collect.mp3');
        this.chipCollectSound.volume = this.volume * 0.8;
        this.chipCollectSound.load();
        
        this.victorySound = new Audio('/audio/victory.mp3');
        this.victorySound.volume = this.volume * 0.9;
        this.victorySound.load();
        
        this.cardShuffleSound = new Audio('/audio/card-shuffle.mp3');
        this.cardShuffleSound.volume = this.volume * 0.5;
        this.cardShuffleSound.load();
        
        this.allInSound = new Audio('/audio/all-in.mp3');
        this.allInSound.volume = this.volume;
        this.allInSound.load();
      } catch (error) {
        console.warn('Could not load game sounds:', error);
      }
    }
  }

  private initializeLobbyMusic() {
    if (typeof window !== 'undefined') {
      try {
        this.lobbyMusic = new Audio('/audio/background lobby .mp3');
        this.lobbyMusic.loop = true;
        this.lobbyMusic.volume = this.musicVolume;
        // Allow autoplay attempt
        this.lobbyMusic.muted = false;
      } catch (error) {
        console.warn('Could not load lobby music:', error);
      }
    }
  }

  private initializeGameMusic() {
    if (typeof window !== 'undefined') {
      try {
        this.gameMusic = new Audio('/audio/pokertable sound.mp3');
        this.gameMusic.loop = true;
        this.gameMusic.volume = this.musicVolume;
        // Allow autoplay attempt
        this.gameMusic.muted = false;
      } catch (error) {
        console.warn('Could not load game music:', error);
      }
    }
  }

  private initializeSounds() {
    // Define sound effects with data URLs (base64 encoded short beeps)
    // These are simple procedurally generated sounds to avoid external files
    
    // Using the Web Audio API for better performance
    this.enabled = typeof window !== 'undefined' && 'AudioContext' in window;
  }

  private initializeAudioContext() {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        // Resume audio context on first user interaction
        this.unlockAudio();
      } catch (e) {
        console.warn('Web Audio API not supported');
      }
    }
  }

  // Unlock audio on first user interaction (required for mobile browsers)
  private unlockAudio() {
    if (typeof window === 'undefined') return;
    
    const unlock = async () => {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // Try to play all audio elements briefly to unlock them
      const sounds = [
        this.chipStackSound,
        this.chipClinkSound,
        this.chipCollectSound,
        this.cardDealSound,
        this.cardFlipSound,
        this.victorySound,
        this.allInSound
      ];
      
      for (const sound of sounds) {
        if (sound) {
          try {
            sound.volume = 0;
            const playPromise = sound.play();
            if (playPromise !== undefined) {
              await playPromise.then(() => {
                sound.pause();
                sound.currentTime = 0;
                sound.volume = this.volume;
              }).catch(() => {});
            }
          } catch (e) {
            console.log('Audio unlock attempt:', e);
          }
        }
      }
      
      console.log('🔊 Audio unlocked! Sounds are now enabled.');
      
      // Remove listeners after first unlock
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('keydown', unlock);
    };
    
    document.addEventListener('click', unlock);
    document.addEventListener('touchstart', unlock);
    document.addEventListener('keydown', unlock);
  }

  // Generate a simple beep sound using Web Audio API
  private generateBeep(frequency: number, duration: number, volume: number = 0.3) {
    if (!this.enabled || typeof window === 'undefined') return;

    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      // Resume context if suspended
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(volume * this.volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  // Generate a realistic chip click sound using Web Audio API
  private generateChipClick(frequency: number, duration: number, volume: number = 0.3) {
    if (!this.enabled || typeof window === 'undefined') return;

    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      // Resume context if suspended
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      const now = this.audioContext.currentTime;
      
      // Create two oscillators for a more realistic chip sound
      const osc1 = this.audioContext.createOscillator();
      const osc2 = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();

      // Configure filter for sharp attack (like plastic chips)
      filter.type = 'bandpass';
      filter.frequency.value = frequency;
      filter.Q.value = 2;

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Primary frequency (base click)
      osc1.frequency.value = frequency;
      osc1.type = 'square'; // Square wave for sharper attack
      
      // Secondary frequency (adds body to the click)
      osc2.frequency.value = frequency * 1.5;
      osc2.type = 'triangle';

      // Sharp attack and quick decay for realistic chip click
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume * this.volume, now + 0.001); // Very fast attack
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

      osc1.start(now);
      osc1.stop(now + duration);
      osc2.start(now);
      osc2.stop(now + duration);
    } catch (error) {
      console.error('Error playing chip click sound:', error);
    }
  }

  // Background Music Methods
  private generateBackgroundMusic(type: 'lobby' | 'game' | 'menu' = 'game') {
    if (!this.musicEnabled || !this.audioContext) return;

    try {
      // Stop current music if playing
      this.stopMusic();

      const audioContext = this.audioContext;
      const musicGain = audioContext.createGain();
      musicGain.gain.value = this.musicVolume;
      musicGain.connect(audioContext.destination);

      // Create a simple ambient music loop based on type
      const scheduleNote = (frequency: number, startTime: number, duration: number, volume: number = 0.15) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(musicGain);
        
        osc.frequency.value = frequency;
        osc.type = type === 'game' ? 'triangle' : 'sine';
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.1);
        gain.gain.setValueAtTime(volume, startTime + duration - 0.1);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Music patterns based on type
      if (type === 'game') {
        // Professional ambient poker game music - sophisticated jazz-inspired
        const gameMusic = () => {
          const now = audioContext.currentTime;
          const baseNote = 196; // G3
          
          // Warm bass line (deep and smooth)
          scheduleNote(baseNote * 0.5, now, 3, 0.08);
          scheduleNote(baseNote * 0.5 * 1.25, now + 3, 3, 0.08);
          scheduleNote(baseNote * 0.5 * 1.125, now + 6, 3, 0.08);
          scheduleNote(baseNote * 0.5 * 1.5, now + 9, 3, 0.08);
          
          // Smooth melody (jazzy progression)
          scheduleNote(baseNote * 2, now + 1, 1.5, 0.05);
          scheduleNote(baseNote * 2.375, now + 2.5, 1.5, 0.05);
          scheduleNote(baseNote * 2.25, now + 4, 2, 0.05);
          
          scheduleNote(baseNote * 2.5, now + 6.5, 1.5, 0.05);
          scheduleNote(baseNote * 3, now + 8, 1.5, 0.05);
          scheduleNote(baseNote * 2.667, now + 9.5, 2, 0.05);
          
          // Subtle high notes (atmospheric)
          scheduleNote(baseNote * 4, now + 2, 1, 0.03);
          scheduleNote(baseNote * 5, now + 7, 1, 0.03);
          scheduleNote(baseNote * 4.5, now + 10, 1, 0.03);
          
          // Schedule next loop
          setTimeout(gameMusic, 12000);
        };
        gameMusic();
      } else if (type === 'lobby') {
        // Professional upbeat lobby music - modern and inviting
        const lobbyMusic = () => {
          const now = audioContext.currentTime;
          const baseNote = 329.63; // E4
          
          // Energetic rhythm (bright and engaging)
          scheduleNote(baseNote, now, 0.4, 0.09);
          scheduleNote(baseNote * 1.333, now + 0.5, 0.4, 0.09);
          scheduleNote(baseNote * 1.5, now + 1, 0.4, 0.09);
          scheduleNote(baseNote * 1.25, now + 1.5, 0.4, 0.09);
          
          scheduleNote(baseNote * 1.2, now + 2, 0.4, 0.09);
          scheduleNote(baseNote * 1.5, now + 2.5, 0.4, 0.09);
          scheduleNote(baseNote * 1.667, now + 3, 0.4, 0.09);
          scheduleNote(baseNote * 2, now + 3.5, 0.6, 0.09);
          
          // Harmonic accents
          scheduleNote(baseNote * 2.5, now + 1.25, 0.3, 0.04);
          scheduleNote(baseNote * 3, now + 2.75, 0.3, 0.04);
          
          setTimeout(lobbyMusic, 5000);
        };
        lobbyMusic();
      } else {
        // Professional menu music - elegant and welcoming
        const menuMusic = () => {
          const now = audioContext.currentTime;
          const baseNote = 261.63; // C4
          
          // Smooth flowing melody
          scheduleNote(baseNote, now, 1.5, 0.07);
          scheduleNote(baseNote * 1.25, now + 1.5, 1.5, 0.07);
          scheduleNote(baseNote * 1.5, now + 3, 1.5, 0.07);
          scheduleNote(baseNote * 1.333, now + 4.5, 1.5, 0.07);
          scheduleNote(baseNote * 1.125, now + 6, 2, 0.07);
          
          // Harmonic layer (adds depth)
          scheduleNote(baseNote * 2, now + 0.75, 1, 0.04);
          scheduleNote(baseNote * 2.5, now + 2.25, 1, 0.04);
          scheduleNote(baseNote * 3, now + 4, 1, 0.04);
          scheduleNote(baseNote * 2.25, now + 6, 1.5, 0.04);
          
          setTimeout(menuMusic, 8000);
        };
        menuMusic();
      }
    } catch (error) {
      console.error('Error playing background music:', error);
    }
  }

  playBackgroundMusic(type: 'lobby' | 'game' | 'menu' = 'game') {
    if (this.musicEnabled) {
      // Use audio file for lobby/menu, game file for poker table
      if (type === 'lobby' || type === 'menu') {
        this.playLobbyMusic();
      } else if (type === 'game') {
        this.playGameMusic();
      }
    }
  }

  playLobbyMusic() {
    if (!this.musicEnabled || !this.lobbyMusic) return;
    
    try {
      this.stopMusic(); // Stop any current music
      this.lobbyMusic.volume = this.musicVolume;
      this.lobbyMusic.currentTime = 0;
      const playPromise = this.lobbyMusic.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Autoplay was blocked, will play on user interaction
          console.log('Autoplay blocked, music will play on user interaction');
        });
      }
      this.currentMusic = this.lobbyMusic;
    } catch (error) {
      console.error('Error playing lobby music:', error);
    }
  }

  playGameMusic() {
    if (!this.musicEnabled || !this.gameMusic) return;
    
    try {
      this.stopMusic(); // Stop any current music
      this.gameMusic.volume = this.musicVolume;
      this.gameMusic.currentTime = 0;
      const playPromise = this.gameMusic.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Autoplay was blocked, will play on user interaction
          console.log('Autoplay blocked, music will play on user interaction');
        });
      }
      this.currentMusic = this.gameMusic;
    } catch (error) {
      console.error('Error playing game music:', error);
    }
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
      this.currentMusic = null;
    }
    if (this.lobbyMusic && this.lobbyMusic !== this.currentMusic) {
      this.lobbyMusic.pause();
      this.lobbyMusic.currentTime = 0;
    }
    if (this.gameMusic && this.gameMusic !== this.currentMusic) {
      this.gameMusic.pause();
      this.gameMusic.currentTime = 0;
    }
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.currentMusic) {
      this.currentMusic.volume = this.musicVolume;
    }
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
    }
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  // Click/button sound
  playClick() {
    this.generateBeep(800, 0.05, 0.2);
  }

  // Hover sound
  playHover() {
    this.generateBeep(600, 0.03, 0.15);
  }

  // Card deal sound
  playCardDeal() {
    this.generateBeep(400, 0.08, 0.25);
  }

  // Card flip sound
  playCardFlip() {
    this.generateBeep(500, 0.1, 0.2);
  }

  // Chip sound (for bets) - Realistic chip click
  playChip() {
    // Realistic chip click sound - short, sharp, lower frequency
    this.generateChipClick(800, 0.02, 0.3);
  }

  // Win sound
  playWin() {
    setTimeout(() => this.generateBeep(523, 0.15, 0.3), 0);
    setTimeout(() => this.generateBeep(659, 0.15, 0.3), 100);
    setTimeout(() => this.generateBeep(784, 0.2, 0.3), 200);
  }

  // Lose/Fold sound
  playLose() {
    this.generateBeep(300, 0.2, 0.25);
  }

  // Notification sound
  playNotification() {
    setTimeout(() => this.generateBeep(600, 0.1, 0.2), 0);
    setTimeout(() => this.generateBeep(800, 0.1, 0.2), 100);
  }

  // Success sound
  playSuccess() {
    setTimeout(() => this.generateBeep(600, 0.08, 0.25), 0);
    setTimeout(() => this.generateBeep(800, 0.12, 0.25), 80);
  }

  // Error sound
  playError() {
    setTimeout(() => this.generateBeep(200, 0.1, 0.3), 0);
    setTimeout(() => this.generateBeep(150, 0.15, 0.3), 100);
  }

  // Countdown tick sound
  playCountdownTick() {
    this.generateBeep(1000, 0.05, 0.25);
  }

  // Game start sound
  playGameStart() {
    setTimeout(() => this.generateBeep(400, 0.1, 0.3), 0);
    setTimeout(() => this.generateBeep(500, 0.1, 0.3), 100);
    setTimeout(() => this.generateBeep(600, 0.1, 0.3), 200);
    setTimeout(() => this.generateBeep(800, 0.2, 0.3), 300);
  }

  // All-in sound (dramatic)
  playAllIn() {
    setTimeout(() => this.generateBeep(300, 0.1, 0.35), 0);
    setTimeout(() => this.generateBeep(400, 0.1, 0.35), 80);
    setTimeout(() => this.generateBeep(500, 0.1, 0.35), 160);
    setTimeout(() => this.generateBeep(700, 0.15, 0.35), 240);
    setTimeout(() => this.generateBeep(900, 0.2, 0.35), 340);
  }

  // Raise sound (confident) - Realistic chip click
  playRaise() {
    // Realistic chip click for raises
    this.generateChipClick(850, 0.025, 0.3);
  }

  // Check sound (neutral)
  playCheck() {
    this.generateBeep(500, 0.06, 0.2);
  }

  // Shuffle sound (cards being dealt)
  playShuffle() {
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        this.generateBeep(350 + Math.random() * 100, 0.04, 0.15);
      }, i * 30);
    }
  }

  // Pot collection sound (chips sliding)
  playPotCollect() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.generateBeep(650 + i * 50, 0.06, 0.25);
      }, i * 50);
    }
  }

  // Timer warning sound (urgency)
  playTimerWarning() {
    this.generateBeep(800, 0.08, 0.3);
    setTimeout(() => this.generateBeep(800, 0.08, 0.3), 100);
  }

  // Blind increase notification
  playBlindIncrease() {
    setTimeout(() => this.generateBeep(500, 0.1, 0.3), 0);
    setTimeout(() => this.generateBeep(700, 0.1, 0.3), 100);
    setTimeout(() => this.generateBeep(900, 0.1, 0.3), 200);
    setTimeout(() => this.generateBeep(700, 0.1, 0.3), 300);
    setTimeout(() => this.generateBeep(500, 0.15, 0.3), 400);
  }

  // Player join sound
  playPlayerJoin() {
    setTimeout(() => this.generateBeep(600, 0.08, 0.25), 0);
    setTimeout(() => this.generateBeep(800, 0.12, 0.25), 80);
  }

  // Player leave sound
  playPlayerLeave() {
    setTimeout(() => this.generateBeep(800, 0.08, 0.25), 0);
    setTimeout(() => this.generateBeep(600, 0.12, 0.25), 80);
  }

  // Swipe gesture sounds
  playSwipeLeft() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.generateBeep(700 - i * 100, 0.05, 0.2);
      }, i * 30);
    }
  }

  playSwipeRight() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.generateBeep(500 + i * 100, 0.05, 0.2);
      }, i * 30);
    }
  }

  playSwipeUp() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.generateBeep(400 + i * 150, 0.05, 0.2);
      }, i * 25);
    }
  }

  playSwipeDown() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.generateBeep(800 - i * 150, 0.05, 0.2);
      }, i * 25);
    }
  }

  // Menu navigation sounds
  playMenuOpen() {
    setTimeout(() => this.generateBeep(500, 0.08, 0.25), 0);
    setTimeout(() => this.generateBeep(650, 0.08, 0.25), 60);
    setTimeout(() => this.generateBeep(800, 0.1, 0.25), 120);
  }

  playMenuClose() {
    setTimeout(() => this.generateBeep(800, 0.08, 0.25), 0);
    setTimeout(() => this.generateBeep(650, 0.08, 0.25), 60);
    setTimeout(() => this.generateBeep(500, 0.1, 0.25), 120);
  }

  playMenuSelect() {
    this.generateBeep(750, 0.1, 0.25);
  }

  // UI feedback sounds
  playToggleOn() {
    setTimeout(() => this.generateBeep(600, 0.06, 0.2), 0);
    setTimeout(() => this.generateBeep(800, 0.08, 0.2), 60);
  }

  playToggleOff() {
    setTimeout(() => this.generateBeep(800, 0.06, 0.2), 0);
    setTimeout(() => this.generateBeep(600, 0.08, 0.2), 60);
  }

  playSliderMove() {
    this.generateBeep(500, 0.03, 0.15);
  }

  playModalOpen() {
    setTimeout(() => this.generateBeep(400, 0.08, 0.22), 0);
    setTimeout(() => this.generateBeep(600, 0.08, 0.22), 70);
    setTimeout(() => this.generateBeep(750, 0.1, 0.22), 140);
  }

  playModalClose() {
    setTimeout(() => this.generateBeep(750, 0.08, 0.22), 0);
    setTimeout(() => this.generateBeep(600, 0.08, 0.22), 70);
    setTimeout(() => this.generateBeep(400, 0.1, 0.22), 140);
  }

  // Chat sounds
  playChatMessage() {
    setTimeout(() => this.generateBeep(700, 0.05, 0.2), 0);
    setTimeout(() => this.generateBeep(850, 0.07, 0.2), 50);
  }

  playChatOpen() {
    setTimeout(() => this.generateBeep(600, 0.06, 0.2), 0);
    setTimeout(() => this.generateBeep(750, 0.08, 0.2), 60);
  }

  // Lobby sounds
  playRoomJoin() {
    setTimeout(() => this.generateBeep(500, 0.1, 0.25), 0);
    setTimeout(() => this.generateBeep(650, 0.1, 0.25), 100);
    setTimeout(() => this.generateBeep(800, 0.12, 0.25), 200);
  }

  playRoomCreate() {
    setTimeout(() => this.generateBeep(550, 0.08, 0.28), 0);
    setTimeout(() => this.generateBeep(700, 0.08, 0.28), 80);
    setTimeout(() => this.generateBeep(850, 0.1, 0.28), 160);
    setTimeout(() => this.generateBeep(1000, 0.12, 0.28), 240);
  }

  playReadyUp() {
    setTimeout(() => this.generateBeep(650, 0.08, 0.25), 0);
    setTimeout(() => this.generateBeep(850, 0.1, 0.25), 80);
  }

  // HIGH PRIORITY: Card animation sounds
  playCardDeal() {
    if (!this.enabled || !this.cardDealSound) return;
    try {
      this.cardDealSound.currentTime = 0;
      this.cardDealSound.play().catch(e => console.warn('Card deal sound blocked:', e));
    } catch (error) {
      console.warn('Error playing card deal sound:', error);
    }
  }

  playCardFlip() {
    if (!this.enabled || !this.cardFlipSound) return;
    try {
      this.cardFlipSound.currentTime = 0;
      this.cardFlipSound.play().catch(e => console.warn('Card flip sound blocked:', e));
    } catch (error) {
      console.warn('Error playing card flip sound:', error);
    }
  }

  playCardShuffle() {
    if (!this.enabled || !this.cardShuffleSound) return;
    try {
      this.cardShuffleSound.currentTime = 0;
      this.cardShuffleSound.play().catch(e => console.warn('Card shuffle sound blocked:', e));
    } catch (error) {
      console.warn('Error playing card shuffle sound:', error);
    }
  }

  // HIGH PRIORITY: Chip animation sounds
  playChipStack() {
    if (!this.enabled) return;
    
    // Realistic chip stacking sound
    this.generateChipClick(750, 0.03, 0.35);
  }

  playChipClink() {
    if (!this.enabled) return;
    
    // Realistic chip clink sound
    this.generateChipClick(900, 0.02, 0.3);
  }

  playChipCollect() {
    if (!this.enabled) return;
    
    // Realistic chip collection sound
    this.generateChipClick(800, 0.03, 0.3);
  }

  // HIGH PRIORITY: Winner celebration sounds
  playVictory() {
    if (!this.enabled || !this.victorySound) return;
    try {
      this.victorySound.currentTime = 0;
      this.victorySound.play().catch(e => console.warn('Victory sound blocked:', e));
    } catch (error) {
      console.warn('Error playing victory sound:', error);
    }
  }

  // MEDIUM PRIORITY: All-in dramatic sound
  playAllIn() {
    if (!this.enabled || !this.allInSound) return;
    try {
      this.allInSound.currentTime = 0;
      this.allInSound.play().catch(e => console.warn('All-in sound blocked:', e));
    } catch (error) {
      console.warn('Error playing all-in sound:', error);
    }
  }

  // Get/Set methods for volume control
  setActionSoundsVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    
    // Update all game sound volumes
    if (this.cardDealSound) this.cardDealSound.volume = this.volume * 0.5;
    if (this.cardFlipSound) this.cardFlipSound.volume = this.volume * 0.6;
    if (this.chipStackSound) this.chipStackSound.volume = this.volume * 0.7;
    if (this.chipClinkSound) this.chipClinkSound.volume = this.volume * 0.6;
    if (this.chipCollectSound) this.chipCollectSound.volume = this.volume * 0.8;
    if (this.victorySound) this.victorySound.volume = this.volume * 0.9;
    if (this.cardShuffleSound) this.cardShuffleSound.volume = this.volume * 0.5;
    if (this.allInSound) this.allInSound.volume = this.volume;
  }

  playUnready() {
    setTimeout(() => this.generateBeep(850, 0.08, 0.25), 0);
    setTimeout(() => this.generateBeep(650, 0.1, 0.25), 80);
  }

  // Theme change sound
  playThemeChange() {
    setTimeout(() => this.generateBeep(500, 0.08, 0.25), 0);
    setTimeout(() => this.generateBeep(600, 0.08, 0.25), 70);
    setTimeout(() => this.generateBeep(700, 0.08, 0.25), 140);
    setTimeout(() => this.generateBeep(800, 0.1, 0.25), 210);
  }

  // Avatar change sound
  playAvatarChange() {
    setTimeout(() => this.generateBeep(700, 0.1, 0.25), 0);
    setTimeout(() => this.generateBeep(900, 0.12, 0.25), 100);
  }

  // Alias for consistency across components
  playButtonClick() {
    this.playClick();
  }

  // Set volume (0.0 to 1.0)
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  // Enable/disable sounds
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  // Toggle sounds
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  // Check if sounds are enabled
  isEnabled() {
    return this.enabled;
  }
}

// Export singleton instance
export const soundManager = new SoundManager();
