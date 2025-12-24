export class ExampleEntity {
  message: string;
  time: string;

  constructor(message: string, time: string) {
    this.message = message;
    this.time = time;
  }

  toJSON() {
    return { message: this.message, time: this.time };
  }
}
