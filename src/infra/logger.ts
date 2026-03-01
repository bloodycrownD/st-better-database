export class Logger {
    private static readonly _instance = new Logger();
    private debugEnabled: boolean = false;

    private constructor() {
    }

    public static get instance(): Logger {
        return Logger._instance;
    }

    public setDebugMode(enabled: boolean): void {
        this.debugEnabled = enabled;
    }

    public debug(tag: string, message: string, ...args: any[]): void {
        if (this.debugEnabled) {
            console.log(`[${tag}] ${message}`, ...args);
        }
    }

    public info(tag: string, message: string, ...args: any[]): void {
        console.log(`[${tag}] ${message}`, ...args);
    }

    public warn(tag: string, message: string, ...args: any[]): void {
        console.warn(`[${tag}] ${message}`, ...args);
    }

    public error(tag: string, message: string, ...args: any[]): void {
        console.error(`[${tag}] ${message}`, ...args);
    }
}

export const logger = Logger.instance;
