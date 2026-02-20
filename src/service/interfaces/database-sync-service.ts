export interface DatabaseSyncService {
    syncTableFromTemplate(): void;
    pushTableToTemplate(): void;
}
