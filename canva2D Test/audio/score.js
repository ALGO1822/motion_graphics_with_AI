import { encodeWAV } from './wav.js';

window.__renderAudio = async function(timeline) {
    function mulberry32(a) {
        return function() {
          var t = a += 0x6D2B79F5;
          t = Math.imul(t ^ t >>> 15, t | 1);
          t ^= t + Math.imul(t ^ t >>> 7, t | 61);
          return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
    }
    Math.random = mulberry32(2026);

    const out = await Tone.Offline(async () => {
        const dest = Tone.getDestination();
        
        const limiter = new Tone.Limiter(-1.5).connect(dest);
        const comp = new Tone.Compressor({
            threshold: -18,
            ratio: 2,
            attack: 0.03,
            release: 0.2
        }).connect(limiter);
        
        // Note: low end (<120Hz) is inherently mono since all low instruments (kick, thud, pedal) are not panned.
        const masterBus = new Tone.Gain(1).connect(comp);
        
        const t = (frame) => frame / 30;
        
        // INSTRUMENTS
        // PEDAL
        const pedalBus = new Tone.Volume(-26).connect(masterBus);
        const pedalOsc1 = new Tone.Oscillator("D2", "sine").connect(pedalBus);
        const pedalOsc2 = new Tone.Oscillator("A2", "sine").connect(new Tone.Volume(-6)).connect(pedalBus); // -32 total
        
        // PAD
        const padBus = new Tone.Volume(-18).connect(masterBus);
        const padVerb = new Tone.Freeverb({ roomSize: 0.72, dampening: 2800, wet: 0.22 }).connect(padBus);
        const padFilter = new Tone.Filter(1100, "lowpass", -12).connect(padVerb);
        padFilter.Q.value = 0.5;
        
        const padSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "fatsawtooth", count: 3, spread: 18 },
            envelope: { attack: 0.35, decay: 0.3, sustain: 0.85, release: 1.4 }
        }).connect(padFilter);
        
        // PLUCK
        const pluckBus = new Tone.Volume(-16).connect(masterBus);
        const pluckVerb = new Tone.Freeverb({ roomSize: 0.7, dampening: 3000, wet: 0.12 }).connect(pluckBus);
        const pluckDelay = new Tone.FeedbackDelay(0.4, 0.32).connect(pluckVerb);
        pluckDelay.wet.value = 0.22;
        const pluckPanner = new Tone.Panner(0).connect(pluckDelay);
        const pluckSynth = new Tone.Synth({
            oscillator: { type: "triangle" },
            envelope: { attack: 0.003, decay: 0.22, sustain: 0, release: 0.25 }
        }).connect(pluckPanner);
        
        // BELL
        const bellBus = new Tone.Volume(-15).connect(masterBus);
        const bellVerb = new Tone.Freeverb({ roomSize: 0.8, dampening: 4000, wet: 0.3 }).connect(bellBus);
        const bellSynth = new Tone.PolySynth(Tone.FMSynth, {
            harmonicity: 3.01,
            modulationIndex: 6,
            envelope: { attack: 0.002, decay: 1.4, sustain: 0, release: 1.6 },
            modulationEnvelope: { attack: 0.002, decay: 0.35, sustain: 0, release: 0.1 }
        }).connect(bellVerb);
        
        // KICK
        const kickBus = new Tone.Volume(-14).connect(masterBus);
        const kickFilter = new Tone.Filter(35, "highpass").connect(kickBus);
        const kickSynth = new Tone.MembraneSynth({
            pitchDecay: 0.04,
            octaves: 3.5,
            envelope: { attack: 0.001, decay: 0.28, sustain: 0, release: 0.1 }
        }).connect(kickFilter);
        
        // THUD + KNOCK
        const thudBus = new Tone.Volume(-8).connect(masterBus);
        const thudSynth = new Tone.MembraneSynth({
            pitchDecay: 0.06,
            octaves: 4,
            envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.1 }
        }).connect(thudBus);
        
        const knockBus = new Tone.Volume(-20).connect(masterBus);
        const knockFilter = new Tone.Filter(1800, "bandpass").connect(knockBus);
        knockFilter.Q.value = 1;
        const knockSynth = new Tone.NoiseSynth({
            noise: { type: "white" },
            envelope: { attack: 0.0005, decay: 0.04, sustain: 0 }
        }).connect(knockFilter);
        
        // CLICK
        const clickBus = new Tone.Volume(-20).connect(masterBus);
        const clickFilter = new Tone.Filter(4200, "bandpass").connect(clickBus);
        clickFilter.Q.value = 2.5;
        const clickSynth = new Tone.NoiseSynth({
            noise: { type: "white" },
            envelope: { attack: 0.0005, decay: 0.014, sustain: 0 }
        }).connect(clickFilter);
        
        const highlightClickFilter = new Tone.Filter(6500, "bandpass").connect(clickBus);
        highlightClickFilter.Q.value = 2.5;
        const highlightClickSynth = new Tone.NoiseSynth({
            noise: { type: "white" },
            envelope: { attack: 0.0005, decay: 0.014, sustain: 0 }
        }).connect(highlightClickFilter);
        
        // HAT
        const hatBus = new Tone.Volume(-30).connect(masterBus);
        const hatFilter = new Tone.Filter(8000, "highpass").connect(hatBus);
        const hatSynth = new Tone.NoiseSynth({
            noise: { type: "white" },
            envelope: { attack: 0.001, decay: 0.03, sustain: 0 }
        }).connect(hatFilter);
        
        // WHOOSH
        const whooshBus = new Tone.Volume(-24).connect(masterBus);
        const whooshFilter = new Tone.Filter(900, "bandpass").connect(whooshBus);
        whooshFilter.Q.value = 1.2;
        const whooshNoise = new Tone.Noise("pink").connect(whooshFilter);
        
        // PRE-SWELL
        const swellBus = new Tone.Volume(-24).connect(masterBus);
        const swellFilter = new Tone.Filter(400, "lowpass").connect(swellBus);
        const swellNoise = new Tone.Noise("pink").connect(swellFilter);
        
        // CUES
        
        // Scene A
        pedalOsc1.start(t(0)); pedalOsc2.start(t(0));
        pedalBus.volume.setValueAtTime(-100, 0);
        pedalBus.volume.linearRampToValueAtTime(-26, t(7.5)); // 0.25s fade in (7.5 frames)
        
        const n16 = 4/30 - 0.001;
        const n8 = 8/30 - 0.001;
        
        pluckSynth.triggerAttackRelease("D4", n16, t(8), 0.55);
        pluckSynth.triggerAttackRelease("F#4", n16, t(12), 0.6);
        pluckSynth.triggerAttackRelease("A4", n16, t(16), 0.7);
        
        clickSynth.triggerAttackRelease(n16, t(16));
        clickSynth.triggerAttackRelease(n16, t(32));
        pluckSynth.triggerAttackRelease("E5", n16, t(32), 0.5);
        
        // Pre-swell f36-44
        swellNoise.start(t(36)); swellNoise.stop(t(44));
        swellFilter.frequency.setValueAtTime(400, t(36));
        swellFilter.frequency.exponentialRampToValueAtTime(3000, t(44));
        swellBus.volume.setValueAtTime(-60, t(36));
        swellBus.volume.linearRampToValueAtTime(-20, t(44));
        
        // T1 f44
        thudSynth.triggerAttackRelease("B1", n8, t(44), 1);
        knockSynth.triggerAttackRelease(n16, t(44));
        
        // Whoosh f44-62
        whooshNoise.start(t(44)); whooshNoise.stop(t(62));
        whooshFilter.frequency.setValueAtTime(900, t(44));
        whooshFilter.frequency.exponentialRampToValueAtTime(6000, t(62));
        whooshBus.volume.setValueAtTime(-100, t(44));
        whooshBus.volume.linearRampToValueAtTime(-24, t(44 + 18*0.6));
        whooshBus.volume.linearRampToValueAtTime(-100, t(62));
        
        // PAD Bm9 (f44-88)
        padSynth.set({ envelope: { attack: 0.35 } });
        padSynth.triggerAttackRelease(["B2", "F#3", "A3", "C#4", "D4"], t(88) - t(44) + 0.05, t(44));
        
        clickSynth.triggerAttackRelease(n16, t(62)); // Landing
        
        // Scene B
        const kicks = [64, 80, 96, 112];
        kicks.forEach(f => kickSynth.triggerAttackRelease("D1", n8, t(f), 0.55));
        
        const hats = [72, 88, 104, 120];
        hats.forEach(f => hatSynth.triggerAttackRelease(n16, t(f), 0.15));
        
        bellSynth.triggerAttackRelease("A5", n8, t(96), 0.5);
        bellSynth.triggerAttackRelease("E5", n8, t(104), 0.45);
        
        padFilter.frequency.setValueAtTime(1100, 0);
        padFilter.frequency.setValueAtTime(1100, t(112));
        padFilter.frequency.linearRampToValueAtTime(2600, t(128));
        
        bellSynth.triggerAttackRelease("D6", n8, t(128), 0.55);
        clickSynth.triggerAttackRelease(n16, t(128));
        
        // PAD Gmaj7 (f88-132)
        padSynth.triggerAttackRelease(["G2", "D3", "F#3", "B3", "D4"], t(132) - t(88) + 0.05, t(88));
        
        // T2 f132
        thudSynth.triggerAttackRelease("D2", n8, t(132), 1);
        knockSynth.triggerAttackRelease(n16, t(132));
        
        whooshNoise.start(t(132)); whooshNoise.stop(t(150));
        whooshFilter.frequency.setValueAtTime(900, t(132));
        whooshFilter.frequency.exponentialRampToValueAtTime(6000, t(150));
        whooshBus.volume.setValueAtTime(-100, t(132));
        whooshBus.volume.linearRampToValueAtTime(-24, t(132 + 18*0.6));
        whooshBus.volume.linearRampToValueAtTime(-100, t(150));
        
        // PAD D6/9 (f132-176)
        padSynth.set({ envelope: { attack: 0.15 } });
        padSynth.triggerAttackRelease(["D2", "A2", "F#3", "B3", "E4"], t(176) - t(132) + 0.05, t(132));
        
        clickSynth.triggerAttackRelease(n16, t(150));
        
        // Scene C
        const kicks2 = [144, 160, 176, 192, 208];
        kicks2.forEach(f => kickSynth.triggerAttackRelease("D1", n8, t(f), 0.55));
        
        const hats2 = [152, 168, 184, 200];
        hats2.forEach(f => hatSynth.triggerAttackRelease(n16, t(f), 0.15));
        
        const hClicks = [168, 172, 176];
        hClicks.forEach(f => highlightClickSynth.triggerAttackRelease(n16, t(f)));
        
        // PAD Asus4 (f176-240)
        padSynth.triggerAttackRelease(["A2", "D3", "E3", "A3", "D4"], t(240) - t(176) + 0.05, t(176));
        
        bellSynth.triggerAttackRelease("F#5", n8, t(192), 0.5);
        bellSynth.triggerAttackRelease("A5", n8, t(200), 0.5);
        bellSynth.triggerAttackRelease("D6", n8, t(208), 0.5);
        
        // PRE-SWELL f212-224
        swellNoise.start(t(212)); swellNoise.stop(t(224));
        swellFilter.frequency.setValueAtTime(400, t(212));
        swellFilter.frequency.exponentialRampToValueAtTime(3000, t(224));
        swellBus.volume.setValueAtTime(-60, t(212));
        swellBus.volume.linearRampToValueAtTime(-20, t(224));
        
        // T3 f224
        thudSynth.triggerAttackRelease("A1", n8, t(224), 1);
        knockSynth.triggerAttackRelease(n16, t(224));
        
        whooshNoise.start(t(224)); whooshNoise.stop(t(242));
        whooshFilter.frequency.setValueAtTime(900, t(224));
        whooshFilter.frequency.exponentialRampToValueAtTime(6000, t(242));
        whooshBus.volume.setValueAtTime(-100, t(224));
        whooshBus.volume.linearRampToValueAtTime(-24, t(224 + 18*0.6));
        whooshBus.volume.linearRampToValueAtTime(-100, t(242));
        
        // Sign-off f240
        padSynth.set({ envelope: { attack: 0.05 } });
        padSynth.triggerAttackRelease(["D2", "A2", "F#3", "A3", "E4", "D5"], 2.5, t(240));
        
        kickSynth.triggerAttackRelease("D1", n8, t(240), 0.9);
        bellSynth.triggerAttackRelease("D5", n8, t(240), 0.5);
        clickSynth.triggerAttackRelease(n16, t(240));
        
        clickSynth.triggerAttackRelease(n16, t(248));
        clickSynth.triggerAttackRelease(n16, t(252));
        clickSynth.triggerAttackRelease(n16, t(264));
        // at f280 D6 velocity .45, A6 velocity .35
        // Since we can only pass one velocity array to PolySynth if we want different velocities, or just trigger individually. Let's trigger individually but slightly offset A6 by 0.001s
        bellSynth.triggerAttackRelease("D6", n8, t(280), 0.45);
        bellSynth.triggerAttackRelease("A6", n8, t(280) + 0.001, 0.35);
        
        // ARPEGGIO logic
        function scheduleArp(pattern, startF, endF) {
            let step = 0;
            let panSign = 1;
            for (let f = startF; f < endF; f += 4) {
                const note = pattern[step % pattern.length];
                const vel = (step % 8 === 0 || step % 8 === 4) ? 0.55 : 0.4;
                
                console.log(`Arp scheduling: f=${f}, note=${note}`);
                pluckPanner.pan.setValueAtTime(0.15 * panSign, t(f));
                panSign *= -1;
                
                pluckSynth.triggerAttackRelease(note, n16, t(f), vel);
                step++;
            }
        }
        
        const arpBm9 = ["B3", "F#4", "A4", "C#5", "A4", "F#4", "D5", "C#5"];
        scheduleArp(arpBm9, 76, 88);
        
        const arpGmaj9 = ["G3", "D4", "F#4", "B4", "F#4", "D4", "A4", "F#4"];
        scheduleArp(arpGmaj9, 88, 128); // to f124 (stops before 128)
        
        const arpD69 = ["D4", "A4", "B4", "E5", "F#5", "E5", "B4", "A4"];
        scheduleArp(arpD69, 152, 176);
        
        const arpAsus4 = ["A3", "D4", "E4", "A4", "D5", "E5", "D5", "A4"];
        scheduleArp(arpAsus4, 176, 216); // through f212
        
        // MASTER FADE
        masterBus.gain.setValueAtTime(1, t(285));
        masterBus.gain.linearRampToValueAtTime(0, t(300) - 0.01);
        
        // Global makeup gain
        const targetGain = 1.4; // We'll adjust this if needed
        masterBus.gain.value = targetGain;
        
    }, 10.000, 2, 48000);
    
    // convert to base64
    const wavBuffer = encodeWAV([out.getChannelData(0), out.getChannelData(1)], 48000);
    const bytes = new Uint8Array(wavBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
