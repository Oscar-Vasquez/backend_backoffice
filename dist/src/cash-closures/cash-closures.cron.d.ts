import { SchedulerRegistry } from '@nestjs/schedule';
import { CashClosuresService } from './cash-closures.service';
export declare class CashClosuresCronService {
    private readonly cashClosuresService;
    private readonly schedulerRegistry;
    private readonly logger;
    constructor(cashClosuresService: CashClosuresService, schedulerRegistry: SchedulerRegistry);
    checkAndProcessAutomaticCashClosures(): Promise<void>;
    automaticCashClosure(): Promise<void>;
    automaticCashOpening(): Promise<void>;
    getNextScheduledExecutions(): {
        success: boolean;
        currentTime: string;
        currentTimeLocal: string;
        timeZone: string;
        jobs: {};
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        currentTime?: undefined;
        currentTimeLocal?: undefined;
        timeZone?: undefined;
        jobs?: undefined;
    };
}
