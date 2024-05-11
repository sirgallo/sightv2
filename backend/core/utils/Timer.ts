export class TimerUtil {
  private _timerMap: Map<string, { start: Date, stop: Date }> = new Map();
  constructor(private _label: string) {}

  get label() { return this._label; }

  start = (timer: string) => {
    const now = new Date();
    const payload = { start: now, stop: null };
    this._timerMap.set(timer, payload);
  }

  stop = (timer: string) => {
    const now = new Date();
    const payload = this._timerMap.get(timer);
    if (! payload) throw new Error('current timer not in timer map');

    const updatedPayload = { ...payload, stop: now };
    this._timerMap.set(timer, updatedPayload);
  }

  getResults = (timer: string): { start: Date, stop: Date, elapsed: number } => {
    const payload = this._timerMap.get(timer);
    if (! payload || ! payload.stop) throw new Error('missing or unfinished timer');
    return { ...payload, elapsed: payload.stop.getTime() - payload.start.getTime() };
  }

  clear = () => { this._timerMap.clear(); }
}