export interface ICalendarOrder {
    Id?: number;
    Chamber: string;
    Step: number;
    Name: string;
    IsConsent: boolean;
    SortIndex: number;
    UserDefined: boolean;
    // Items?: string;
    Modified: Date;
}

export interface ITaskUpdate {
    Id: number;
    EntityType: string;
    properties: any;
}