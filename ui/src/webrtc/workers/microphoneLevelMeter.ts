// @ts-nocheck

/**
 * AudioWorklet used to analyze user microphone activity
 * @extends AudioWorklet
 * Inspired by https://www.webrtc-developers.com/how-to-know-if-my-microphone-works/#capture-the-output-stream
 */
export class MicrophoneLevelMeter extends AudioWorkletProcessor {
  static SMOOTHING_FACTOR = 0.99;

  #volume = 0;

  constructor() {
    super();
    this.port.onmessage = this.#onMessage.bind(this);
  }

  #onMessage(event) {
    // eslint-disable-next-line
    console.log("Audio Level Meter got a new event: ", event);
  }

  // eslint-disable-next-line
  process(inputs, _outputs, _params) {
    const input = inputs[0];
    const samples = input[0];

    const squaresSum = samples.reduce(
      (accumulator, c) => accumulator + c * c,
      0
    );
    const samplesLength = samples.length || 1;

    this.#volume = Math.max(
      Math.sqrt(squaresSum / samplesLength),
      this.#volume * MicrophoneLevelMeter.SMOOTHING_FACTOR
    );
    this.port.postMessage({ volume: this.#volume });

    return true;
  }
}

registerProcessor("microphone-level-meter", MicrophoneLevelMeter);
