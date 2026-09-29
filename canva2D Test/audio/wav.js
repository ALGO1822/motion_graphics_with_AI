export function encodeWAV(buffers, sampleRate) {
    const numChannels = buffers.length;
    const numSamples = buffers[0].length;
    const bytesPerSample = 3; // 24-bit
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * blockAlign;
    
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    
    const writeString = (view, offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
    
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 24, true); // bits per sample
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
        for (let channel = 0; channel < numChannels; channel++) {
            let sample = buffers[channel][i];
            sample = Math.max(-1, Math.min(1, sample));
            let s = sample < 0 ? sample * 0x800000 : sample * 0x7FFFFF;
            s = Math.round(s);
            view.setUint8(offset, s & 0xFF);
            view.setUint8(offset + 1, (s >> 8) & 0xFF);
            view.setUint8(offset + 2, (s >> 16) & 0xFF);
            offset += 3;
        }
    }
    
    return buffer;
}
