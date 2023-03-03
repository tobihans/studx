/**
 * A simple event bus.
 *
 * It can be used to pass event between named views, e.g
 */
export default class EventBus extends EventTarget {
  constructor() {
    super();
  }

  /**
   * Subscribe to an event
   *
   * @template T - The type of the details passed in the CustomEvent
   * @param {string} eventName - The event name
   * @param {(event: CustomEvent<T>) => void} callback - A function that will be called when that event is fired
   */
  public on<T>(eventName: string, callback: (event: CustomEvent<T>) => void) {
    this.addEventListener(eventName, callback as EventListener);
  }

  /**
   * Subscribe to an event once
   *
   * @template T - The type of the details passed in the CustomEvent
   * @param {string} eventName - The event name
   * @param {(event: CustomEvent<T>) => void} callback - A function that will be called only once, when that event is fired
   */
  public once<T>(eventName: string, callback: (event: CustomEvent<T>) => void) {
    this.addEventListener(eventName, callback as EventListener, {
      once: true,
    });
  }

  /**
   * Unsubscribe from an event listener
   *
   * @template T - The type of the details passed in the CustomEvent
   * @param {string} eventName - The event name
   * @param {(event: CustomEvent<T>) => void} callback - The callback to remove
   */
  public off<T>(eventName: string, callback: (event: CustomEvent<T>) => void) {
    this.removeEventListener(eventName, callback as EventListener);
  }

  /**
   * Emit an event
   *
   * @template T - The type of the details passed in the CustomEvent
   * @param {string} eventName - The event name
   * @param {T} detail - Custom data passed with the event
   */
  public emit<T>(eventName: string, detail: T) {
    this.dispatchEvent(new CustomEvent<T>(eventName, { detail }));
  }
}
